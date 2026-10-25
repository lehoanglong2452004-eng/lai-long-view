import { useEffect, useMemo, useRef, useState } from 'react';
import { ChartEngine, type Overlays } from '../chart/ChartEngine';
import { analyze, lastAnchor } from '../engine/analyze';
import { buildStory, type Story } from '../engine/context';
import { avwap, vwapPeriodic } from '../engine/indicators';
import type { Bar } from '../engine/types';
import { FEEDS, mergeBar } from '../data/feeds';
import { SOURCE_LABEL, TF_MS, TIMEFRAMES, type SourceId, type Status, type TF } from '../data/types';
import { statusLabel, statusTitle, t } from '../i18n';
import type { ChartCfg, Settings } from '../store';
import type { SyncBus } from '../sync';

export interface PaneStory { story: Story | null; status?: Status; error?: string; bars: number }

interface Series { key: string; bars: Bar[]; status?: Status; error?: string; loading: boolean }

function useSeries(source: SourceId, symbol: string, tf: TF): Series {
  const key = `${source}:${symbol}:${tf}`;
  const [s, set] = useState<Series>({ key, bars: [], loading: true });
  useEffect(() => {
    let alive = true;
    let current: Bar[] = [];
    let queue: Bar[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let unsub = () => {};
    set({ key, bars: [], loading: true });
    FEEDS[source].history(symbol, tf).then((h) => {
      if (!alive) return;
      current = h.bars;
      set({ key, bars: current, status: h.status, loading: false });
      unsub = FEEDS[source].subscribe(symbol, tf, (b) => {
        queue.push(b);
        timer ??= setTimeout(() => {
          timer = undefined;
          for (const q of queue) current = mergeBar(current, q);
          queue = [];
          if (alive) set((prev) => ({ ...prev, bars: current }));
        }, 500);
      });
    }).catch((e) => alive && set({ key, bars: [], loading: false, error: String(e?.message || e) }));
    return () => { alive = false; unsub(); clearTimeout(timer); };
  }, [key, source, symbol, tf]);
  return s;
}

interface Props {
  cfg: ChartCfg;
  settings: Settings;
  active: boolean;
  maximized: boolean;
  canRemove: boolean;
  bus: SyncBus;
  onActivate: () => void;
  onChange: (patch: Partial<ChartCfg>) => void;
  onMaximize: () => void;
  onRemove: () => void;
  onStory: (id: string, s: PaneStory) => void;
}

export function ChartPane({ cfg, settings, active, maximized, canRemove, bus, onActivate, onChange, onMaximize, onRemove, onStory }: Props) {
  const lang = settings.lang;
  const src = cfg.inst.sources[cfg.src] ?? cfg.inst.sources[0];
  const tf = settings.sync ? settings.syncTf : cfg.tf;
  const series = useSeries(src.source, src.symbol, tf);
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ChartEngine | null>(null);
  const lastKey = useRef('');

  const analysis = useMemo(() => (series.bars.length >= 80 ? analyze(series.bars) : null), [series.bars]);

  const overlays = useMemo<Overlays>(() => {
    const bars = series.bars;
    if (!bars.length) return {};
    const ms = TF_MS[tf];
    const ov: Overlays = {};
    const on = settings.showVWAP;
    if (on && settings.vwap.D && ms < TF_MS['1D']) ov.vwapD = vwapPeriodic(bars, 'D').vwap;
    if (on && settings.vwap.W && ms < TF_MS['1W']) ov.vwapW = vwapPeriodic(bars, 'W').vwap;
    if (on && settings.vwap.M && ms < TF_MS['1M']) ov.vwapM = vwapPeriodic(bars, 'M').vwap;
    if (analysis) {
      if (on && settings.avwap) {
        const bull = lastAnchor(analysis, 1), bear = lastAnchor(analysis, -1);
        if (bull) ov.avwapBull = avwap(bars, bull.i);
        if (bear) ov.avwapBear = avwap(bars, bear.i);
      }
      ov.events = analysis.events;
      ov.boxes = analysis.boxes;
    }
    return ov;
  }, [series.bars, analysis, tf, settings.showVWAP, settings.vwap, settings.avwap]);

  const story = useMemo(() => (analysis ? buildStory(series.bars, analysis, lang) : null), [analysis, series.bars, lang]);

  useEffect(() => {
    onStory(cfg.id, { story, status: series.status ?? src.status, error: series.error, bars: series.bars.length });
  }, [story, series.status, series.error, cfg.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const engine = new ChartEngine(hostRef.current!, {
      theme: settings.theme, showVP: settings.showVP, vpSide: settings.vpSide, vpWidth: settings.vpWidth, vpRows: settings.vpRows,
      showEvents: settings.wyckoff, showBoxes: settings.wyckoff, watermark: settings.watermark, tfMs: TF_MS[tf], font: '"IBM Plex Mono", monospace',
    });
    engineRef.current = engine;
    return () => { engine.destroy(); engineRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    engineRef.current?.setOptions({
      theme: settings.theme, showVP: settings.showVP, vpSide: settings.vpSide, vpWidth: settings.vpWidth, vpRows: settings.vpRows,
      showEvents: settings.wyckoff, showBoxes: settings.wyckoff, watermark: settings.watermark, tfMs: TF_MS[tf],
    });
  }, [settings, tf]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    const reset = lastKey.current !== series.key;
    if (series.bars.length) lastKey.current = series.key;
    e.setData(series.bars, overlays, reset);
  }, [series.bars, series.key, overlays]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    if (!settings.sync) {
      e.onCrosshair = undefined;
      e.onView = undefined;
      e.setCrosshairTime(null);
      return;
    }
    e.onCrosshair = (time) => bus.crosshair(cfg.id, time);
    e.onView = (v) => bus.scroll(cfg.id, v);
    return bus.join(cfg.id, (time) => e.setCrosshairTime(time), (v) => e.setView(v));
  }, [settings.sync, bus, cfg.id]);

  const status = series.status ?? src.status;
  const name = lang === 'vi' ? cfg.inst.vi : cfg.inst.en;
  const noVol = series.bars.length > 0 && !series.bars.some((b) => b.v > 0);

  return (
    <div className={`pane${active ? ' active' : ''}`} onMouseDown={onActivate}>
      <div className="pane-head">
        <span className="sym">{cfg.inst.display}</span>
        <span className="name" title={name}>{name}</span>
        <select className="src" value={cfg.src} onChange={(e) => onChange({ src: Number(e.target.value) })} title={src.note}>
          {cfg.inst.sources.map((s, i) => (
            <option key={`${s.source}:${s.symbol}`} value={i}>
              {SOURCE_LABEL[s.source]} · {s.symbol}{s.note ? ` · ${s.note}` : ''} · {statusLabel(s.status, lang)}
            </option>
          ))}
        </select>
        <span className={`badge ${status?.mode ?? 'unknown'}`} title={statusTitle(status, lang)}>{statusLabel(status, lang)}</span>
        {noVol && <span className="badge novol" title={t('noVolume', lang)}>NO VOL</span>}
        <select className="tf" value={tf} disabled={settings.sync} onChange={(e) => onChange({ tf: e.target.value as TF })} title={settings.sync ? t('syncHint', lang) : undefined}>
          {TIMEFRAMES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <span className="spacer" />
        <button className="icon" title={t('minimize', lang)} onClick={(e) => { e.stopPropagation(); onChange({ minimized: true }); }}>–</button>
        <button className="icon" title={t(maximized ? 'restore' : 'maximize', lang)} onClick={(e) => { e.stopPropagation(); onMaximize(); }}>{maximized ? '❐' : '□'}</button>
        {canRemove && <button className="icon" title={t('remove', lang)} onClick={(e) => { e.stopPropagation(); onRemove(); }}>×</button>}
      </div>
      <div className="pane-body">
        <div className="canvas-host" ref={hostRef} />
        {series.loading && <div className="pane-msg">{t('loading', lang)}</div>}
        {series.error && <div className="pane-msg err">{t('loadError', lang)}: {series.error}</div>}
      </div>
    </div>
  );
}

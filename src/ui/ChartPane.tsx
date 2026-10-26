import { useEffect, useMemo, useRef } from 'react';
import { ChartEngine, type Overlays } from '../chart/ChartEngine';
import { analyze, lastAnchor } from '../engine/analyze';
import { buildStory, type Story } from '../engine/context';
import { avwap, vwapPeriodic } from '../engine/indicators';
import { aggSourcesOf, useSeries } from '../data/series';
import { SOURCE_LABEL, TF_MS, TIMEFRAMES, type Status, type TF } from '../data/types';
import { statusLabel, statusTitle, t } from '../i18n';
import type { ChartCfg, Settings } from '../store';
import type { SyncBus } from '../sync';

export interface PaneStory { story: Story | null; status?: Status; error?: string; bars: number }

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
  const aggCandidates = useMemo(() => (cfg.inst.kind === 'crypto' ? aggSourcesOf(src, cfg.inst.sources) : []), [cfg.inst, src]);
  const series = useSeries(src, tf, cfg.agg ? aggCandidates : []);
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
    // Merged volume trims the series to the span every exchange covers, so re-center once when it arrives.
    const viewKey = series.key + (series.agg ? ':agg' : '');
    const reset = lastKey.current !== viewKey;
    if (series.bars.length) lastKey.current = viewKey;
    e.setData(series.bars, overlays, reset);
  }, [series.bars, series.key, series.agg, overlays]);

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
        {aggCandidates.length > 0 && (
          <button className={`agg${cfg.agg ? ' on' : ''}`} title={t('aggHint', lang)} onClick={(e) => { e.stopPropagation(); onChange({ agg: !cfg.agg }); }}>
            {t('aggVol', lang)}
          </button>
        )}
        {cfg.agg && series.aggPending && <span className="badge unknown">{t('aggLoading', lang)}</span>}
        {cfg.agg && series.agg && (
          <span
            className="badge agg-badge"
            title={[`Spot: ${series.agg.spot.join(', ') || '—'}`, `Futures: ${series.agg.futures.join(', ') || '—'}`, series.agg.skipped.length ? `${t('aggSkipped', lang)}: ${series.agg.skipped.map((x) => `${x.name} (${t(x.why === 'error' ? 'aggError' : 'aggMismatch', lang)})`).join(', ')}` : ''].filter(Boolean).join(' · ')}
          >
            <span className="vs">Spot ×{series.agg.spot.length}</span> · <span className="vf">Futures ×{series.agg.futures.length}</span>
          </span>
        )}
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

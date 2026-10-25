import { useCallback, useEffect, useMemo, useState } from 'react';
import { TIMEFRAMES, type Instrument, type TF } from './data/types';
import { t } from './i18n';
import { DEFAULT_KEYS, DEFAULT_SETTINGS, gridFor, loadState, newId, saveState, type AppState, type ChartCfg, type Settings } from './store';
import { SyncBus } from './sync';
import { ChartPane, type PaneStory } from './ui/ChartPane';
import { ContextTab } from './ui/ContextTab';
import { SearchBox } from './ui/SearchBox';
import { SettingsPanel } from './ui/SettingsPanel';

function makeChart(cat: Instrument[], key: string, tf: TF): ChartCfg | null {
  const inst = cat.find((c) => c.display === key);
  return inst ? { id: newId(), inst, src: 0, tf, minimized: false } : null;
}

export function App() {
  const [state, setState] = useState<AppState | null>(() => loadState());
  const [catalog, setCatalog] = useState<Instrument[]>([]);
  const [bootError, setBootError] = useState<string | null>(null);
  const [stories, setStories] = useState<Record<string, PaneStory>>({});
  const [showSettings, setShowSettings] = useState(false);
  const bus = useMemo(() => new SyncBus(), []);

  useEffect(() => {
    fetch('/api/catalog')
      .then((r) => r.json())
      .then((cat: Instrument[]) => {
        setCatalog(cat);
        setState((s) => {
          if (s) return s;
          const charts = DEFAULT_KEYS.slice(0, 3).map(([k, tf]) => makeChart(cat, k, tf)).filter(Boolean) as ChartCfg[];
          return { charts, activeId: charts[0].id, maxId: null, tab: 'charts', settings: DEFAULT_SETTINGS };
        });
      })
      .catch((e) => setBootError(String(e?.message || e)));
  }, []);

  useEffect(() => { if (state) saveState(state); }, [state]);

  const onStory = useCallback((id: string, s: PaneStory) => setStories((prev) => ({ ...prev, [id]: s })), []);

  if (!state) {
    return <div className="boot">{bootError ? `Lai Long View: ${bootError}` : 'Lai Long View…'}</div>;
  }

  const { charts, settings } = state;
  const lang = settings.lang;
  const active = charts.find((c) => c.id === state.activeId) ?? charts[0];

  const patch = (p: Partial<AppState>) => setState((s) => (s ? { ...s, ...p } : s));
  const setSettings = (p: Partial<Settings>) => setState((s) => (s ? { ...s, settings: { ...s.settings, ...p } } : s));
  const patchChart = (id: string, p: Partial<ChartCfg>) =>
    setState((s) => (s ? { ...s, charts: s.charts.map((c) => (c.id === id ? { ...c, ...p } : c)), maxId: p.minimized && s.maxId === id ? null : s.maxId } : s));

  const setCount = (n: number) => setState((s) => {
    if (!s) return s;
    let list = s.charts.slice(0, n);
    for (const [k, tf] of DEFAULT_KEYS) {
      if (list.length >= n) break;
      if (list.some((c) => c.inst.display === k)) continue;
      const c = makeChart(catalog, k, tf);
      if (c) list = [...list, c];
    }
    const activeId = list.some((c) => c.id === s.activeId) ? s.activeId : list[0].id;
    return { ...s, charts: list, activeId, maxId: list.some((c) => c.id === s.maxId) ? s.maxId : null };
  });

  const pickTf = (tf: TF) => {
    if (settings.sync) setSettings({ syncTf: tf });
    else patchChart(active.id, { tf });
  };

  const visible = charts.filter((c) => !c.minimized && (!state.maxId || c.id === state.maxId));
  const docked = charts.filter((c) => c.minimized);
  const grid = gridFor(visible.length);
  const activeTf = settings.sync ? settings.syncTf : active.tf;

  return (
    <div className="app">
      <header className="toolbar">
        <div className="brand" data-tip={t('copyright', lang)} aria-label={t('copyright', lang)}><img src="/logo-96.png" alt="" />LAI LONG VIEW</div>
        <SearchBox lang={lang} onPick={(inst, src) => patchChart(active.id, { inst, src })} />
        <div className="group tfs">
          {TIMEFRAMES.map((x) => (
            <button key={x} className={x === activeTf ? 'on' : ''} onClick={() => pickTf(x)}>{x}</button>
          ))}
        </div>
        <div className="group">
          <button className={settings.showVP ? 'on' : ''} title={t('vpHint', lang)} onClick={() => setSettings({ showVP: !settings.showVP })}>VP</button>
          <button className={settings.showVWAP ? 'on' : ''} onClick={() => setSettings({ showVWAP: !settings.showVWAP })}>VWAP</button>
          <button className={settings.wyckoff ? 'on' : ''} title={t('eventsHint', lang)} onClick={() => setSettings({ wyckoff: !settings.wyckoff })}>{t('events', lang)}</button>
        </div>
        <label className="switch" title={t('syncHint', lang)}>
          <input type="checkbox" checked={settings.sync} onChange={(e) => setSettings({ sync: e.target.checked, syncTf: active.tf })} />
          <span className="knob" />
          {t('sync', lang)}
        </label>
        <label className="count">
          {t('layout', lang)}
          <select value={charts.length} onChange={(e) => setCount(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, k) => k + 1).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <div className="settings-wrap">
          <button className={showSettings ? 'on' : ''} onClick={() => setShowSettings((v) => !v)}>{t('settings', lang)}</button>
          {showSettings && <SettingsPanel settings={settings} onChange={setSettings} />}
        </div>
        <button className="lang" onClick={() => setSettings({ lang: lang === 'vi' ? 'en' : 'vi' })}>{lang === 'vi' ? 'VI | en' : 'vi | EN'}</button>
        <span className="spacer" />
        <nav className="tabs">
          <button className={state.tab === 'charts' ? 'on' : ''} onClick={() => patch({ tab: 'charts' })}>{t('charts', lang)}</button>
          <button className={state.tab === 'context' ? 'on' : ''} onClick={() => patch({ tab: 'context' })}>{t('context', lang)}</button>
        </nav>
      </header>

      <main className={state.tab === 'charts' ? 'charts' : 'charts hidden'}>
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))` }}
        >
          {charts.map((c) => {
            const idx = visible.indexOf(c);
            const shown = idx >= 0;
            return (
              <div
                key={c.id}
                className="cell"
                style={{ display: shown ? undefined : 'none', gridRow: shown && visible.length === 3 && idx === 0 ? 'span 2' : undefined }}
              >
                <ChartPane
                  cfg={c}
                  settings={settings}
                  active={c.id === active.id}
                  maximized={state.maxId === c.id}
                  canRemove={charts.length > 1}
                  bus={bus}
                  onActivate={() => c.id !== state.activeId && patch({ activeId: c.id })}
                  onChange={(p) => patchChart(c.id, p)}
                  onMaximize={() => patch({ maxId: state.maxId === c.id ? null : c.id, activeId: c.id })}
                  onRemove={() => setState((s) => {
                    if (!s) return s;
                    const list = s.charts.filter((x) => x.id !== c.id);
                    return { ...s, charts: list, activeId: s.activeId === c.id ? list[0].id : s.activeId, maxId: s.maxId === c.id ? null : s.maxId };
                  })}
                  onStory={onStory}
                />
              </div>
            );
          })}
        </div>
        {docked.length > 0 && (
          <div className="dock">
            {docked.map((c) => (
              <button key={c.id} onClick={() => patchChart(c.id, { minimized: false })} title={t('restore', lang)}>
                ▢ {c.inst.display} · {settings.sync ? settings.syncTf : c.tf}
              </button>
            ))}
          </div>
        )}
      </main>

      {state.tab === 'context' && (
        <ContextTab charts={charts} stories={stories} settings={settings} onOpen={(id) => patch({ tab: 'charts', activeId: id, charts: charts.map((c) => (c.id === id ? { ...c, minimized: false } : c)) })} />
      )}
    </div>
  );
}

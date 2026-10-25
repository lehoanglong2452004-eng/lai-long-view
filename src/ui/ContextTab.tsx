import { FAMILY_NAMES } from '../engine/patterns';
import { SOURCE_LABEL } from '../data/types';
import { statusLabel, statusTitle, t } from '../i18n';
import type { ChartCfg, Settings } from '../store';
import type { PaneStory } from './ChartPane';

interface Props {
  charts: ChartCfg[];
  stories: Record<string, PaneStory>;
  settings: Settings;
  onOpen: (id: string) => void;
}

const pad2 = (x: number) => String(x).padStart(2, '0');

export function ContextTab({ charts, stories, settings, onOpen }: Props) {
  const lang = settings.lang;
  return (
    <div className="context">
      <p className="disclaimer">{t('disclaimer', lang)}</p>
      <div className="context-grid">
        {charts.map((c) => {
          const ps = stories[c.id];
          const st = ps?.story;
          const src = c.inst.sources[c.src] ?? c.inst.sources[0];
          const tf = settings.sync ? settings.syncTf : c.tf;
          return (
            <article key={c.id} className="story">
              <header>
                <span className="sym">{c.inst.display}</span>
                <span>· {tf} · {SOURCE_LABEL[src.source]} {src.symbol}</span>
                <span className={`badge ${ps?.status?.mode ?? 'unknown'}`} title={statusTitle(ps?.status, lang)}>{statusLabel(ps?.status, lang)}</span>
                <span className="spacer" />
                <button onClick={() => onOpen(c.id)}>{t('openChart', lang)}</button>
              </header>
              {!st && <p className="muted">{ps?.error ? `${t('loadError', lang)}: ${ps.error}` : t('loading', lang)}</p>}
              {st && (
                <>
                  <dl>
                    <dt>{t('supplyDemand', lang)}</dt><dd>{st.supplyDemand}</dd>
                    <dt>{t('effort', lang)}</dt><dd>{st.effort}</dd>
                    <dt>{t('cause', lang)}</dt><dd>{st.cause}</dd>
                    <dt>{t('phase', lang)}</dt><dd className="strong">{st.phase}</dd>
                    <dt>{t('patterns', lang)}</dt>
                    <dd>
                      {st.matches.length === 0 && <span className="muted">{t('none', lang)}</span>}
                      {st.matches.map((m) => (
                        <div key={m.def.id} className="match">
                          <span className={`dir ${m.dir === 1 ? 'up' : m.dir === -1 ? 'down' : ''}`}>{m.dir === 1 ? '▲' : m.dir === -1 ? '▼' : '•'}</span>
                          <span className="pid">#{m.def.id}</span>
                          <span className="score">{m.score}</span>
                          <span>{lang === 'vi' ? m.def.vi : m.def.en}</span>
                          {m.def.family && <span className="fam">{FAMILY_NAMES[m.def.family][lang]}</span>}
                        </div>
                      ))}
                    </dd>
                    <dt>{t('scenario', lang)}</dt><dd>{st.scenario}</dd>
                    <dt>{t('invalidation', lang)}</dt><dd>{st.invalidation}</dd>
                  </dl>
                  <div className="recent">
                    <div className="recent-title">{t('recent', lang)}</div>
                    {st.recent.length === 0 && <div className="muted">{t('none', lang)}</div>}
                    {st.recent.map(({ ev, text, time }) => {
                      const d = new Date(time);
                      return (
                        <div key={`${ev.code}@${ev.at}`} className="recent-row">
                          <span className="time">{pad2(d.getDate())}/{pad2(d.getMonth() + 1)} {pad2(d.getHours())}:{pad2(d.getMinutes())}</span>
                          <span className={`code ${ev.dir === 1 ? 'up' : ev.dir === -1 ? 'down' : ''}`}>{ev.code}</span>
                          <span>{text}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

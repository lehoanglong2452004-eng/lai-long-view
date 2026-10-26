import { useEffect, useRef, useState } from 'react';
import type { Lang } from '../engine/context';
import type { TF } from '../data/types';
import { t } from '../i18n';
import type { ChartCfg } from '../store';

export interface SavedLayout { name: string; savedAt: number; state: { charts: ChartCfg[]; sync: boolean; syncTf: TF } }

interface Props { lang: Lang; current: () => SavedLayout['state']; onLoad: (l: SavedLayout) => void }

const pad2 = (x: number) => String(x).padStart(2, '0');

/** Layouts are stored by the Lai Long View server, so every device using it sees the same list. */
export function LayoutMenu({ lang, current, onLoad }: Props) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<SavedLayout[]>([]);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  const call = async (init?: RequestInit, query = '') => {
    const res = await fetch(`/api/layouts${query}`, init);
    if (!res.ok) throw new Error(String(res.status));
    setList(await res.json());
  };

  useEffect(() => {
    if (open) call().catch(() => setErr(t('layoutServerError', lang)));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  const save = async () => {
    if (!name.trim()) { setErr(t('layoutNameRequired', lang)); return; }
    try {
      await call({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), state: current() }) });
      setName('');
      setErr('');
    } catch {
      setErr(t('layoutServerError', lang));
    }
  };

  return (
    <div className="settings-wrap" ref={boxRef}>
      <button className={open ? 'on' : ''} onClick={() => setOpen((v) => !v)}>{t('layouts', lang)}</button>
      {open && (
        <div className="settings layouts">
          <div className="settings-title">{t('saveLayout', lang)}</div>
          <div className="layout-save">
            <input
              value={name}
              placeholder={t('layoutName', lang)}
              maxLength={60}
              onChange={(e) => { setName(e.target.value); setErr(''); }}
              onKeyDown={(e) => e.key === 'Enter' && save()}
            />
            <button onClick={save}>{t('save', lang)}</button>
          </div>
          {err && <div className="field-error">{err}</div>}
          <div className="settings-title">{t('savedLayouts', lang)}</div>
          {list.length === 0 && <div className="muted">{t('noLayouts', lang)}</div>}
          {list.map((l) => {
            const d = new Date(l.savedAt);
            return (
              <div key={l.name} className="layout-row">
                <button className="layout-open" title={l.state.charts.map((c) => `${c.inst.display} ${c.tf}`).join(' · ')} onClick={() => { onLoad(l); setOpen(false); }}>
                  <span className="layout-name">{l.name}</span>
                  <span className="muted">{l.state.charts.length} chart · {pad2(d.getDate())}/{pad2(d.getMonth() + 1)}</span>
                </button>
                <button
                  className="icon"
                  aria-label={`${t('deleteLayout', lang)} ${l.name}`}
                  title={t('deleteLayout', lang)}
                  onClick={() => call({ method: 'DELETE' }, `?name=${encodeURIComponent(l.name)}`).catch(() => setErr(t('layoutServerError', lang)))}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { Lang } from '../engine/context';
import { SOURCE_LABEL, type Instrument } from '../data/types';
import { KIND_LABEL, statusLabel, statusTitle, t } from '../i18n';

interface Props { lang: Lang; onPick: (inst: Instrument, src: number) => void }

export function SearchBox({ lang, onPick }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Instrument[]>([]);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        setItems(res.ok ? await res.json() : []);
        setSel(0);
      } catch { /* aborted or offline */ }
      setBusy(false);
    }, 250);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [q, open]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  const pick = (inst: Instrument, src = 0) => {
    onPick(inst, src);
    setOpen(false);
    setQ('');
  };

  return (
    <div className="search" ref={boxRef}>
      <input
        value={q}
        placeholder={t('search', lang)}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
          if (e.key === 'Enter' && items[sel]) pick(items[sel]);
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && (
        <div className="search-list">
          {busy && !items.length && <div className="search-empty">{t('loading', lang)}</div>}
          {!busy && !items.length && <div className="search-empty">{t('noResults', lang)}</div>}
          {items.map((it, k) => (
            <div key={it.key} className={`search-row${k === sel ? ' sel' : ''}`} onMouseEnter={() => setSel(k)} onClick={() => pick(it)}>
              <div className="search-main">
                <span className="sym">{it.display}</span>
                <span className="name">{lang === 'vi' ? it.vi : it.en}</span>
                <span className="kind">{KIND_LABEL[it.kind]?.[lang] ?? it.kind}</span>
              </div>
              <div className="search-srcs">
                {it.sources.map((s, i) => (
                  <button
                    key={`${s.source}:${s.symbol}`}
                    className="chip"
                    title={`${s.symbol}${s.note ? ` · ${s.note}` : ''} · ${statusTitle(s.status, lang)}`}
                    onClick={(e) => { e.stopPropagation(); pick(it, i); }}
                  >
                    {SOURCE_LABEL[s.source]}
                    <span className={`badge ${s.status?.mode ?? 'unknown'}`}>{statusLabel(s.status, lang)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

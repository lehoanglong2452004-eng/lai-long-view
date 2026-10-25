import { LIGHT_THEME, THEME_LABELS } from '../chart/theme';
import { t } from '../i18n';
import type { Settings } from '../store';

interface Props { settings: Settings; onChange: (patch: Partial<Settings>) => void }

export function SettingsPanel({ settings: s, onChange }: Props) {
  const lang = s.lang;
  return (
    <div className="settings">
      <div className="settings-title">{t('colors', lang)}</div>
      <div className="color-grid">
        {THEME_LABELS.map(([k, vi, en]) => (
          <label key={k} className="color-row">
            <input type="color" value={s.theme[k]} onChange={(e) => onChange({ theme: { ...s.theme, [k]: e.target.value } })} />
            <span>{lang === 'vi' ? vi : en}</span>
          </label>
        ))}
      </div>
      <button onClick={() => onChange({ theme: LIGHT_THEME })}>{t('resetColors', lang)}</button>

      <div className="settings-title">Volume profile</div>
      <label className="row">
        <span>{t('vpSide', lang)}</span>
        <select value={s.vpSide} onChange={(e) => onChange({ vpSide: e.target.value as Settings['vpSide'] })}>
          <option value="right">{t('right', lang)}</option>
          <option value="left">{t('left', lang)}</option>
        </select>
      </label>
      <label className="row">
        <span>{t('vpWidth', lang)} {Math.round(s.vpWidth * 100)}%</span>
        <input type="range" min={10} max={50} step={1} value={Math.round(s.vpWidth * 100)} onChange={(e) => onChange({ vpWidth: Number(e.target.value) / 100 })} />
      </label>
      <label className="row">
        <span>{t('vpRows', lang)}</span>
        <input type="number" min={10} max={120} step={5} value={s.vpRows} onChange={(e) => onChange({ vpRows: Math.min(120, Math.max(10, Number(e.target.value) || 40)) })} />
      </label>

      <div className="settings-title">VWAP</div>
      {(['D', 'W', 'M'] as const).map((k) => (
        <label key={k} className="check">
          <input type="checkbox" checked={s.vwap[k]} onChange={(e) => onChange({ vwap: { ...s.vwap, [k]: e.target.checked } })} />
          {t(k === 'D' ? 'vwapSession' : k === 'W' ? 'vwapWeek' : 'vwapMonth', lang)}
        </label>
      ))}
      <label className="check">
        <input type="checkbox" checked={s.avwap} onChange={(e) => onChange({ avwap: e.target.checked })} />
        {t('avwap', lang)}
      </label>
      <label className="check">
        <input type="checkbox" checked={s.watermark} onChange={(e) => onChange({ watermark: e.target.checked })} />
        {t('watermark', lang)}
      </label>
    </div>
  );
}

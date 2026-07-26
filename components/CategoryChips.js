'use client';
import { CATEGORIES } from '../lib/constants';

export default function CategoryChips({ value, onChange, includeAll }) {
  return (
    <div className="pill-row">
      {includeAll && (
        <button type="button" className={'pill' + (value === 'alle' ? ' active' : '')} onClick={() => onChange('alle')}>
          Alle
        </button>
      )}
      {CATEGORIES.map((c) => (
        <button
          key={c.key}
          type="button"
          className={'pill' + (value === c.key ? ' active' : '')}
          onClick={() => onChange(c.key)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

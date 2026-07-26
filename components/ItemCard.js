'use client';
import { categoryLabel } from '../lib/constants';

export default function ItemCard({ item, onClick }) {
  return (
    <div className="card" onClick={() => onClick(item)}>
      {item.image ? <img src={item.image} alt={item.subtype || item.category} /> : <div className="thumb-fallback" />}
      <div className="card-body">
        <p className="card-title">{item.subtype || categoryLabel(item.category)}</p>
        <p className="card-sub">
          <span className="swatch" style={{ background: item.colorHex || '#ccc' }} />
          {item.colorLabel || ''} {item.size ? ('- ' + item.size) : ''}
        </p>
        {item.wornCount > 0 && <p className="card-sub">👕 {item.wornCount}× getragen</p>}
      </div>
    </div>
  );
}

'use client';

export default function ItemCard({ item, onClick, onToggleFavorite }) {
  return (
    <div className="card" onClick={() => onClick(item)}>
      {onToggleFavorite && (
        <button
          className={'fav-heart' + (item.isFavorite ? ' active' : '')}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }}
          aria-label="Favorit"
        >
          {item.isFavorite ? '♥' : '♡'}
        </button>
      )}
      {item.image ? <img src={item.image} alt={item.subtype || item.category} /> : <div className="thumb-fallback" />}
      <div className="card-body">
        <p className="card-title">{item.subtype || 'Ohne Namen'}</p>
      </div>
    </div>
  );
}

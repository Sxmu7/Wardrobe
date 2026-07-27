'use client';
import { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { categoryLabel } from '../../lib/constants';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export default function TrashPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const all = await db.getItems();
    const now = Date.now();
    const trashed = [];
    for (const i of all) {
      if (!i.trashedAt) continue;
      if (now - i.trashedAt > THIRTY_DAYS) {
        await db.deleteItem(i.id);
      } else {
        trashed.push(i);
      }
    }
    setItems(trashed.sort((a, b) => b.trashedAt - a.trashedAt));
    setLoading(false);
  }

  async function restore(item) {
    const { trashedAt, ...rest } = item;
    await db.addItem(rest);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  async function purgeNow(id) {
    if (!window.confirm('Dieses Teil endgueltig loeschen? Das kann nicht rueckgaengig gemacht werden.')) return;
    await db.deleteItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function daysLeft(trashedAt) {
    const left = THIRTY_DAYS - (Date.now() - trashedAt);
    return Math.max(0, Math.ceil(left / (24 * 60 * 60 * 1000)));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Papierkorb</h1>
        <p>Geloeschte Teile bleiben 30 Tage lang wiederherstellbar.</p>
      </div>

      {loading ? (
        <p className="card-sub">Lade...</p>
      ) : items.length === 0 ? (
        <div className="empty">Papierkorb ist leer.</div>
      ) : (
        <div className="grid-2">
          {items.map((item) => (
            <div key={item.id} className="card" style={{ cursor: 'default' }}>
              {item.image ? <img src={item.image} alt={item.subtype || ''} /> : <div className="thumb-fallback" />}
              <div className="card-body">
                <p className="card-title">{item.subtype || categoryLabel(item.category)}</p>
                <p className="card-sub">Noch {daysLeft(item.trashedAt)} Tage</p>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn btn-sm" onClick={() => restore(item)}>Wiederherstellen</button>
                  <button className="btn btn-sm btn-danger" onClick={() => purgeNow(item.id)}>Endgueltig</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

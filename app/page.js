'use client';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../lib/db';
import { CATEGORIES } from '../lib/constants';
import ItemCard from '../components/ItemCard';
import UploadFlow from '../components/UploadFlow';
import ItemDetail from '../components/ItemDetail';

export default function ClosetPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterCategory, setFilterCategory] = useState('alle');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const all = await db.getItems();
    setItems(all.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  }

  async function handleNewItem(item, isLast) {
    await db.addItem(item);
    setItems((prev) => [item, ...prev]);
    if (isLast) setShowUpload(false);
  }

  async function handleDelete(id) {
    await db.deleteItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected(null);
  }

  async function handleSave(patch) {
    await db.addItem(patch);
    setItems((prev) => prev.map((i) => (i.id === patch.id ? patch : i)));
    setSelected(patch);
  }

  const filtered = useMemo(() => {
    if (filterCategory === 'alle') return items;
    return items.filter((i) => i.category === filterCategory);
  }, [items, filterCategory]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Kleiderschrank</h1>
          <p>{items.length} Teile in deiner Sammlung</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>+ Teil hinzufuegen</button>
      </div>

      <div className="field select-seed" style={{ marginBottom: 20 }}>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="alle">Alle Kategorien</option>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <p>Lade...</p>
      ) : filtered.length === 0 ? (
        <div className="empty">Noch keine Kleidungsstuecke. Lade dein erstes Foto hoch!</div>
      ) : (
        <div className="grid">
          {filtered.map((item) => <ItemCard key={item.id} item={item} onClick={setSelected} />)}
        </div>
      )}

      {showUpload && <UploadFlow onDone={handleNewItem} onCancel={() => setShowUpload(false)} />}
      {selected && <ItemDetail item={selected} onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />}
    </div>
  );
}

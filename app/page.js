'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { db } from '../lib/db';
import ItemCard from '../components/ItemCard';
import ItemDetail from '../components/ItemDetail';
import CategoryChips from '../components/CategoryChips';
import { getCurrentProfileName } from '../lib/profile';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Noch wach';
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Hey';
  return 'Guten Abend';
}

export default function ClosetPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterCategory, setFilterCategory] = useState('alle');
  const [name, setName] = useState('');

  useEffect(() => { load(); setName(getCurrentProfileName()); }, []);

  async function load() {
    setLoading(true);
    const all = await db.getItems();
    setItems(all.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm('Dieses Teil wirklich loeschen?')) return;
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
        <h1>{greeting()}{name ? `, ${name}` : ''} 👋</h1>
        <p>{items.length} Teile in deinem Schrank</p>
      </div>

      <CategoryChips value={filterCategory} onChange={setFilterCategory} includeAll />

      {loading ? (
        <p className="card-sub">Lade...</p>
      ) : filtered.length === 0 ? (
        <div className="empty">
          Noch keine Kleidungsstuecke.<br />
          <Link href="/add" className="btn btn-primary" style={{ marginTop: 14, display: 'inline-flex' }}>+ Teil hinzufuegen</Link>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map((item) => <ItemCard key={item.id} item={item} onClick={setSelected} />)}
        </div>
      )}

      {selected && <ItemDetail item={selected} onClose={() => setSelected(null)} onSave={handleSave} onDelete={handleDelete} />}
    </div>
  );
}

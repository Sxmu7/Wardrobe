const DB_NAME = 'kleiderschrankDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB nicht verfuegbar')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const dbi = e.target.result;
      if (!dbi.objectStoreNames.contains('items')) dbi.createObjectStore('items', { keyPath: 'id' });
      if (!dbi.objectStoreNames.contains('outfits')) dbi.createObjectStore('outfits', { keyPath: 'id' });
      if (!dbi.objectStoreNames.contains('photos')) dbi.createObjectStore('photos', { keyPath: 'id' });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function tx(storeName, mode) {
  return openDB().then((dbi) => dbi.transaction(storeName, mode).objectStore(storeName));
}

export async function addRecord(store, record) {
  const s = await tx(store, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = s.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllRecords(store) {
  const s = await tx(store, 'readonly');
  return new Promise((resolve, reject) => {
    const req = s.getAll();
    req.onsuccess = (e) => resolve(e.target.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteRecord(store, id) {
  const s = await tx(store, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = s.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}

export const db = {
  addItem: (item) => addRecord('items', item),
  getItems: () => getAllRecords('items'),
  deleteItem: (id) => deleteRecord('items', id),
  addOutfit: (o) => addRecord('outfits', o),
  getOutfits: () => getAllRecords('outfits'),
  deleteOutfit: (id) => deleteRecord('outfits', id),
  addPhoto: (p) => addRecord('photos', p),
  getPhotos: () => getAllRecords('photos'),
  deletePhoto: (id) => deleteRecord('photos', id),
  async exportAll() {
    const [items, outfits] = await Promise.all([getAllRecords('items'), getAllRecords('outfits')]);
    return { app: 'MyClo', version: 1, exportedAt: new Date().toISOString(), items, outfits };
  },
  async importAll(data) {
    const items = Array.isArray(data?.items) ? data.items : [];
    const outfits = Array.isArray(data?.outfits) ? data.outfits : [];
    for (const it of items) await addRecord('items', it);
    for (const o of outfits) await addRecord('outfits', o);
    return { itemsImported: items.length, outfitsImported: outfits.length };
  },
};

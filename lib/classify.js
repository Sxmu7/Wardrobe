// Kostenlose, clientseitige Bilderkennung ueber TensorFlow.js + MobileNet.
// Laeuft komplett im Browser (Modell wird per CDN nachgeladen), keine Kosten, kein API-Key noetig.
// Genauigkeit ist geringer als bei der optionalen Claude-Vision-Erkennung, reicht aber
// fuer eine grobe Kategorie-/Namensvorschlag-Erkennung, die man schnell korrigieren kann.

let modelPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') { reject(new Error('Kein Browser verfuegbar')); return; }
    if (document.querySelector(`script[data-src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.dataset.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Konnte Modell nicht laden (kein Internet?)'));
    document.head.appendChild(s);
  });
}

async function ensureModel() {
  if (modelPromise) return modelPromise;
  modelPromise = (async () => {
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');
    if (!window.mobilenet) throw new Error('MobileNet konnte nicht geladen werden');
    return window.mobilenet.load();
  })();
  return modelPromise;
}

function imageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

const CATEGORY_RULES = [
  { keys: ['jean', 'trouser', 'legging'], category: 'hose' },
  { keys: ['skirt'], category: 'rock' },
  { keys: ['gown', 'robe', 'kimono', 'abaya', 'sarong'], category: 'kleid' },
  { keys: ['coat', 'jacket', 'poncho', 'parka', 'trench'], category: 'jacke' },
  { keys: ['shoe', 'sandal', 'boot', 'loafer', 'clog', 'sneaker'], category: 'schuhe' },
  { keys: ['bag', 'backpack', 'purse', 'wallet'], category: 'tasche' },
  { keys: ['tie', 'scarf', 'sunglass', 'hat', 'cap', 'glove', 'sock', 'belt'], category: 'accessoire' },
  { keys: ['shirt', 'sweatshirt', 'jersey', 'cardigan', 'sweater', 'vest', 'brassiere'], category: 'oberteil' },
];

function guessCategory(label) {
  const low = label.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keys.some((k) => low.includes(k))) return rule.category;
  }
  return null;
}

function cleanLabel(label) {
  const first = label.split(',')[0].trim();
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export async function classifyImageFree(dataUrl) {
  const model = await ensureModel();
  const img = await imageFromDataUrl(dataUrl);
  const preds = await model.classify(img, 5);
  let category = null;
  let subtype = null;
  for (const p of preds) {
    const cat = guessCategory(p.className);
    if (cat) { category = cat; subtype = cleanLabel(p.className); break; }
  }
  if (!subtype && preds[0]) subtype = cleanLabel(preds[0].className);
  const topConfidence = preds[0] ? preds[0].probability : 0;
  return { category, subtype, confidence: topConfidence, raw: preds };
}

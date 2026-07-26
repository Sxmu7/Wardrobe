export const LANGUAGES = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

export const STRINGS = {
  de: {
    chooseLanguage: 'Sprache wählen',
    continue: 'Weiter',
    askName: 'Wie sollen wir dich nennen?',
    namePlaceholder: 'Dein Name',
    nameHint: 'Damit erkennen dich Freunde in der Outfit-Galerie.',
    step1Title: 'Dein Kleiderschrank, digital',
    step1Body: 'Lade Fotos deiner Kleidungsstücke hoch. Die KI erkennt Kategorie, Farbe und Muster automatisch.',
    step2Title: 'Kombinieren leicht gemacht',
    step2Body: 'Wähle ein Teil aus – wir zeigen dir, was farblich dazu passt, inklusive Accessoires.',
    step3Title: 'Outfits speichern & teilen',
    step3Body: 'Speichere echte Outfit-Fotos, sammle Likes von Freunden und lass dich inspirieren.',
    getStarted: 'Los geht\'s',
    back: 'Zurück',
    skip: 'Überspringen',
  },
  en: {
    chooseLanguage: 'Choose language',
    continue: 'Continue',
    askName: 'What should we call you?',
    namePlaceholder: 'Your name',
    nameHint: 'This is how friends will recognize you in the outfit gallery.',
    step1Title: 'Your closet, digitized',
    step1Body: 'Upload photos of your clothes. AI recognizes category, color and pattern automatically.',
    step2Title: 'Matching made easy',
    step2Body: 'Pick one piece – we\'ll show you what matches, accessories included.',
    step3Title: 'Save & share outfits',
    step3Body: 'Save real outfit photos, collect likes from friends, and get inspired.',
    getStarted: 'Get started',
    back: 'Back',
    skip: 'Skip',
  },
  es: {
    chooseLanguage: 'Elige idioma',
    continue: 'Continuar',
    askName: '¿Cómo te llamamos?',
    namePlaceholder: 'Tu nombre',
    nameHint: 'Así te reconocerán tus amigos en la galería de looks.',
    step1Title: 'Tu armario, digital',
    step1Body: 'Sube fotos de tu ropa. La IA reconoce categoría, color y patrón automáticamente.',
    step2Title: 'Combinar es fácil',
    step2Body: 'Elige una prenda y te mostramos qué combina, incluidos los accesorios.',
    step3Title: 'Guarda y comparte looks',
    step3Body: 'Guarda fotos reales de tus looks, junta likes de amigos e inspírate.',
    getStarted: 'Empezar',
    back: 'Atrás',
    skip: 'Omitir',
  },
};

export function t(lang, key) {
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.de[key] || key;
}

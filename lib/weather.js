// Wetter ohne API-Key ueber Open-Meteo (nur mit Standortfreigabe des Browsers).
// Faellt ohne Freigabe/Netzwerk automatisch auf eine Kalender-Saison zurueck.

const WEATHER_CODES = {
  0: { label: 'Klar', icon: '☀️' },
  1: { label: 'Ueberwiegend klar', icon: '🌤️' },
  2: { label: 'Teils bewoelkt', icon: '⛅' },
  3: { label: 'Bewoelkt', icon: '☁️' },
  45: { label: 'Neblig', icon: '🌫️' },
  48: { label: 'Neblig', icon: '🌫️' },
  51: { label: 'Nieselregen', icon: '🌦️' },
  61: { label: 'Regen', icon: '🌧️' },
  63: { label: 'Regen', icon: '🌧️' },
  65: { label: 'Starker Regen', icon: '🌧️' },
  71: { label: 'Schnee', icon: '🌨️' },
  73: { label: 'Schnee', icon: '🌨️' },
  75: { label: 'Starker Schnee', icon: '❄️' },
  80: { label: 'Schauer', icon: '🌦️' },
  95: { label: 'Gewitter', icon: '⛈️' },
};

export function calendarSeason() {
  const m = new Date().getMonth() + 1; // 1-12
  if (m === 12 || m <= 2) return 'winter';
  if (m <= 5) return 'fruehling';
  if (m <= 8) return 'sommer';
  return 'herbst';
}

function tempToSeason(tempC) {
  if (tempC <= 8) return 'winter';
  if (tempC <= 16) return 'herbst';
  if (tempC <= 23) return 'fruehling';
  return 'sommer';
}

export function getLiveWeather() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    const timeout = setTimeout(() => resolve(null), 4000);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(timeout);
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
          );
          const data = await res.json();
          const temp = data?.current?.temperature_2m;
          const code = data?.current?.weather_code;
          if (typeof temp !== 'number') { resolve(null); return; }
          const meta = WEATHER_CODES[code] || { label: 'Wechselhaft', icon: '🌡️' };
          resolve({ tempC: Math.round(temp), label: meta.label, icon: meta.icon, season: tempToSeason(temp) });
        } catch (e) {
          resolve(null);
        }
      },
      () => { clearTimeout(timeout); resolve(null); },
      { timeout: 3500 }
    );
  });
}

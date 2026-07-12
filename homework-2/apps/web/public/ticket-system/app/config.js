// Triage — API configuration (base URL, auth token, mock/live switch).
// Persisted to localStorage so agents can point the UI at a real backend
// without touching code. Edit DEFAULTS below to set your team's default API.
window.TriageConfig = (function () {
  const KEY = 'triage_api_config';
  const DEFAULTS = {
    apiBaseUrl: 'https://api.example.com/v1',
    token: '',
    mock: true, // no backend from Tasks 1–2 wired yet — flip off (or use Settings) once it's live
  };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { ...DEFAULTS, ...saved };
    } catch {
      return { ...DEFAULTS };
    }
  }

  let cfg = load();
  const subs = new Set();

  return {
    get: () => cfg,
    set(patch) {
      cfg = { ...cfg, ...patch };
      try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch {}
      subs.forEach((fn) => fn(cfg));
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
})();

/**
 * Moving users from the old LumenAI addresses to the LingoMate one.
 *
 * Each address is its own browser origin with its own localStorage, so a plain
 * redirect would leave people's history and settings behind. Instead, on an old
 * address this script packs the app's storage into the URL fragment (which never
 * reaches any server) and forwards to the new address, where it's unpacked.
 *
 * It's plain JS inlined into <head> (see layout.tsx) so it runs before the app
 * loads and reads storage.
 */

export const PRIMARY_ORIGIN = 'https://lingomate-translate.vercel.app';

export const LEGACY_HOSTS = [
    'lumenai.software',
    'www.lumenai.software',
    'lumenai-translate.vercel.app',
];

const script = `(function (primary, legacyHosts) {
  var MARK = '#migrate=';
  var HISTORY = 'translation_history';
  // Only the app's own keys ever move.
  function isAppKey(k) { return k.indexOf('lumen_') === 0 || k === HISTORY || k === 'theme'; }
  try {
    // On an old address: pack up and leave.
    if (legacyHosts.indexOf(location.hostname) !== -1) {
      var data = {};
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && isAppKey(key)) data[key] = localStorage.getItem(key);
      }
      var hasData = Object.keys(data).length > 0;
      location.replace(primary + location.pathname + location.search + (hasData ? MARK + encodeURIComponent(JSON.stringify(data)) : ''));
      return;
    }

    // On the new address: unpack, but only when really sent here from an old one.
    if (location.hash.indexOf(MARK) !== 0) return;
    var from = '';
    try { from = new URL(document.referrer).hostname; } catch (e) {}
    if (legacyHosts.indexOf(from) !== -1) {
      var incoming = JSON.parse(decodeURIComponent(location.hash.slice(MARK.length)));
      Object.keys(incoming).forEach(function (k) {
        var value = incoming[k];
        if (!isAppKey(k) || typeof value !== 'string') return;
        if (k === HISTORY) {
          // Merge with anything already saved here, newest first, no duplicates.
          var seen = {};
          var merged = JSON.parse(localStorage.getItem(HISTORY) || '[]').concat(JSON.parse(value))
            .filter(function (e) { if (!e || !e.id || seen[e.id]) return false; seen[e.id] = true; return true; })
            .sort(function (a, b) { return b.timestamp - a.timestamp; })
            .slice(0, 50);
          localStorage.setItem(HISTORY, JSON.stringify(merged));
        } else if (localStorage.getItem(k) === null) {
          // Settings chosen here already win over the old ones.
          localStorage.setItem(k, value);
        }
      });
    }
    history.replaceState(null, '', location.pathname + location.search);
  } catch (e) {}
})(${JSON.stringify(PRIMARY_ORIGIN)}, ${JSON.stringify(LEGACY_HOSTS)});`;

export const domainMigrationScript = script;

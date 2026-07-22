/* Regionaut — Service Worker
   Vahemällu salvestab rakenduse enda lehe (nii et see avaneb ka nõrga/puuduva
   võrguühenduse korral), kuid EI vahemälusta väliseid API päringuid
   (Regio, Open-Meteo, Maa-amet, OSM jne) — need peavad alati olema värsked.

   PAIGALDAMINE: lae see fail (sw.js) samasse kausta, kus on regionaut.html,
   ja ava rakendus https-serverist (nt GitHub Pages, Netlify) — file:// puhul
   brauserid Service Worker'it ei luba.
*/

const CACHE_NAME = 'regionaut-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Ainult sama päritoluga ressursid (rakenduse enda leht) — väliseid
  // API päringuid me kunagi vahemällu ei pane.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => cached || caches.match('./'))
      )
  );
});

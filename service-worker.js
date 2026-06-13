// ============================================================
//  service-worker.js — PWA Street Marpst
//  Cache les ressources statiques pour un chargement rapide
//  et un fonctionnement partiel hors ligne
// ============================================================

const CACHE_NAME = 'tags-map-v12';

// Ressources à mettre en cache au premier chargement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/contribuer.html',
  '/a-propos.html',
  '/mentions-legales.html',
  '/js/config.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// --- Installation : mise en cache des ressources statiques ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// --- Activation : nettoyage des anciens caches ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// --- Message SKIP_WAITING : forcer la mise à jour immédiate ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- Fetch : stratégie Network First pour les données,
//             Cache First pour les ressources statiques ---
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Les requêtes vers Supabase et Cloudinary passent toujours par le réseau
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('openstreetmap.org')
  ) {
    return; // Pas de cache — toujours frais
  }

  // Pour les ressources statiques : Cache First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Mettre en cache les nouvelles ressources statiques
        if (
          response.ok &&
          event.request.method === 'GET' &&
          !url.hostname.includes('fonts.googleapis.com') === false
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Hors ligne et pas en cache : page d'erreur basique
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

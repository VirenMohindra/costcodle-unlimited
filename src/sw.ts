/**
 * Costcodle Service Worker
 * Provides offline functionality and caching strategies
 */

/// <reference no-default-lib="true"/>
/// <reference lib="es2020" />
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'costcodle-v2.0.0';
const STATIC_CACHE = 'costcodle-static-v2.0.0';
const DYNAMIC_CACHE = 'costcodle-dynamic-v2.0.0';
const GAMES_CACHE = 'costcodle-games-v2.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/scripts/main.js', // TypeScript compiled entry point
  '/scripts/modules/app.js',
  '/scripts/modules/constants.js',
  '/scripts/modules/utils.js',
  '/scripts/modules/dom.js',
  '/scripts/modules/state.js',
  '/scripts/modules/game.js',
  '/scripts/searchBar.js', // Legacy third-party currency input
  '/styles/global.css',
  '/styles/game.css',
  '/styles/overlay.css',
  '/assets/share-icon.svg',
  '/assets/stat-logo.svg',
  '/public/favicon.ico',
  '/public/apple-touch-icon.png',
  '/public/favicon-32x32.png',
  '/public/favicon-16x16.png',
  '/public/site.webmanifest'
];

// CDN assets that should be cached
const CDN_ASSETS = [
  'https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
  'https://fonts.googleapis.com/css2?family=VT323&display=swap'
];

// Network-first resources
const NETWORK_FIRST = [
  '/games.json'
];

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      cacheStaticAssets(),
      // Cache CDN assets
      cacheCDNAssets(),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (NETWORK_FIRST.some(path => url.pathname.includes(path))) {
    // Network-first strategy for games.json
    event.respondWith(networkFirstStrategy(request));
  } else if (CDN_ASSETS.some(asset => request.url.includes(asset))) {
    // Cache-first for CDN assets
    event.respondWith(cacheFirstStrategy(request));
  } else if (url.origin === location.origin) {
    // Stale-while-revalidate for own assets
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    // Network-only for other external resources
    event.respondWith(fetch(request));
  }
});

/**
 * Background Sync for game data updates
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-games') {
    event.waitUntil(updateGameData());
  }
});

/**
 * Push notification handler (for future features)
 */
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New Costcodle available!',
    icon: '/public/favicon-32x32.png',
    badge: '/public/favicon-16x16.png',
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Costcodle', options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

/**
 * Cache static assets
 */
async function cacheStaticAssets() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const responses = await Promise.allSettled(
      STATIC_ASSETS.map(url => cache.add(url))
    );

    const failed = responses.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn('Failed to cache some static assets:', failed);
    }

    console.log(`✅ Cached ${STATIC_ASSETS.length - failed.length}/${STATIC_ASSETS.length} static assets`);
  } catch (error) {
    console.error('❌ Failed to cache static assets:', error);
  }
}

/**
 * Cache CDN assets
 */
async function cacheCDNAssets() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const responses = await Promise.allSettled(
      CDN_ASSETS.map(url => cache.add(url))
    );

    const failed = responses.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn('Failed to cache some CDN assets:', failed);
    }

    console.log(`✅ Cached ${CDN_ASSETS.length - failed.length}/${CDN_ASSETS.length} CDN assets`);
  } catch (error) {
    console.error('❌ Failed to cache CDN assets:', error);
  }
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, GAMES_CACHE];

    await Promise.all(
      cacheNames
        .filter(name => !validCaches.includes(name))
        .map(name => {
          console.log(`🗑️ Deleting old cache: ${name}`);
          return caches.delete(name);
        })
    );

    console.log('✅ Old caches cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup old caches:', error);
  }
}

/**
 * Network-first caching strategy
 * Try network first, fallback to cache
 */
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // If successful, cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(GAMES_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, trying cache:', request.url);

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page or error response
    return new Response(
      JSON.stringify({
        error: 'Game data unavailable offline',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache-first strategy
 * Check cache first, fallback to network
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch and cache:', request.url);
    throw error;
  }
}

/**
 * Stale-while-revalidate strategy
 * Return cached version immediately, update cache in background
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  // Update cache in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.log('Background fetch failed:', request.url);
  });

  // Return cached response immediately, or wait for network if no cache
  if (cachedResponse) {
    // Don't await the fetch promise - let it run in background
    fetchPromise.catch(() => {}); // Prevent unhandled rejection
    return cachedResponse;
  }

  return fetchPromise;
}

/**
 * Update game data in background
 */
async function updateGameData() {
  try {
    console.log('🔄 Background sync: Updating game data...');

    const response = await fetch('/games.json');
    if (response.ok) {
      const cache = await caches.open(GAMES_CACHE);
      await cache.put('/games.json', response);
      console.log('✅ Game data updated in background');
    }
  } catch (error) {
    console.error('❌ Failed to update game data in background:', error);
  }
}

/**
 * Utility: Check if request is for a page
 */
function isPageRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

/**
 * Utility: Get cache size
 */
async function getCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  return keys.length;
}

/**
 * Message handler for communication with main thread
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;

    case 'CLEAR_CACHE':
      clearSpecificCache(data.cacheName).then(success => {
        event.ports[0].postMessage({ success });
      });
      break;

    case 'UPDATE_CACHE':
      updateSpecificCache(data.urls).then(success => {
        event.ports[0].postMessage({ success });
      });
      break;
  }
});

/**
 * Get cache status for debugging
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const name of cacheNames) {
    status[name] = await getCacheSize(name);
  }

  return {
    caches: status,
    version: CACHE_NAME,
    timestamp: new Date().toISOString()
  };
}

/**
 * Clear specific cache
 */
async function clearSpecificCache(cacheName) {
  try {
    await caches.delete(cacheName);
    return true;
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return false;
  }
}

/**
 * Update specific cache with new URLs
 */
async function updateSpecificCache(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    await Promise.all(urls.map(url => cache.add(url)));
    return true;
  } catch (error) {
    console.error('Failed to update cache:', error);
    return false;
  }
}
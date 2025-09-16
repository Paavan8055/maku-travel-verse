// Service Worker for PWA functionality
const CACHE_NAME = 'maku-travel-v1';
const OFFLINE_URL = '/offline.html';

// Critical assets to cache
const CRITICAL_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/src/main.tsx',
  '/src/App.tsx'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CRITICAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle booking API requests with background sync
  if (event.request.url.includes('/api/bookings')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Store failed booking for retry
          return storeFailedBooking(event.request)
            .then(() => new Response(JSON.stringify({ 
              success: false, 
              message: 'Booking queued for retry when online',
              offline: true 
            }), {
              headers: { 'Content-Type': 'application/json' }
            }));
        })
    );
    return;
  }

  // Standard cache strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync for failed bookings
self.addEventListener('sync', (event) => {
  if (event.tag === 'booking-retry') {
    event.waitUntil(retryFailedBookings());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update from Maku Travel',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Maku Travel', options)
  );
});

// Store failed booking for retry
async function storeFailedBooking(request) {
  const db = await openDB();
  const transaction = db.transaction(['failed_bookings'], 'readwrite');
  const store = transaction.objectStore('failed_bookings');
  
  const bookingData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };
  
  return store.add(bookingData);
}

// Retry failed bookings when online
async function retryFailedBookings() {
  const db = await openDB();
  const transaction = db.transaction(['failed_bookings'], 'readwrite');
  const store = transaction.objectStore('failed_bookings');
  const bookings = await store.getAll();
  
  for (const booking of bookings) {
    try {
      const response = await fetch(booking.url, {
        method: booking.method,
        headers: booking.headers,
        body: booking.body
      });
      
      if (response.ok) {
        await store.delete(booking.id);
      }
    } catch (error) {
      console.error('Failed to retry booking:', error);
    }
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('maku-travel-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('failed_bookings')) {
        const store = db.createObjectStore('failed_bookings', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}
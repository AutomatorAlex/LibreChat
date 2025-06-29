// PWA Status Test Script
// Run this in the browser console to check current PWA functionality

console.log('=== LibreChat PWA Status Check ===');

// Check if service worker is registered
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Service Worker Registrations:', registrations.length);
    if (registrations.length === 0) {
      console.log('❌ No service worker registered - PWA functionality disabled');
    } else {
      registrations.forEach((reg, index) => {
        console.log(`✅ Service Worker ${index + 1}:`, reg.scope);
        console.log('  - Active:', reg.active?.scriptURL || 'None');
        console.log('  - Installing:', reg.installing?.scriptURL || 'None');
        console.log('  - Waiting:', reg.waiting?.scriptURL || 'None');
      });
    }
  });
} else {
  console.log('❌ Service Worker not supported in this browser');
}

// Check manifest
const manifestLink = document.querySelector('link[rel="manifest"]');
if (manifestLink) {
  console.log('✅ Manifest link found:', manifestLink.href);
  
  // Try to fetch manifest
  fetch(manifestLink.href)
    .then(response => {
      if (response.ok) {
        console.log('✅ Manifest file accessible');
        return response.json();
      } else {
        console.log('❌ Manifest file not accessible:', response.status);
      }
    })
    .then(manifest => {
      if (manifest) {
        console.log('✅ Manifest content:', manifest);
      }
    })
    .catch(error => {
      console.log('❌ Error fetching manifest:', error);
    });
} else {
  console.log('❌ No manifest link found in HTML');
}

// Check if app can be installed
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ App installation prompt available');
  deferredPrompt = e;
});

// Check cache API
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('Cache Storage:', cacheNames.length, 'caches');
    cacheNames.forEach(name => {
      console.log('  - Cache:', name);
    });
  });
} else {
  console.log('❌ Cache API not supported');
}

console.log('=== End PWA Status Check ===');
# Kuri Frontend Development TODO

## Current Priority: PWA Implementation

This document outlines the frontend development plan for converting the Kuri Finance application into a Progressive Web App (PWA) for better mobile experience, offline functionality, and native app-like behavior.

## PWA Implementation Plan

### Overview
Convert the existing Kuri Finance website into a Progressive Web App (PWA) for better mobile experience, offline functionality, and native app-like behavior.

### Benefits
- **Add to Home Screen**: Users can install like a native app
- **Full Screen Experience**: No browser chrome
- **Faster Loading**: Cached resources and API responses
- **Offline Access**: View cached markets and profile data
- **Native Feel**: Splash screen, app switcher integration

### Phase 1: Core PWA Setup (High Priority - 2-3 hours)

#### Task 1: Install Dependencies
```bash
cd kuri_web
npm install vite-plugin-pwa -D
```

#### Task 2: Create App Icons
Create the following icons from existing `/public/images/KuriLogo.png`:
- `public/kuri-icon-192.png` (192×192px)
- `public/kuri-icon-512.png` (512×512px)
- `public/kuri-icon-maskable-192.png` (with padding for Android adaptive icons)

#### Task 3: Configure Vite PWA Plugin
**File**: `vite.config.ts`

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    // existing plugins...
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'images/*.png'],
      manifest: {
        name: 'Kuri Finance',
        short_name: 'Kuri',
        description: 'Decentralized rotating savings circles',
        theme_color: '#8B6F47',
        background_color: '#F9F5F1',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'kuri-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'kuri-icon-512.png', 
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/kuribackend-production\.up\.railway\.app\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'kuri-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ]
});
```

#### Task 4: Update HTML Meta Tags
**File**: `index.html`

```html
<!-- Add to <head> section -->
<meta name="theme-color" content="#8B6F47" />
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Kuri">
<link rel="apple-touch-icon" href="/kuri-icon-192.png">
<meta name="description" content="Decentralized rotating savings circles - Join circles, make contributions, and build financial trust in your community">
```

### Phase 2: Enhanced UX (Medium Priority - 2-3 hours)

#### Task 5: Add Install Prompt Component
**File**: `src/components/InstallPrompt.tsx` (new file)

```jsx
import { useState, useEffect } from 'react';
import { Button } from './ui/button';

export const InstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember user dismissed for 30 days
    localStorage.setItem('kuri-install-dismissed', Date.now().toString());
  };

  // Don't show if recently dismissed
  const dismissedTime = localStorage.getItem('kuri-install-dismissed');
  const daysSinceDismissed = dismissedTime ? (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24) : 999;
  
  if (!showPrompt || daysSinceDismissed < 30) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-[#8B6F47]">Install Kuri App</h3>
          <p className="text-sm text-gray-600">Get the full app experience</p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button variant="outline" size="sm" onClick={handleDismiss}>
            Later
          </Button>
          <Button size="sm" onClick={handleInstall} className="bg-[#8B6F47]">
            Install
          </Button>
        </div>
      </div>
    </div>
  );
};
```

#### Task 6: Create Offline Fallback Pages
**File**: `src/pages/OfflinePage.tsx` (new file)

```jsx
import { Button } from '../components/ui/button';
import { Logo } from '../components/ui/Logo';

export const OfflinePage = () => (
  <div className="min-h-screen bg-[#F9F5F1] flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <Logo className="mx-auto mb-6" />
      <h1 className="text-2xl font-bold text-[#8B6F47] mb-4">
        You're Offline
      </h1>
      <p className="text-gray-600 mb-6">
        Check your internet connection to access live market data and create new circles.
      </p>
      <Button 
        onClick={() => window.location.reload()}
        className="bg-[#8B6F47] hover:bg-[#725A3A]"
      >
        Try Again
      </Button>
    </div>
  </div>
);
```

#### Task 7: Add Network Status Detection Hook
**File**: `src/hooks/useNetworkStatus.ts` (new file)

```javascript
import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Refresh data after coming back online
        window.location.reload();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);
  
  return { isOnline, wasOffline };
};
```

#### Task 8: Add Network Status Indicator
**File**: `src/components/NetworkStatus.tsx` (new file)

```jsx
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const NetworkStatus = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm z-50">
      ⚠️ You're offline. Some features may not be available.
    </div>
  );
};
```

### Phase 3: Advanced Features (Low Priority - 1-2 hours)

#### Task 9: Add App Shortcuts
Add to manifest configuration in `vite.config.ts`:

```javascript
"shortcuts": [
  {
    "name": "View Markets",
    "short_name": "Markets", 
    "description": "Browse available circles",
    "url": "/markets",
    "icons": [{ "src": "/kuri-icon-192.png", "sizes": "192x192" }]
  },
  {
    "name": "My Profile",
    "short_name": "Profile",
    "description": "View your profile", 
    "url": "/profile",
    "icons": [{ "src": "/kuri-icon-192.png", "sizes": "192x192" }]
  },
  {
    "name": "Create Circle",
    "short_name": "Create",
    "description": "Start a new circle",
    "url": "/markets?create=true", 
    "icons": [{ "src": "/kuri-icon-192.png", "sizes": "192x192" }]
  }
]
```

#### Task 10: Background Sync for Failed Transactions (Optional)
**File**: `src/utils/backgroundSync.ts` (new file)

```javascript
export const registerBackgroundSync = () => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      // Register for background sync when transactions fail
      return registration.sync.register('transaction-retry');
    });
  }
};

export const queueFailedTransaction = (transactionData) => {
  // Store failed transaction in IndexedDB for retry
  const request = indexedDB.open('kuri-sync', 1);
  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(['transactions'], 'readwrite');
    const store = transaction.objectStore('transactions');
    store.add({
      ...transactionData,
      timestamp: Date.now(),
      status: 'pending'
    });
  };
};
```

### Integration Tasks

#### Task 11: Update Main App Component
**File**: `src/App.tsx`

```jsx
// Add imports
import { InstallPrompt } from './components/InstallPrompt';
import { NetworkStatus } from './components/NetworkStatus';

// Add to App component return
return (
  <div className="App">
    <NetworkStatus />
    {/* existing routes */}
    <InstallPrompt />
  </div>
);
```

#### Task 12: Update Layout Component
**File**: `src/components/Layout.tsx`

Add offline detection and show cached data indicators when offline.

### Testing & Deployment Tasks

#### Task 13: Test PWA Features
- [ ] Install prompt appears on mobile
- [ ] App installs to home screen successfully
- [ ] Offline pages work when network is disconnected
- [ ] API responses are cached and work offline
- [ ] App launches in standalone mode (no browser chrome)
- [ ] App shortcuts work from home screen
- [ ] Background sync queues failed requests

#### Task 14: Mobile Testing Checklist
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test on various screen sizes
- [ ] Test wallet connections (MetaMask, WalletConnect)
- [ ] Test image uploads
- [ ] Test profile creation flow
- [ ] Verify offline functionality

#### Task 15: Performance Optimization
- [ ] Audit with Lighthouse PWA score
- [ ] Optimize bundle size for mobile
- [ ] Test cache strategies effectiveness
- [ ] Monitor API response caching
- [ ] Verify service worker registration

#### Task 16: Deploy PWA
- [ ] Build with `npm run build`
- [ ] Verify PWA assets are generated
- [ ] Deploy to Vercel (existing process)
- [ ] Test production PWA functionality
- [ ] Monitor PWA install rates

## Time Estimates

### PWA Implementation
- **Phase 1 (Core PWA)**: 2-3 hours
- **Phase 2 (Enhanced UX)**: 2-3 hours  
- **Phase 3 (Advanced)**: 1-2 hours
- **Integration & Testing**: 2-3 hours
- **Total**: 7-11 hours

## Implementation Order

### Week 1: Core PWA
1. **Core PWA Setup** - Basic PWA functionality (Phase 1)
2. **PWA Enhancement** - Install prompts, offline pages (Phase 2)

### Week 2: Polish & Deploy
3. **Mobile Testing** - Comprehensive mobile device testing
4. **Performance Optimization** - PWA audit and improvements
5. **Advanced PWA** - App shortcuts, background sync (Phase 3)  
6. **Production Deployment** - Deploy and monitor PWA metrics

## Success Criteria

### PWA Implementation
- [ ] Lighthouse PWA score > 90
- [ ] App installs successfully on iOS and Android
- [ ] Offline functionality works for cached data
- [ ] Install prompt shows appropriately
- [ ] Native app-like experience on mobile

### User Experience
- [ ] Faster loading times with caching
- [ ] Seamless mobile experience
- [ ] Offline access to previously viewed data
- [ ] Easy installation process for users

## Rollback Plan

### If PWA Causes Issues
1. Disable service worker registration
2. Remove PWA manifest temporarily  
3. Continue with regular web app functionality

## Monitoring & Analytics

### PWA Metrics to Track
- Install prompt impression rate
- Install completion rate
- Offline usage patterns
- Cache hit rates
- Service worker error rates

This comprehensive plan focuses on PWA implementation for better mobile user experience.
# Backend TODO: Fix CoinDCX WebSocket for Live USDC-INR Rates

## 🐛 Current Problem

**Error in Browser Console:**
```
WebSocket connection to 'wss://stream.coindcx.com/socket.io/?EIO=4&transport=websocket' failed
```

**Root Cause:**
The frontend is trying to connect directly to CoinDCX WebSocket from the browser, but this fails due to:
1. **CORS Restrictions** - CoinDCX doesn't allow WebSocket connections from browser origins
2. **Security Policy** - Exchanges typically block direct browser access to prevent abuse
3. **Same-Origin Policy** - Browser security prevents cross-origin WebSocket connections

**Current Behavior:**
- Frontend currency service tries to connect to `wss://stream.coindcx.com`
- Connection fails repeatedly
- Falls back to cached rate (5 min) or default fallback rate (85 INR)
- Users don't see live exchange rates

---

## ✅ Solution: Create Backend WebSocket Proxy

You need to create a **backend service** that:
1. Connects to CoinDCX WebSocket (server-to-server, no CORS issues)
2. Receives live USDC-INR rates
3. Exposes rates to frontend via your own REST API or WebSocket

---

## 📋 Implementation Steps

### **Option A: REST API Endpoint (Simpler, Recommended)**

Create a backend endpoint that:
- Maintains a WebSocket connection to CoinDCX in the background
- Caches the latest USDC-INR rate in memory/Redis
- Exposes a simple REST endpoint for frontend to poll

**Backend Implementation (Node.js/Express Example):**

```javascript
// backend/services/currencyService.js
const { io } = require('socket.io-client');

class CurrencyRateService {
  constructor() {
    this.latestRate = { usdcInr: 85, usdtInr: 85, lastUpdated: Date.now() };
    this.socket = null;
    this.connect();
  }

  connect() {
    console.log('[CurrencyService] Connecting to CoinDCX...');

    this.socket = io('wss://stream.coindcx.com', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 3000,
    });

    this.socket.on('connect', () => {
      console.log('[CurrencyService] Connected to CoinDCX');
      this.socket.emit('join', { channelName: 'currentPrices@spot@10s' });
    });

    this.socket.on('currentPrices@spot#update', (response) => {
      try {
        let parsedData;
        if (typeof response.data === 'string') {
          parsedData = JSON.parse(response.data);
        } else {
          parsedData = response.data || response;
        }

        const { ts, prices } = parsedData;

        if (prices?.USDCINR) {
          this.latestRate = {
            usdcInr: prices.USDCINR,
            usdtInr: prices.USDTINR || null,
            lastUpdated: ts || Date.now(),
          };
          console.log(`[CurrencyService] Updated USDC-INR: ${prices.USDCINR}`);
        } else if (prices?.USDTINR) {
          // Fallback to USDT-INR
          this.latestRate = {
            usdcInr: prices.USDTINR,
            usdtInr: prices.USDTINR,
            lastUpdated: ts || Date.now(),
          };
          console.log(`[CurrencyService] Using USDT-INR: ${prices.USDTINR}`);
        }
      } catch (error) {
        console.error('[CurrencyService] Error parsing data:', error);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('[CurrencyService] Disconnected from CoinDCX');
    });

    this.socket.on('error', (error) => {
      console.error('[CurrencyService] WebSocket error:', error);
    });
  }

  getLatestRate() {
    const age = Date.now() - this.latestRate.lastUpdated;
    const isStale = age > 5 * 60 * 1000; // 5 minutes

    return {
      ...this.latestRate,
      isStale,
      age: Math.floor(age / 1000), // in seconds
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit('leave', { channelName: 'currentPrices@spot@10s' });
      this.socket.disconnect();
    }
  }
}

// Singleton instance
const currencyRateService = new CurrencyRateService();

module.exports = currencyRateService;
```

**API Endpoint (MUST MATCH FRONTEND INTERFACE):**

```javascript
// backend/routes/currency.js
const express = require('express');
const router = express.Router();
const currencyRateService = require('../services/currencyService');

// GET /api/currency/usdc-inr
// Response format MUST match ExchangeRate interface from frontend
router.get('/usdc-inr', (req, res) => {
  try {
    const rateData = currencyRateService.getLatestRate();

    // ⚠️ CRITICAL: Response format must match ExchangeRate interface
    // from src/services/currencyTypes.ts
    res.json({
      success: true,
      data: {
        usdcToInr: rateData.usdcInr,        // number (required)
        usdtToInr: rateData.usdtInr,        // number | null (fallback reference)
        lastUpdated: rateData.lastUpdated,  // Unix timestamp in milliseconds
        source: 'websocket',                // 'websocket' | 'cache' | 'fallback'
        age: rateData.age,                  // Age in seconds (for UI display)
        isStale: rateData.isStale,          // Boolean (if rate is > 5 min old)
      },
    });
  } catch (error) {
    console.error('[API] Error fetching rate:', error);

    // Even on error, return valid ExchangeRate structure with fallback
    res.json({
      success: true, // Return success to not break frontend
      data: {
        usdcToInr: 85,              // Fallback rate
        usdtToInr: null,
        lastUpdated: Date.now(),
        source: 'fallback',
        age: 0,
        isStale: false,
      },
    });
  }
});

module.exports = router;
```

**Add to Express App:**

```javascript
// backend/index.js or app.js
const currencyRoutes = require('./routes/currency');
app.use('/api/currency', currencyRoutes);
```

---

### **Option B: WebSocket Proxy (Real-time, More Complex)**

Create a Socket.IO server that:
- Connects to CoinDCX on the backend
- Broadcasts rate updates to connected frontend clients
- Handles multiple client connections

**Backend (Socket.IO Server):**

```javascript
// backend/sockets/currencySocket.js
const { Server } = require('socket.io');
const currencyRateService = require('../services/currencyService');

function setupCurrencySocket(io) {
  io.on('connection', (socket) => {
    console.log(`[CurrencySocket] Client connected: ${socket.id}`);

    // Send current rate immediately on connection
    socket.emit('rate-update', currencyRateService.getLatestRate());

    // Send updates every 10 seconds
    const interval = setInterval(() => {
      socket.emit('rate-update', currencyRateService.getLatestRate());
    }, 10000);

    socket.on('disconnect', () => {
      clearInterval(interval);
      console.log(`[CurrencySocket] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupCurrencySocket;
```

**Setup in Express:**

```javascript
// backend/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const setupCurrencySocket = require('./sockets/currencySocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

setupCurrencySocket(io);

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## 🔄 Frontend Changes Needed

### **Option A: REST API (Polling) - COMPLETE INTEGRATION**

Replace the entire WebSocket logic in `src/services/currencyService.ts`:

```typescript
// src/services/currencyService.ts
import type { ExchangeRate, CachedRate } from './currencyTypes';

// ⚠️ CHANGE THIS: Use environment variable for backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const CACHE_KEY = 'kuri_usdc_inr_rate';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const FALLBACK_RATE = 85;
const POLL_INTERVAL = 10000; // 10 seconds

class CurrencyService {
  private currentRate: ExchangeRate | null = null;
  private listeners: Set<(rate: ExchangeRate) => void> = new Set();
  private pollInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    // Load cached rate on initialization
    this.loadCachedRate();
  }

  /**
   * Initialize polling from backend API (replaces WebSocket)
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.log('[CurrencyService] Already initialized');
      return;
    }

    this.isInitialized = true;
    console.log('[CurrencyService] Initializing backend polling...');

    // Fetch immediately
    this.fetchRateFromBackend();

    // Poll every 10 seconds
    this.pollInterval = setInterval(() => {
      this.fetchRateFromBackend();
    }, POLL_INTERVAL);
  }

  /**
   * Fetch rate from backend API
   */
  private async fetchRateFromBackend(): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/currency/usdc-inr`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // ✅ Backend response matches ExchangeRate interface exactly
        this.updateRate({
          usdcToInr: result.data.usdcToInr,
          usdtToInr: result.data.usdtToInr,
          lastUpdated: result.data.lastUpdated,
          source: result.data.source, // 'websocket' | 'cache' | 'fallback'
        });

        console.log(`[CurrencyService] ✓ Fetched rate: ${result.data.usdcToInr} INR`);
      }
    } catch (error) {
      console.error('[CurrencyService] Failed to fetch rate from backend:', error);
      // Keep using cached rate if fetch fails
      // No need to update - current rate remains unchanged
    }
  }

  /**
   * Update current rate and notify listeners
   */
  private updateRate(rate: ExchangeRate): void {
    this.currentRate = rate;
    this.cacheRate(rate);
    this.notifyListeners(rate);
  }

  /**
   * Cache rate to localStorage
   */
  private cacheRate(rate: ExchangeRate): void {
    try {
      const cached: CachedRate = {
        rate: rate.usdcToInr,
        timestamp: rate.lastUpdated,
        source: rate.usdtToInr === rate.usdcToInr ? 'USDT' : 'USDC',
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error('[CurrencyService] Failed to cache rate:', error);
    }
  }

  /**
   * Load cached rate from localStorage
   */
  private loadCachedRate(): void {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        this.setFallbackRate();
        return;
      }

      const parsedCache: CachedRate = JSON.parse(cached);
      const age = Date.now() - parsedCache.timestamp;

      if (age < CACHE_DURATION) {
        this.currentRate = {
          usdcToInr: parsedCache.rate,
          usdtToInr: null,
          lastUpdated: parsedCache.timestamp,
          source: 'cache',
        };
        console.log(`[CurrencyService] Loaded cached rate: ${parsedCache.rate} INR (${Math.round(age / 1000)}s old)`);
      } else {
        console.log('[CurrencyService] Cached rate is stale, using fallback');
        this.setFallbackRate();
      }
    } catch (error) {
      console.error('[CurrencyService] Failed to load cached rate:', error);
      this.setFallbackRate();
    }
  }

  /**
   * Set fallback rate when cache and backend are unavailable
   */
  private setFallbackRate(): void {
    this.currentRate = {
      usdcToInr: FALLBACK_RATE,
      usdtToInr: null,
      lastUpdated: Date.now(),
      source: 'fallback',
    };
    console.log(`[CurrencyService] Using fallback rate: ${FALLBACK_RATE} INR`);
  }

  /**
   * Notify all listeners of rate updates
   */
  private notifyListeners(rate: ExchangeRate): void {
    this.listeners.forEach((listener) => {
      try {
        listener(rate);
      } catch (error) {
        console.error('[CurrencyService] Error notifying listener:', error);
      }
    });
  }

  /**
   * Subscribe to rate updates
   */
  public subscribe(listener: (rate: ExchangeRate) => void): () => void {
    this.listeners.add(listener);

    // Immediately notify with current rate if available
    if (this.currentRate) {
      listener(this.currentRate);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current exchange rate
   */
  public getCurrentRate(): ExchangeRate | null {
    return this.currentRate;
  }

  /**
   * Convert USD to INR
   */
  public convertUsdToInr(usdAmount: number): number {
    const rate = this.currentRate?.usdcToInr || FALLBACK_RATE;
    return usdAmount * rate;
  }

  /**
   * Convert INR to USD
   */
  public convertInrToUsd(inrAmount: number): number {
    const rate = this.currentRate?.usdcToInr || FALLBACK_RATE;
    return inrAmount / rate;
  }

  /**
   * Check if rate is stale (older than 5 minutes)
   */
  public isRateStale(): boolean {
    if (!this.currentRate) return true;
    const age = Date.now() - this.currentRate.lastUpdated;
    return age > CACHE_DURATION;
  }

  /**
   * Get rate age in seconds
   */
  public getRateAge(): number {
    if (!this.currentRate) return Infinity;
    return Math.floor((Date.now() - this.currentRate.lastUpdated) / 1000);
  }

  /**
   * Manually refresh rate (force fetch)
   */
  public refresh(): void {
    console.log('[CurrencyService] Manual refresh requested');
    this.fetchRateFromBackend();
  }

  /**
   * Stop polling (cleanup)
   */
  public disconnect(): void {
    console.log('[CurrencyService] Disconnecting polling');
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isInitialized = false;
  }

  /**
   * Check if service is initialized
   */
  public isConnected(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();
```

**NO CHANGES NEEDED TO:**
- ✅ `src/contexts/CurrencyContext.tsx` - Already uses `currencyService` abstraction
- ✅ `src/utils/currencyUtils.ts` - No changes needed
- ✅ `src/components/ui/CurrencyDisplay.tsx` - No changes needed
- ✅ `src/components/ui/CurrencyToggle.tsx` - No changes needed
- ✅ All other components - They use `useCurrency()` hook which abstracts the service

**ONLY CHANGES NEEDED:**
1. ✅ Replace `src/services/currencyService.ts` with the code above
2. ✅ Add `VITE_BACKEND_URL` to `.env`
3. ✅ Implement backend API endpoint (detailed in previous section)
```

### **Option B: WebSocket Proxy**

Update `src/services/currencyService.ts`:

```typescript
// Replace CoinDCX WebSocket with your backend WebSocket
const SOCKET_ENDPOINT = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

this.socket = io(SOCKET_ENDPOINT, {
  transports: ['websocket'],
  path: '/socket.io', // Your backend socket path
});

this.socket.on('rate-update', (rateData) => {
  this.updateRate({
    usdcToInr: rateData.usdcInr,
    usdtToInr: rateData.usdtInr,
    lastUpdated: rateData.lastUpdated,
    source: 'websocket',
  });
});
```

---

## 🎯 Recommended Approach

**Use Option A (REST API with Polling)** because:
- ✅ Simpler to implement and maintain
- ✅ Less overhead (no persistent WebSocket connections from browser)
- ✅ Easier to cache and handle rate limiting
- ✅ Works well for rates that update every 10 seconds
- ✅ No need for Socket.IO on frontend

**Polling every 10 seconds is sufficient** since:
- CoinDCX updates rates every 10 seconds anyway
- Exchange rates don't change that frequently
- Users don't need real-time updates

---

## 📝 Environment Variables Needed

**Backend `.env`:**
```env
COINDCX_WEBSOCKET_URL=wss://stream.coindcx.com
FRONTEND_URL=http://localhost:5173  # For CORS
REDIS_URL=redis://localhost:6379    # Optional: for caching
```

**Frontend `.env`:**
```env
VITE_BACKEND_URL=http://localhost:3000
```

---

## 🧪 Testing the Fix

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify WebSocket Connection:**
   - Check backend logs for: `[CurrencyService] Connected to CoinDCX`
   - Check rate updates: `[CurrencyService] Updated USDC-INR: 94.95`

3. **Test API Endpoint (CRITICAL - Response format must match):**
   ```bash
   curl http://localhost:3000/api/currency/usdc-inr
   ```
   Must return EXACTLY this format (matches ExchangeRate interface):
   ```json
   {
     "success": true,
     "data": {
       "usdcToInr": 94.95,        // Required: number
       "usdtToInr": 95.80,        // Required: number | null
       "lastUpdated": 1730000000, // Required: Unix timestamp in ms
       "source": "websocket",     // Required: 'websocket' | 'cache' | 'fallback'
       "age": 5,                  // Optional: age in seconds (for display)
       "isStale": false           // Optional: boolean (for UI warning)
     }
   }
   ```

   **⚠️ IMPORTANT:**
   - `usdcToInr` must be a number (not string)
   - `lastUpdated` must be Unix timestamp in milliseconds (not seconds)
   - `source` must be one of: 'websocket', 'cache', or 'fallback'
   - Frontend CurrencyContext expects this exact format

4. **Start Frontend:**
   - Browser console should show successful rate fetching
   - No WebSocket errors
   - Currency toggle should work with live rates

---

## 🚨 Important Notes

1. **Rate Limiting**: CoinDCX may rate-limit connections. Monitor logs for disconnections.

2. **Fallback Strategy**: Backend should use the same fallback logic:
   - USDC-INR (primary)
   - USDT-INR (fallback)
   - 85 INR (default)

3. **Error Handling**: Backend should never crash if CoinDCX is down. Always return a valid response.

4. **Caching**: Consider using Redis to cache rates and survive backend restarts.

5. **Monitoring**: Log all rate updates and errors for debugging.

---

## 📊 Current vs. Fixed Architecture

**Current (Broken):**
```
Browser → [CORS ERROR] → CoinDCX WebSocket ❌
         ↓
      Fallback to 85 INR
```

**Fixed (Working):**
```
Browser → Your Backend API → CoinDCX WebSocket ✅
         ↓                    ↓
      Live INR Rates      Updates every 10s
```

---

## ✅ Success Criteria

- [ ] Backend connects to CoinDCX WebSocket successfully
- [ ] Backend API endpoint returns live rates in correct format
- [ ] API response matches `ExchangeRate` interface exactly:
  - [ ] `usdcToInr` is a number
  - [ ] `usdtToInr` is number or null
  - [ ] `lastUpdated` is Unix timestamp in milliseconds
  - [ ] `source` is 'websocket', 'cache', or 'fallback'
- [ ] Frontend fetches rates without errors
- [ ] No WebSocket errors in browser console
- [ ] `useCurrency()` hook provides live rates to all components
- [ ] Currency toggle shows live rates (not fallback 85 INR)
- [ ] All currency display components work correctly:
  - [ ] MarketCard shows INR prices
  - [ ] MarketDetail shows INR stats
  - [ ] UserBalanceCard toggle works
  - [ ] CreateMarketForm shows INR equivalents
  - [ ] DepositForm shows INR amounts
  - [ ] ClaimInterface shows INR winnings
- [ ] Fallback works when backend is down (shows 85 INR)
- [ ] Cache works when backend is temporarily unavailable

---

## 🔗 Related Files

**Frontend:**
- `src/services/currencyService.ts` - Needs to call backend API instead of direct WebSocket
- `src/contexts/CurrencyContext.tsx` - No changes needed (uses service)
- `.env` - Add `VITE_BACKEND_URL`

**Backend (New):**
- `backend/services/currencyService.js` - WebSocket connection to CoinDCX
- `backend/routes/currency.js` - REST API endpoint
- `backend/index.js` - Initialize service and routes
- `.env` - Add configuration

---

## 💡 Alternative: Use a Third-Party API

If CoinDCX continues to have issues, consider using:
- **CoinGecko API**: `https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=inr`
- **CoinMarketCap API**: Requires API key
- **WazirX API**: Indian exchange with good USDC-INR data

These have better browser support and official APIs.

---

**Priority**: High - Users currently see outdated/fallback exchange rates
**Estimated Time**: 2-3 hours to implement and test
**Complexity**: Medium - Requires backend changes but straightforward implementation

# Backend Integration Configuration

## Environment Variables

### Required Variables
- `VITE_BACKEND_URL` - URL of the Kuri backend API

### Development
```bash
VITE_BACKEND_URL=http://localhost:3001
```

### Production
```bash
VITE_BACKEND_URL=https://your-backend.railway.app
```

## API Integration Summary

### Modified Components
1. **useUserProfile hook** - Now uses backend API for profile creation/updates
2. **CreateMarketForm component** - Now uses backend API for circle metadata creation
3. **Onboarding component** - Now passes image files to backend instead of direct upload

### Authentication Flow
All write operations now require wallet signature authentication:
1. Get authentication message from backend
2. Sign message with connected wallet
3. Send signed request to backend
4. Backend validates signature and processes request

### Error Handling
- Network errors are detected and display user-friendly messages
- API errors are formatted for better user experience
- Wallet signature rejections are handled gracefully

### Backward Compatibility
- All read operations continue to use direct Supabase queries
- Smart contract interactions remain client-side
- UI/UX remains unchanged for users

## Testing Checklist

### Before Testing
- [ ] Backend is running on localhost:3001
- [ ] Environment variables are set correctly
- [ ] Wallet is connected and has test funds

### User Profile Testing
- [ ] Profile creation with image works
- [ ] Profile creation without image works
- [ ] Profile update functionality works
- [ ] Authentication flow completes successfully
- [ ] Error handling works for various scenarios

### Circle Creation Testing
- [ ] Circle creation with image works
- [ ] Circle creation without image works
- [ ] Smart contract deployment still works
- [ ] Metadata creation is atomic with contract deployment
- [ ] Error scenarios are handled properly

### Integration Testing
- [ ] Backend connection works
- [ ] CORS is configured correctly
- [ ] Request/response formats match expectations
- [ ] Existing read operations continue to work
- [ ] No console errors in browser
- [ ] Images upload and display correctly
# 🐛 **Debugging Guide - Profile Creation Issues**

## ✅ **Fixed Issues**

### **1. Authentication Field Mismatch** 
**Problem**: Backend middleware expected `address` field, but frontend was sending `userAddress`  
**Solution**: Updated API client to send both `address` (for auth) and `userAddress` (for controller)

## 🔍 **Current Issue: Supabase 406 Errors**

### **Root Cause Analysis**
The 406 errors on Supabase read operations suggest the profile doesn't exist in database yet. This is normal for new users.

### **Error Details**
```
vdvzldyqolgeukepwlzc.supabase.co/rest/v1/kuri_user_profiles?select=*&user_address=eq.0x3fa03091e2a0d0090fb44410d12610d56126adcb:1  
Failed to load resource: the server responded with a status of 406 ()
```

## 🧪 **Testing Steps**

### **1. Test Backend Authentication Fix**
```bash
# Test with curl to verify backend accepts the fixed format
curl -X POST http://localhost:3001/api/users/profile \
  -F "address=0x3Fa03091e2A0d0090fb44410D12610D56126adCB" \
  -F "userAddress=0x3Fa03091e2A0d0090fb44410D12610D56126adCB" \
  -F "username=testuser" \
  -F "displayName=Test User" \
  -F "message=Kuri create_profile authentication\r\nAddress: 0x3Fa03091e2A0d0090fb44410D12610D56126adCB\r\nTimestamp: 1753595996206" \
  -F "signature=0xdc7ade878bb5e587ff56584528f54760c865546cc029740e00fe38095557c3a377d67599b5b50e08f31bb6a00cca244a60e23772903912a2b98c2a17279e12f01c"
```

### **2. Test Profile Creation Flow**
1. **Connect Wallet**: Ensure wallet is connected
2. **Navigate to Onboarding**: Go to `/onboarding` page
3. **Fill Profile Form**: 
   - Username: `testuser123`
   - Display Name: `Test User`
   - Optional: Upload profile image
4. **Submit Form**: Click "Complete Profile"
5. **Sign Message**: Approve wallet signature popup
6. **Check Result**: Profile should be created successfully

### **3. Expected Flow**
```
1. User fills form → 2. Wallet signature → 3. Backend API call → 4. Profile created → 5. Success message
```

## 🔧 **Backend Logging**
The backend should now log:
```javascript
Authentication request body: {
  address: '0x3Fa03091e2A0d0090fb44410D12610D56126adCB',     // ✅ Now present
  userAddress: '0x3Fa03091e2A0d0090fb44410D12610D56126adCB',
  username: 'testuser123',
  displayName: 'Test User',
  message: 'Kuri create_profile authentication...',
  signature: '0x...'
}
```

## 🚨 **If Still Getting Errors**

### **Possible Issues**:
1. **Signature Verification**: Check if signature validation is failing
2. **Message Format**: Ensure message format matches what backend expects
3. **CORS**: Verify CORS is properly configured
4. **Database Schema**: Check if `kuri_user_profiles` table exists in Supabase

### **Debug Steps**:
1. **Check Backend Logs**: Look for authentication errors
2. **Check Network Tab**: Verify request format in browser dev tools
3. **Test Message Generation**: Ensure auth message matches backend expectation
4. **Verify Signature**: Test signature generation and verification

## 📋 **Quick Test Checklist**

- [ ] Backend server running on localhost:3001
- [ ] Wallet connected with address `0x3Fa03091e2A0d0090fb44410D12610D56126adCB`
- [ ] Navigate to onboarding page
- [ ] Fill out profile form
- [ ] Click submit (should trigger wallet signature)
- [ ] Check browser network tab for API call
- [ ] Check backend console for authentication logs
- [ ] Verify profile created in Supabase dashboard

## 💡 **Next Steps**

1. **Test Profile Creation**: Try creating profile with the fixed authentication
2. **Monitor Backend Logs**: Check if authentication now succeeds
3. **Verify Database**: Check if profile is created in Supabase
4. **Test Circle Creation**: Once profiles work, test circle creation flow

The main authentication issue should now be resolved. The Supabase 406 errors are likely just because the profile doesn't exist yet - this is expected for new users.
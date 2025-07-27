# 🔐 **Signature Verification Debug Guide**

## 🐛 **Current Issue**
Signature verification is failing due to line ending mismatch between message generation and verification.

## 📊 **Debug Data from Backend**
```
Authentication request body: {
  address: '0x3Fa03091e2A0d0090fb44410D12610D56126adCB',
  message: 'Kuri create_profile authentication\r\n' +           // ❌ \r\n (Windows)
    'Address: 0x3Fa03091e2A0d0090fb44410D12610D56126adCB\r\n' +
    'Timestamp: 1753596962948',
  signature: '0x2f5db3348b928dc7da333ce4309369b230df77f7aeb0b159561abd5a1e6d75675135e986b5c48a6598bcff8a88583efc156c1ed17525796e4f37632aaa604cea1c'
}

Expected message format: 'Kuri create_profile authentication\n...'  // ✅ \n (Unix)
```

## 🔧 **Root Cause**
The backend generates messages with `\n` line endings, but somewhere in the process (likely HTTP transport or frontend processing), they get converted to `\r\n`.

## ✅ **Fix Applied**
Updated backend `AuthService.verifySignature()` to normalize line endings before verification:

```typescript
// Normalize line endings to handle \r\n vs \n differences
const normalizedMessage = payload.message.replace(/\r\n/g, '\n');

const isValid = await verifyMessage({
  address: payload.address,
  message: normalizedMessage,  // Use normalized message
  signature: payload.signature,
});
```

## 🧪 **Test the Fix**

### **1. Check Backend Logs**
After the fix, you should see additional logging:
```
Original message: "Kuri create_profile authentication\r\nAddress: 0x...\r\nTimestamp: ..."
Normalized message: "Kuri create_profile authentication\nAddress: 0x...\nTimestamp: ..."
Signature valid: true  // ✅ Should now be true
```

### **2. Test Profile Creation**
1. Navigate to `/onboarding`
2. Fill out profile form:
   - Username: `testuser123` 
   - Display Name: `Test User`
3. Submit form
4. Sign wallet message
5. Check backend logs for "Signature valid: true"
6. Profile should be created successfully

### **3. Expected Success Flow**
```
1. Frontend gets message from backend (/api/auth/message/create_profile/0x...)
2. User signs message with wallet
3. Frontend sends signed data to backend
4. Backend normalizes line endings  
5. Backend verifies signature successfully ✅
6. Profile created in database
7. Success response to frontend
```

## 🔍 **Additional Debug Info**

### **Message Format Verification**
The backend should now log both original and normalized messages to help debug:

```javascript
// Original (what frontend sent)
"Kuri create_profile authentication\r\nAddress: 0x...\r\nTimestamp: ..."

// Normalized (what gets verified)  
"Kuri create_profile authentication\nAddress: 0x...\nTimestamp: ..."
```

### **Signature Verification Process**
1. **Timestamp Check**: Ensures signature is not expired (5 minutes max)
2. **Line Ending Normalization**: Converts `\r\n` to `\n`
3. **Viem Verification**: Uses `verifyMessage()` to validate signature
4. **Result**: Returns true/false based on verification

## 🚨 **If Still Failing**

### **Possible Issues**:
1. **Message Content**: Check if message content matches exactly
2. **Address Case**: Ensure address case matches between message and signature
3. **Timestamp Expiry**: Check if signature is being verified within 5 minutes
4. **Wallet Type**: Different wallets might handle message signing differently

### **Additional Debug Steps**:
1. **Frontend Logging**: Add console.log in frontend before signing
2. **Message Comparison**: Compare generated vs received message character by character
3. **Signature Recreation**: Try regenerating signature with exact same message
4. **Wallet Testing**: Test with different wallet types (MetaMask, WalletConnect)

## 📋 **Quick Verification**

- [ ] Backend server restarted with line ending fix
- [ ] Frontend profile creation attempted  
- [ ] Backend logs show "Original message" and "Normalized message"
- [ ] Backend logs show "Signature valid: true"
- [ ] Profile successfully created in database
- [ ] No more authentication errors

The line ending normalization fix should resolve the signature verification issue.
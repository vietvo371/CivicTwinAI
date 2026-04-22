# 📋 Phân Tích Lưu Luồng Realtime & FCM trên Mobile

**Ngày kiểm tra:** 2026-04-22  
**Trạng thái:** ⚠️ Có vấn đề cần sửa

---

## 🔍 Tóm Tắt Vấn Đề

Luồng Realtime (WebSocket + Pusher/Reverb) và FCM trên mobile **chưa ổn định** vì có nhiều điểm yếu trong kiến trúc:

### 🔴 Vấn Đề Chính

1. **FCM Token không được lưu/đồng bộ đúng cách khi đăng nhập**
   - `NotificationService` yêu cầu quyền và lấy token ngay khi mount
   - Nhưng này **xảy ra TRƯỚC khi AuthProvider hoàn thành login**
   - Token được gửi lên server ngay cả khi chưa có `auth_token` (API sẽ reject)

2. **WebSocket khởi tạo sớm, nhưng Token chưa sẵn sàng**
   - `WebSocketContext.connect()` được gọi trước khi user fully authenticated
   - Có thể dẫn tới authentication error (401/403) khi subscribe channels

3. **Pusher Instance lấy rất khó (indirect path)**
   - Code phải dig vào `echo.connector?.pusher?.connection`
   - Nếu path thay đổi, toàn bộ event binding sẽ fail silently

4. **Không có retry logic cho FCM token sync**
   - Nếu sync thất bại lần đầu, sẽ không retry
   - User không nhận thông báo đẩy (push) vì backend không biết token

5. **NotificationsContext & WebSocketContext không đợi auth sẵn sàng**
   - Dependency nằm ngoài (không có explicit dependency trên `user.id`)
   - Có thể race condition khi user login/logout

6. **Missing error handling & recovery**
   - Khi FCM token refresh → async call mà không có retry
   - Khi WebSocket disconnect → không tự động reconnect

---

## 📊 Sơ Đồ Luồng Hiện Tại (Sai)

```
App mounted
  ↓
NotificationService mount
  ├─ requestUserPermission() ngay (TRƯỚC auth)
  ├─ getToken() → NotificationTokenService.registerTokenAfterLogin()
  │  ├─ Kiểm tra PushNotificationHelper.checkPermission() ✓
  │  ├─ Lấy FCM token ✓
  │  ├─ saveFCMToken() vào AsyncStorage ✓
  │  └─ syncTokenWithServer(token) ❌ ← User chưa login!
  │     └─ authService.getToken() → null
  │        └─ Skip, log "chưa đăng nhập"
  │
  ├─ Auth Provider (login user)
  │  └─ User.id, token available ✓
  │
  ├─ WebSocketProvider mount
  │  ├─ WebSocketService.connect()
  │  │  ├─ Lấy auth_token từ AsyncStorage ✓
  │  │  ├─ Tạo Echo instance ✓
  │  │  ├─ Listen WebSocket events ✓
  │  │  └─ Bind Pusher.connection events ✓
  │  │
  │  └─ isConnected = true ✓
  │
  └─ NotificationsProvider mount
     ├─ subscribe(private-user.{id})
     ├─ subscribe(user-reports)
     └─ listen() cho các event
        └─ Event received ✓ (nếu WS connected)

Nhưng: FCM token KHÔNG được đồng bộ lại sau login!
      → User không nhận push notification từ backend
```

---

## 🔴 Chi Tiết Vấn Đề

### 1️⃣ **NotificationTokenService.registerTokenAfterLogin() — Timing Sai**

**File:** `mobile/src/services/NotificationTokenService.ts` (lines 49-83)

```typescript
static async registerTokenAfterLogin() {
  // ❌ VẤNĐỀ:
  // Được gọi từ NotificationService.getToken()
  // NotificationService mount vào lúc App.tsx render (TRƯỚC AuthProvider)
  
  const loginToken = await authService.getToken();
  if (!loginToken) {
    console.log('ℹ️ Người dùng chưa đăng nhập, bỏ qua...');
    return false; // ← Token KHÔNG được đồng bộ!
  }
  // ...
}
```

**Cây gọi thực tế:**
```
App.tsx render
  ↓
NotificationService component mounts
  ↓
useEffect() → requestUserPermission() → getToken()
  ↓
NotificationTokenService.registerTokenAfterLogin()
  ↓
authService.getToken() ← Trả về null (user chưa login)
  ↓
Log "chưa đăng nhập" & return false
  ↓
USER ĐĂNG NHẬP (1 phút sau)
  ↓
❌ FCM Token KHÔNG được re-sync vì không có trigger nào
```

---

### 2️⃣ **WebSocketProvider — Dependency không rõ ràng**

**File:** `mobile/src/contexts/WebSocketContext.tsx` (lines 27-47)

```typescript
useEffect(() => {
  let mounted = true;
  
  const initWebSocket = async () => {
    // ❌ VẤNĐỀ: Kiểm tra token từ AsyncStorage, nhưng:
    // 1. Token có thể stale (từ previous login)
    // 2. Không kiểm tra xem user có đang ở "authenticated" state
    // 3. Nếu auth header sai → Silent fail
    
    if (!env.ENABLE_WEBSOCKET) return;
    
    const token = await AsyncStorage.getItem('@auth_token');
    if (!token) return; // OK, nhưng...
    
    await WebSocketService.connect();
    setIsConnected(true);
  };
  
  initWebSocket();
  
  // ❌ VẤNĐỀ: Dependency array [isConnected]
  // Này gây vòng lặp vô hạn!
  // Hàm setIsConnected → effect chạy lại → initWebSocket → ...
}, [isConnected]); // ← Sai!
```

**Lỗi logic:**
- Dependency `[isConnected]` → effect chạy lại mỗi khi state thay đổi
- Mỗi lần state thay đổi → `setIsConnected(true)` → Effect chạy → Vòng lặp

---

### 3️⃣ **AuthService.updateFcmToken() — Không được gọi lại sau login**

**File:** `mobile/src/services/authService.ts` (implied, kiểm tra code)

Vấn đề: Một khi `registerTokenAfterLogin()` fail (vì user chưa login), không có trigger nào để gọi lại:

- ❌ Không có hook trong `AuthContext.login()` để sync FCM token
- ❌ Không có `useEffect` trong `NotificationsContext` để re-sync
- ❌ Chỉ có retry khi token refresh (qua `onTokenRefresh`)

---

### 4️⃣ **WebSocketService — Pusher Instance path không ổn**

**File:** `mobile/src/services/websocket.ts` (lines 79-99)

```typescript
// ❌ VẤNĐỀ: Đây là cách lấy Pusher instance:
this.pusher = connector?.pusher?.connection ? connector.pusher : null;

if (!this.pusher && connector?.socket) {
  this.pusher = connector.socket;
}

if (!this.pusher && connector) {
  console.log('🔍 Full connector properties:', connector);
  console.warn('⚠️ Cannot find Pusher instance...');
  return this.echo; // ← Silent fail!
}

// Tại sao?
// - Laravel Echo + Reverb structure không stable
// - Khác giữa version
// - Khác giữa broadcaster (Pusher vs Reverb vs Soketi)
```

Nếu `connector` structure thay đổi → Toàn bộ event binding fail.

---

### 5️⃣ **Realtime Channel Subscriptions — Quá nhiều attempts**

**File:** `mobile/src/contexts/NotificationsContext.tsx` (lines 149-166)

```typescript
// ❌ VẤNĐỀ: Cùng 1 event được listen nhiều cách:
listen(userChannel, 'report.status.updated', handleReportStatusUpdate); // Echo
listen(userChannel, 'App\\Events\\ReportStatusUpdated', handleReportStatusUpdate); // Echo with namespace
listen(userChannel, 'App\\Events\\ReportStatusUpdatedForUsers', handleReportStatusUpdate); // Echo variant

// PLUS:
subscribePusher('user-reports', 'report.status.updated', handleReportStatusUpdate); // Pusher directly

// Kết quả:
// - Nếu 1 cách fail, có 3 backup
// - Nhưng cũng có thể duplicate event (handled 4 lần)
// - Khó debug vì logic nằm rải rác
```

Tuy nhiên, cách này cũng là workaround vì không tin tưởng vào channel subscription reliability.

---

### 6️⃣ **FCM Token Refresh — Không có error handling**

**File:** `mobile/src/components/NotificationService.tsx` (lines 96-99)

```typescript
const unsubscribeOnTokenRefresh = messaging().onTokenRefresh(async token => {
  console.log('🔄 FCM Token đã được làm mới:', token);
  await NotificationTokenService.updateTokenOnRefresh(token); // ← No error handling!
});
```

Nếu `updateTokenOnRefresh()` fail → Silent, không retry.

---

## ✅ Giải Pháp (Roadmap)

### **Phase 1: Fix Critical Issues (Urgent)**

#### 1.1 **Fix: FCM Token được đồng bộ sau login**

```typescript
// AuthContext.tsx - thêm vào handleLogin
export const AuthProvider = ({ children }) => {
  // ...
  
  const handleLogin = async (email, password) => {
    // ... login logic
    const result = await authService.login(email, password);
    
    if (result.success) {
      // ✅ Sau khi user login thành công → sync FCM token
      try {
        await NotificationTokenService.registerTokenAfterLogin();
      } catch (e) {
        console.warn('FCM sync failed after login:', e);
      }
    }
  };
};
```

#### 1.2 **Fix: WebSocketProvider dependency array**

```typescript
// WebSocketContext.tsx
useEffect(() => {
  // ... code
}, []); // ← Change from [isConnected] → [] (run once)
```

#### 1.3 **Fix: NotificationService mount timing**

```typescript
// App.tsx - Move NotificationService INSIDE AuthProvider
<AuthProvider>
  <NotificationService />
  <WebSocketProvider>
    <NotificationsProvider>
      {/* ... */}
    </NotificationsProvider>
  </WebSocketProvider>
</AuthProvider>
```

### **Phase 2: Add Resilience (Medium)**

#### 2.1 **Add FCM sync retry logic**

```typescript
// NotificationTokenService.ts
static async syncTokenWithServer(fcmToken: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const loginToken = await authService.getToken();
      if (!loginToken) return false;
      
      await authService.updateFcmToken(fcmToken);
      return true;
    } catch (e) {
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // Exponential backoff
      }
    }
  }
  return false;
}
```

#### 2.2 **Add WebSocket auto-reconnect**

```typescript
// WebSocketService.ts
private reconnectAttempts = 0;

async reconnect() {
  if (this.reconnectAttempts >= 5) {
    console.error('Max reconnect attempts reached');
    return;
  }
  
  const delay = 1000 * Math.pow(2, this.reconnectAttempts);
  console.log(`Reconnecting in ${delay}ms...`);
  
  await new Promise(r => setTimeout(r, delay));
  
  try {
    await this.connect();
    this.reconnectAttempts = 0;
  } catch (e) {
    this.reconnectAttempts++;
    this.reconnect();
  }
}

// Bind to error events:
this.pusher.connection.bind('error', () => {
  this.reconnect();
});
```

### **Phase 3: Monitoring & Debugging (Nice-to-have)**

#### 3.1 **Add status dashboard**

```typescript
// Thêm context để track status:
interface RealtimeStatus {
  websocketConnected: boolean;
  fcmTokenSynced: boolean;
  lastFcmSync: Date | null;
  lastWebSocketError: Error | null;
}
```

#### 3.2 **Add analytics logging**

```typescript
// Mỗi event quan trọng → ghi log
console.log('[REALTIME]', {
  event: 'fcm_sync',
  success: true,
  timestamp: Date.now(),
  token: token.substring(0, 20) + '...',
});
```

---

## 📋 Checklist Test

```
[ ] FCM token được lấy & lưu vào AsyncStorage khi app mount
[ ] User đăng nhập → FCM token được sync lên server (check DB)
[ ] WebSocket kết nối thành công (check console logs)
[ ] Realtime channels subscribed đúng (check Reverb logs)
[ ] Incident created trên server → nhận được event trên mobile
[ ] Push notification gửi từ backend → nhận trên mobile (foreground + background)
[ ] Token refresh → sync lại lên server (không có duplicate)
[ ] User logout → FCM token cleared
[ ] Network disconnected → WebSocket reconnect tự động
[ ] Server down rồi up lại → Mobile reconnect tự động
```

---

## 🔧 Tools & Commands để Debug

```bash
# 1. Check backend FCM token (Laravel)
php artisan tinker
>>> User::find(1)->fcm_token
"ABC123DEF456..."

# 2. Test FCM push từ backend
php artisan app:test-fcm-push 1 --title="Test" --body="Hello"

# 3. Check Reverb connection logs
# Xem browser console trên web
# hoặc React Native console trên mobile

# 4. Check WebSocket handshake
# Network tab → WS connections

# 5. Check notification delivery (Firebase Console)
https://console.firebase.google.com/project/YOUR_PROJECT/messaging
```

---

## 📝 Tóm Tắt

| Vấn Đề | Mức Độ | Fix Cơ Bản |
|--------|--------|-----------|
| FCM token không sync sau login | 🔴 Critical | Thêm trigger trong AuthContext.login() |
| WebSocketProvider dependency sai | 🔴 Critical | Đổi dependency → [] |
| NotificationService mount timing | 🟠 High | Move vào AuthProvider |
| Pusher instance path không ổn | 🟠 High | Implement fallback/retry |
| Không có FCM sync retry | 🟡 Medium | Thêm retry logic exponential backoff |
| Không auto-reconnect WS | 🟡 Medium | Thêm reconnect handler |

---

## 📞 Tiếp Theo

Tôi đã chuẩn bị:
1. ✅ Phân tích đầy đủ các vấn đề
2. ✅ Sơ đồ luồng hiện tại (sai)
3. ✅ Giải pháp chi tiết + code snippet

**Bước tiếp theo:**
- [ ] Bạn xác nhận vấn đề nào cần fix trước tiên?
- [ ] Bạn muốn tôi implement các fix không?
- [ ] Có vấn đề gì khác mà bạn đã detect không?

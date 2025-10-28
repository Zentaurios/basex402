# 🔄 PWA Update Management Guide

## How PWA Updates Work with Vercel

When you push to GitHub → Vercel builds → **New PWA version is deployed**

But here's the important part:

### 🎯 **What Happens Automatically:**

1. **You push to GitHub**
2. **Vercel builds and deploys** new version
3. **Service worker file changes** (new build hash)
4. **Users visit your site** → Browser detects new service worker
5. **New service worker downloads** in background
6. **Update notification shows** → "Update Available"
7. **User clicks "Update Now"** → App refreshes with new version

### ✅ **You Now Have:**

- **PWAInstaller** - Handles first-time app installation
- **PWAUpdateNotifier** - Handles updates for installed apps
- **Smart Service Worker** - Manages caching and updates

---

## 🔄 Update Flow for Users

### **Installed PWA Users:**

```
User opens app
    ↓
App checks for updates (every 60 seconds)
    ↓
New version detected?
    ↓ YES
Download new service worker
    ↓
Show "Update Available" notification (top-right)
    ↓
User clicks "Update Now"
    ↓
Activate new service worker
    ↓
Page refreshes with new version
    ↓
✨ User has latest version!
```

### **Browser Users:**

- Just refresh the page → Always get latest version
- No special handling needed

---

## 📦 Versioning Strategy

### **Automatic Versioning (Current Setup)**

Your service worker cache is versioned:
```javascript
const CACHE_NAME = 'x402-v2';
const RUNTIME_CACHE = 'x402-runtime-v2';
```

**When to bump version:**
- Major changes to cached resources
- Breaking changes to app structure
- Significant feature updates

### **How to Update Cache Version:**

Edit `/public/service-worker.js`:

```javascript
// Before deployment
const CACHE_NAME = 'x402-v3';  // Increment version
const RUNTIME_CACHE = 'x402-runtime-v3';  // Increment version
```

This forces all users to download fresh resources.

### **Vercel Build Hash (Automatic)**

Next.js generates unique hashes for each build:
- `_next/static/[hash]/` changes every deployment
- Service worker detects this as a new version
- **You don't need to manually version** most of the time

---

## 🚀 Deployment Workflow

### **Standard Deployment (No Breaking Changes)**

```bash
# 1. Make your changes
git add .
git commit -m "Update feature X"

# 2. Push to GitHub
git push origin main

# 3. Vercel deploys automatically
# 4. Users get update notification next time they open app
# 5. They click "Update Now" → Fresh version!
```

**No manual steps needed!** 🎉

### **Major Update Deployment (Breaking Changes)**

```bash
# 1. Bump cache version in service-worker.js
# Edit: const CACHE_NAME = 'x402-v3';

# 2. Commit and push
git add public/service-worker.js
git commit -m "Release v3.0 - Major update"
git push origin main

# 3. Vercel deploys
# 4. Users get update notification
# 5. Old caches are cleared, fresh start
```

---

## 🧪 Testing Updates Locally

### **Test Update Flow:**

```bash
# 1. Build and start current version
npm run build
npm start

# 2. In another terminal, make a change
# Edit any file (e.g., change text in header)

# 3. Build again (this simulates a new deployment)
npm run build

# 4. The running app will detect the new service worker
# 5. You'll see the "Update Available" notification
# 6. Click "Update Now" to test the update flow
```

### **Force Cache Refresh:**

If you need to clear caches during development:

1. Open DevTools (F12)
2. Application tab → Service Workers
3. Click "Unregister"
4. Application tab → Storage → Clear site data
5. Refresh page

---

## ⚙️ Update Configuration

### **Update Check Frequency**

Located in `PWAUpdateNotifier.tsx`:

```typescript
// Check for updates every 60 seconds
const updateInterval = setInterval(checkForUpdates, 60000);
```

**Adjust as needed:**
- More frequent: `30000` (30 seconds)
- Less frequent: `300000` (5 minutes)
- **Recommended:** 60 seconds (current)

### **Update Notification Behavior**

**Current Setup:**
- Shows at top-right
- User can dismiss (will show again on next check)
- User can update immediately
- Auto-refreshes after update

**To customize:**
- Edit `PWAUpdateNotifier.tsx`
- Change colors, position, text, etc.

---

## 📊 Monitoring Updates

### **Check Service Worker Status:**

DevTools → Application → Service Workers:
- **Active**: Currently running version
- **Waiting**: New version ready to activate
- **Installing**: New version downloading

### **Check Cache Status:**

DevTools → Application → Cache Storage:
- See what's cached
- Verify version numbers
- Check resource freshness

### **Console Logs:**

Your PWA logs update events:
```
[PWA Update] New version found, installing...
[PWA Update] New version installed, waiting to activate
[PWA Update] Activating new version...
[PWA Update] New version activated, reloading...
```

---

## 🐛 Troubleshooting Updates

### **"Update notification keeps appearing"**

**Cause**: Service worker stuck in "waiting" state

**Fix:**
```javascript
// In DevTools → Application → Service Workers
// Click "skipWaiting" for the waiting worker
```

### **"Users not getting updates"**

**Check:**
1. ✅ Vercel deployed successfully
2. ✅ Service worker file changed (check file hash)
3. ✅ PWAUpdateNotifier is in layout.tsx
4. ✅ User actually opened the app (updates only check when app is open)

**Fix:**
- Bump cache version to force update
- Check browser console for errors
- Verify service worker is registered

### **"Old content still showing after update"**

**Cause**: Aggressive caching

**Fix:**
1. Bump cache version in service-worker.js
2. Or clear cache manually in DevTools
3. Deploy with new cache version

### **"Service worker won't update"**

**Check:**
1. Are you in production mode? (`npm run build`)
2. Is HTTPS enabled? (required for SW)
3. Check browser console for errors
4. Try unregistering and re-registering SW

---

## 🎯 Best Practices

### **1. Version Your Major Updates**

```javascript
// public/service-worker.js
const CACHE_NAME = 'x402-v3';  // Bump for major changes
```

### **2. Test Updates Before Deploying**

```bash
# Build twice locally and test update flow
npm run build && npm start
# (make changes)
npm run build
# (test update notification)
```

### **3. Communicate with Users**

Add version number to footer:
```typescript
<span>v3.0.1</span>
```

### **4. Monitor Update Success**

Use analytics to track:
- How many users update immediately
- How long until users get updates
- Update completion rate

### **5. Graceful Degradation**

Your PWA works fine without updates:
- Old version continues working
- No forced updates
- User chooses when to update

---

## 📱 What Users Experience

### **Desktop:**
1. App running in background
2. Notification appears at top-right: "Update Available"
3. Click "Update Now"
4. App refreshes instantly
5. ✨ New version loaded!

### **Mobile:**
1. Open app from home screen
2. Banner appears: "Update Available"
3. Tap "Update Now"
4. App reloads
5. ✨ Updated!

**Total time:** < 5 seconds

---

## 🚢 Pre-Deployment Checklist

Before each deployment:

### **Regular Deployment:**
- [ ] Test locally (`npm run build && npm start`)
- [ ] Verify no console errors
- [ ] Push to GitHub
- [ ] Verify Vercel deployment succeeds
- [ ] Test update notification (visit site from installed app)

### **Major Version Deployment:**
- [ ] Bump cache version in `service-worker.js`
- [ ] Update version number in footer/about page
- [ ] Test locally with cache clearing
- [ ] Create changelog/release notes
- [ ] Push to GitHub
- [ ] Verify Vercel deployment
- [ ] Monitor update adoption

---

## 🎊 Summary

### **✅ You Have Full Update Management:**

1. **Automatic Detection** - Users are notified of new versions
2. **User Control** - They choose when to update
3. **Smooth Updates** - Instant refresh, no data loss
4. **Background Updates** - Downloads while app is open
5. **Vercel Integration** - Works seamlessly with your deployment

### **🚀 Your Update Flow:**

```
Push to GitHub
    ↓
Vercel builds & deploys
    ↓
Service worker changes detected
    ↓
Update notification shows to users
    ↓
Users click "Update Now"
    ↓
Fresh version loaded
    ↓
✨ Done!
```

**Zero manual intervention needed!**

### **💡 Key Points:**

- ✅ Updates are **automatic** but **user-controlled**
- ✅ No "force update" - users choose when
- ✅ Works seamlessly with Vercel deployments
- ✅ Checks for updates every 60 seconds
- ✅ Old caches automatically cleaned up
- ✅ Users always have a working app

Your PWA update system is production-ready! 🎉

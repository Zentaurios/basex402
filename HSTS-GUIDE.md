# 🔒 HSTS Configuration Guide

## What is HSTS?

**HTTP Strict Transport Security (HSTS)** tells browsers:
> "This website ONLY works over HTTPS. Never try HTTP, even if the user types it."

---

## 🎯 Current Configuration (Conservative)

```typescript
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### What This Means:
- ✅ **max-age=31536000** - Remember for 1 year (31,536,000 seconds)
- ✅ **includeSubDomains** - Applies to all subdomains too
- ❌ **NO preload** - Not added to browser's hardcoded list

### Why This is Safer:
- 1 year is long enough for security
- Can "expire" if you need to change something
- Not permanently locked into HSTS preload list
- Still gives you excellent security

---

## 🔐 HSTS Options Explained

### **Option 1: Conservative (CURRENT)** ⭐ Recommended
```typescript
"max-age=31536000; includeSubDomains"
```

**Pros:**
- ✅ 1-year protection is plenty
- ✅ Can change your mind after 1 year
- ✅ Not on preload list (easier to remove)
- ✅ Works with all Vercel deployments

**Cons:**
- ⚠️ First-time visitors not protected until they visit once
- ⚠️ Can be bypassed with DNS spoofing (rare)

**Best For:**
- Most production websites
- New projects
- When you want strong security with flexibility

---

### **Option 2: Aggressive (Previous Config)**
```typescript
"max-age=63072000; includeSubDomains; preload"
```

**Pros:**
- ✅ 2-year protection
- ✅ Preload list protects first-time visitors
- ✅ Maximum security
- ✅ No HTTPS bypass possible

**Cons:**
- ❌ Takes MONTHS to get off preload list if needed
- ❌ If SSL breaks, users can't access site at all
- ❌ ALL subdomains must have HTTPS forever
- ❌ Can't temporarily disable HTTPS

**Best For:**
- Mature products with stable SSL
- High-security applications (banking, healthcare)
- When you're 100% confident in your setup

---

### **Option 3: Development-Friendly**
```typescript
"max-age=86400; includeSubDomains"
```

**Pros:**
- ✅ Only 1 day (24 hours)
- ✅ Easy to test and iterate
- ✅ Mistakes only last 24 hours

**Cons:**
- ⚠️ Minimal protection
- ⚠️ Not suitable for production

**Best For:**
- Staging environments
- Testing HSTS behavior
- Development domains

---

## 🚨 What Happens If Things Go Wrong?

### **Scenario: SSL Certificate Expires**

#### **Without HSTS:**
```
User visits site
    ↓
Browser shows SSL warning
    ↓
User can click "Advanced" → "Proceed Anyway"
    ↓
Site loads (insecure)
```

#### **With HSTS:**
```
User visits site
    ↓
Browser: "This site requires HTTPS"
    ↓
Connection blocked - NO BYPASS BUTTON
    ↓
User CANNOT access site at all
```

#### **With Vercel:**
- ✅ Vercel auto-renews certificates
- ✅ Certificates last 90 days
- ✅ Renewal happens at 60 days
- ✅ You get email alerts if renewal fails
- ✅ Extremely reliable (~99.99% uptime)

**Verdict:** Very unlikely to be a problem with Vercel ✅

---

## 🤔 Should You Use HSTS Preload?

The `preload` directive is the most controversial part of HSTS.

### **How Preload Works:**

1. You add `preload` to your HSTS header
2. You submit your domain to https://hstspreload.org
3. After review (weeks/months), your domain is added to:
   - Chrome's hardcoded list
   - Firefox's hardcoded list
   - Safari's hardcoded list
   - Edge's hardcoded list
4. These lists are baked into browsers

### **Effect:**
- **First-time visitors** are forced to HTTPS BEFORE ever visiting your site
- Even typing `http://` redirects to `https://` instantly
- Even on first visit, no HTTP connection possible

### **The Problem:**
Once on the preload list:
- Takes 3-6+ months to get removed
- Affects ALL users globally
- Can't be undone quickly

### **When to Use Preload:**

✅ **Yes, use preload if:**
- Your site has been running on HTTPS for 6+ months without issues
- You're 100% certain you'll never need HTTP
- Your SSL setup is rock-solid
- You have monitoring for SSL issues
- All your subdomains support HTTPS

❌ **No, skip preload if:**
- Your site is new (< 6 months old)
- You're still iterating on infrastructure
- You have any HTTP-only subdomains
- You want flexibility to change things
- You're not 100% confident in your SSL setup

---

## 📊 HSTS Decision Matrix

| Factor | Conservative (1 yr) | Aggressive (2 yr + preload) |
|--------|--------------------|-----------------------------|
| **Security** | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐⭐ Excellent |
| **Flexibility** | ⭐⭐⭐⭐⭐ High | ⭐⭐ Low |
| **Risk** | ⭐⭐ Low | ⭐⭐⭐⭐ Higher |
| **Best For** | Most sites | Mission-critical |
| **Recommended?** | ✅ **YES** | Maybe later |

---

## 🎯 Recommendations for X402

### **Start with: Conservative (CURRENT)** ✅

```typescript
"max-age=31536000; includeSubDomains"
```

**Why:**
1. Your site is new
2. You're still deploying and iterating
3. 1 year is plenty of protection
4. Gives you flexibility
5. Can upgrade to aggressive later

### **After 6-12 Months: Consider Aggressive**

Once you're confident:
```typescript
"max-age=63072000; includeSubDomains; preload"
```

Then submit to: https://hstspreload.org

---

## 🛠️ How to Change HSTS Settings

### **Increase Security (Easy):**

```typescript
// In next.config.ts
"max-age=63072000; includeSubDomains; preload"
```

Deploy → Takes effect immediately

### **Decrease Security (Harder):**

1. **Remove HSTS header** from next.config.ts
2. **Deploy** to production
3. **Wait** for old max-age to expire (could be 1-2 years!)
4. Only then can users access via HTTP

**OR:**

1. Users can manually clear HSTS settings:
   - Chrome: `chrome://net-internals/#hsts`
   - Delete domain from HSTS
   - Not practical for all users

---

## 🧪 Testing HSTS

### **Test Current HSTS Settings:**

```bash
# Check HSTS header
curl -I https://your-domain.com | grep -i strict

# Should show:
# strict-transport-security: max-age=31536000; includeSubDomains
```

### **Test in Browser:**

1. Visit your site: `https://your-domain.com`
2. Open DevTools → Network tab
3. Look at response headers
4. Find `strict-transport-security`

### **Test HSTS Enforcement:**

1. Visit your site once over HTTPS
2. Try typing `http://your-domain.com` (without the S)
3. Browser should automatically redirect to HTTPS
4. Check URL bar - should show `https://`

---

## 📋 HSTS Checklist

### **Before Enabling HSTS:**
- [x] Site works perfectly on HTTPS ✅ (Vercel handles this)
- [x] All assets load over HTTPS ✅
- [x] No mixed content warnings ✅
- [x] SSL certificate is valid ✅ (Vercel auto-renews)
- [x] All subdomains support HTTPS ✅ (or don't use includeSubDomains)

### **After Enabling HSTS:**
- [ ] Test site loads over HTTPS
- [ ] Test HTTP redirects to HTTPS
- [ ] Check HSTS header is present
- [ ] Monitor for SSL certificate issues
- [ ] Set up alerts for SSL expiration

---

## 🚨 Emergency: Disable HSTS

If you MUST disable HSTS (SSL totally broken):

### **Step 1: Remove from next.config.ts**
```typescript
// Comment out HSTS
// {
//   key: "Strict-Transport-Security",
//   value: "max-age=31536000; includeSubDomains",
// },
```

### **Step 2: Deploy**
```bash
git push origin main
```

### **Step 3: Send Clear-HSTS Header**
```typescript
{
  key: "Strict-Transport-Security",
  value: "max-age=0", // Tells browsers to forget HSTS
},
```

### **Step 4: Wait**
- Users who visited will need to wait for their HSTS cache to expire
- OR manually clear HSTS in browser settings

### **With Vercel:** This should NEVER be necessary. Their SSL is extremely reliable.

---

## 💡 Best Practices

### **Do:**
✅ Start with 1-year HSTS
✅ Include subdomains if all use HTTPS
✅ Monitor SSL certificate expiration
✅ Set up alerts for SSL issues
✅ Use Vercel's automatic SSL renewal
✅ Test HSTS in staging first
✅ Upgrade to preload after 6-12 months

### **Don't:**
❌ Use preload on new sites
❌ Use HSTS on domains with HTTP-only subdomains
❌ Set max-age too low (< 6 months)
❌ Forget to test after enabling
❌ Ignore SSL certificate warnings
❌ Use HSTS without monitoring

---

## 🎯 Bottom Line

### **Your Current Setup: Perfect!** ⭐

```typescript
"max-age=31536000; includeSubDomains"
```

**You Get:**
- ✅ Excellent security (1-year protection)
- ✅ Flexibility to change if needed
- ✅ Protection for all subdomains
- ✅ Not locked into preload list
- ✅ Works perfectly with Vercel

**You Avoid:**
- ✅ Preload list lock-in
- ✅ 2-year commitment
- ✅ Inability to quickly change
- ✅ Risk of being trapped

### **Upgrade Path:**

**Now:** Conservative HSTS (1 year)
↓
**After 6 months:** Test and verify everything works perfectly
↓
**After 12 months:** Upgrade to 2 years + preload if desired

---

## 🔗 Resources

- [HSTS Preload List](https://hstspreload.org)
- [MDN: HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [HSTS Removal](https://hstspreload.org/removal/)
- [Check HSTS Status](https://www.ssllabs.com/ssltest/)

---

**Your security is solid. Sleep well!** 🔒😴

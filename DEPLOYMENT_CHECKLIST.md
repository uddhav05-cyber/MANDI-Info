# 📋 Deployment Checklist - mandiinfo.in

Use this checklist to track your deployment progress. Check off items as you complete them.

## 🎯 Target: Live by February 2nd, 2026

---

## Phase 1: Pre-Deployment Setup ⏱️ 30 minutes

### Account Creation (No credit card required)
- [ ] Create GitHub account (if not already have)
- [ ] Create Neon.tech account (database)
- [ ] Create Upstash account (Redis cache)
- [ ] Create Render.com account (backend hosting)
- [ ] Create Vercel account (frontend hosting)
- [ ] Create Sentry account (error tracking) - Optional
- [ ] Create UptimeRobot account (monitoring) - Optional
- [ ] Create Cron-job.org account (keep warm) - Optional

### Gmail Setup for OTP
- [ ] Enable 2-Factor Authentication on Gmail
- [ ] Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- [ ] Generate app password
- [ ] Save password securely

### Generate Secrets
- [ ] Generate JWT_SECRET (32+ random characters)
  ```powershell
  # Windows PowerShell:
  [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
  ```
- [ ] Save JWT_SECRET securely

---

## Phase 2: Database Setup ⏱️ 10 minutes

### Neon.tech Configuration
- [ ] Log in to Neon.tech
- [ ] Click "Create Project"
- [ ] Name: `multilingual-mandi`
- [ ] Region: `US East (Ohio)`
- [ ] PostgreSQL version: `16`
- [ ] Click "Create"
- [ ] Go to "Connection Details"
- [ ] Copy connection string (starts with `postgresql://`)
- [ ] Save connection string securely
- [ ] Test connection from local machine (optional)

**Connection String Format**:
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## Phase 3: Redis Cache Setup ⏱️ 5 minutes

### Upstash Configuration
- [ ] Log in to Upstash
- [ ] Click "Create Database"
- [ ] Name: `multilingual-mandi-cache`
- [ ] Type: `Regional`
- [ ] Region: `us-east-1`
- [ ] TLS: `Enabled`
- [ ] Eviction: `allkeys-lru`
- [ ] Click "Create"
- [ ] Go to "Details" tab
- [ ] Copy connection string (starts with `rediss://`)
- [ ] Save connection string securely

**Connection String Format**:
```
rediss://default:password@host.upstash.io:6379
```

---

## Phase 4: Backend Deployment ⏱️ 30 minutes

### Render.com Setup
- [ ] Log in to Render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Select your repository
- [ ] Configure service:
  - [ ] Name: `multilingual-mandi-api`
  - [ ] Region: `Oregon (US West)`
  - [ ] Branch: `main`
  - [ ] Root Directory: (leave empty)
  - [ ] Runtime: `Node`
  - [ ] Build Command: `npm install && npm run build --workspace=backend`
  - [ ] Start Command: `npm start --workspace=backend`
  - [ ] Instance Type: `Free`

### Environment Variables
- [ ] Click "Advanced" → "Add Environment Variable"
- [ ] Add the following variables:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<paste-neon-connection-string>
REDIS_URL=<paste-upstash-connection-string>
REDIS_TLS=true
JWT_SECRET=<paste-generated-jwt-secret>
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=10
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-gmail-address>
SMTP_PASSWORD=<your-gmail-app-password>
SMTP_FROM=Multilingual Mandi <your-gmail-address>
LIBRETRANSLATE_URL=https://libretranslate.com
ENABLE_OTP_EMAIL=true
ENABLE_PHOTO_RECOGNITION=true
ENABLE_TRANSLATION=true
CORS_ORIGIN=https://mandiinfo.in,https://www.mandiinfo.in
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Deploy and Verify
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Check build logs for errors
- [ ] Verify deployment successful (green checkmark)
- [ ] Copy service URL (e.g., `https://multilingual-mandi-api.onrender.com`)
- [ ] Test health check: Visit `https://your-service.onrender.com/health`
- [ ] Should return JSON with status "healthy"

---

## Phase 5: Frontend Deployment ⏱️ 20 minutes

### Vercel Setup
- [ ] Log in to Vercel
- [ ] Click "Add New..." → "Project"
- [ ] Import GitHub repository
- [ ] Select your repository
- [ ] Configure project:
  - [ ] Framework Preset: `Vite`
  - [ ] Root Directory: `packages/frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
  - [ ] Install Command: `npm install`

### Environment Variables
- [ ] Click "Environment Variables"
- [ ] Add the following:

```
VITE_API_URL=https://api.mandiinfo.in
```

(We'll update this after domain configuration)

### Deploy and Verify
- [ ] Click "Deploy"
- [ ] Wait for deployment (2-5 minutes)
- [ ] Check build logs for errors
- [ ] Verify deployment successful
- [ ] Copy deployment URL (e.g., `https://your-project.vercel.app`)
- [ ] Visit URL and verify frontend loads
- [ ] Check browser console for errors

---

## Phase 6: Domain Configuration ⏱️ 30 minutes + DNS wait

### Vercel Domain Setup
- [ ] In Vercel dashboard, go to your project
- [ ] Click "Settings" → "Domains"
- [ ] Add domain: `mandiinfo.in`
- [ ] Add domain: `www.mandiinfo.in`
- [ ] Copy DNS records shown by Vercel:
  ```
  Type: A, Name: @, Value: 76.76.21.21
  Type: CNAME, Name: www, Value: cname.vercel-dns.com
  ```

### Render Domain Setup
- [ ] In Render dashboard, go to your web service
- [ ] Click "Settings" → "Custom Domain"
- [ ] Add domain: `api.mandiinfo.in`
- [ ] Copy CNAME record shown by Render:
  ```
  Type: CNAME, Name: api, Value: <your-service>.onrender.com
  ```

### DNS Configuration at Registrar
- [ ] Log in to your domain registrar (where you bought mandiinfo.in)
- [ ] Go to DNS settings / DNS management
- [ ] Add/Update the following records:

**Frontend Records**:
- [ ] Type: `A`, Name: `@`, Value: `76.76.21.21`, TTL: `3600`
- [ ] Type: `CNAME`, Name: `www`, Value: `cname.vercel-dns.com`, TTL: `3600`

**Backend Record**:
- [ ] Type: `CNAME`, Name: `api`, Value: `<your-render-service>.onrender.com`, TTL: `3600`

- [ ] Save DNS changes
- [ ] Note the time (DNS propagation can take 1-24 hours)

### Verify DNS Propagation
- [ ] Wait 1-2 hours minimum
- [ ] Check DNS propagation: [dnschecker.org](https://dnschecker.org)
  - [ ] Check `mandiinfo.in` → should resolve to `76.76.21.21`
  - [ ] Check `www.mandiinfo.in` → should resolve to Vercel
  - [ ] Check `api.mandiinfo.in` → should resolve to Render

### Update Frontend Environment Variable
- [ ] Go back to Vercel dashboard
- [ ] Go to "Settings" → "Environment Variables"
- [ ] Update `VITE_API_URL` to: `https://api.mandiinfo.in`
- [ ] Click "Save"
- [ ] Go to "Deployments"
- [ ] Find latest deployment
- [ ] Click "..." → "Redeploy"

### Verify HTTPS
- [ ] Wait for SSL certificates to be provisioned (5-10 minutes after DNS)
- [ ] Visit `https://mandiinfo.in` → should load with green padlock
- [ ] Visit `https://www.mandiinfo.in` → should load with green padlock
- [ ] Visit `https://api.mandiinfo.in/health` → should return JSON
- [ ] Verify HTTP redirects to HTTPS

---

## Phase 7: Monitoring Setup ⏱️ 20 minutes

### Keep Backend Warm (Prevent Cold Starts)
- [ ] Go to [cron-job.org](https://cron-job.org)
- [ ] Sign up (free)
- [ ] Click "Create Cron Job"
- [ ] Title: `Keep Mandi API Warm`
- [ ] URL: `https://api.mandiinfo.in/health`
- [ ] Schedule: Every `14` minutes
- [ ] Method: `GET`
- [ ] Save and enable

### Uptime Monitoring
- [ ] Go to [uptimerobot.com](https://uptimerobot.com)
- [ ] Sign up (free)
- [ ] Click "Add New Monitor"
- [ ] Monitor 1:
  - [ ] Type: `HTTP(s)`
  - [ ] Name: `Mandi Frontend`
  - [ ] URL: `https://mandiinfo.in`
  - [ ] Interval: `5 minutes`
- [ ] Monitor 2:
  - [ ] Type: `HTTP(s)`
  - [ ] Name: `Mandi API`
  - [ ] URL: `https://api.mandiinfo.in/health`
  - [ ] Interval: `5 minutes`
- [ ] Configure alert contacts (email)
- [ ] Save monitors

### Error Tracking (Optional but Recommended)
- [ ] Go to [sentry.io](https://sentry.io)
- [ ] Sign up with GitHub (free)
- [ ] Create organization
- [ ] Create project: `multilingual-mandi-backend`
  - [ ] Platform: `Node.js`
  - [ ] Copy DSN
- [ ] Create project: `multilingual-mandi-frontend`
  - [ ] Platform: `React`
  - [ ] Copy DSN
- [ ] Add backend DSN to Render environment variables:
  - [ ] `SENTRY_DSN=<backend-dsn>`
- [ ] Add frontend DSN to Vercel environment variables:
  - [ ] `VITE_SENTRY_DSN=<frontend-dsn>`
- [ ] Redeploy both services

---

## Phase 8: Final Verification ⏱️ 30 minutes

### Infrastructure Tests
- [ ] Frontend loads at `https://mandiinfo.in`
- [ ] Backend health check works: `https://api.mandiinfo.in/health`
- [ ] SSL certificates are valid (green padlock)
- [ ] HTTP redirects to HTTPS
- [ ] No console errors in browser

### Functional Tests
- [ ] User registration works
- [ ] OTP email is received
- [ ] User can log in
- [ ] Can create a product
- [ ] Can view product list
- [ ] Can search products
- [ ] Translation works (if configured)
- [ ] QR code generation works
- [ ] WhatsApp sharing works
- [ ] Offline mode works (PWA)

### Performance Tests
- [ ] Frontend loads in < 3 seconds
- [ ] API responds in < 2 seconds
- [ ] No cold start issues (if cron job is running)

### Monitoring Tests
- [ ] UptimeRobot shows both monitors as "Up"
- [ ] Cron job is running (check cron-job.org dashboard)
- [ ] Sentry is capturing events (if configured)

---

## Phase 9: Post-Launch ⏱️ Ongoing

### Daily Tasks
- [ ] Check UptimeRobot for downtime alerts
- [ ] Check Sentry for new errors
- [ ] Monitor Vercel bandwidth usage
- [ ] Monitor Render compute hours
- [ ] Monitor Neon storage usage
- [ ] Monitor Upstash command usage

### Weekly Tasks
- [ ] Review error logs in Sentry
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Update documentation if needed

### Monthly Tasks
- [ ] Review all service usage (stay within free tiers)
- [ ] Test backup restoration
- [ ] Review and update dependencies
- [ ] Security audit

---

## 🎉 Deployment Complete!

Once all items are checked, your application is live at:
- **Frontend**: https://mandiinfo.in
- **Backend API**: https://api.mandiinfo.in

**Total Cost**: $0.00 per month

---

## 📊 Service Dashboards

Keep these links handy for monitoring:

- **Vercel**: https://vercel.com/dashboard
- **Render**: https://dashboard.render.com
- **Neon**: https://console.neon.tech
- **Upstash**: https://console.upstash.com
- **Sentry**: https://sentry.io
- **UptimeRobot**: https://uptimerobot.com/dashboard
- **Cron-job.org**: https://cron-job.org/en/members/jobs/

---

## 🆘 Troubleshooting

If something doesn't work, check:
1. DEPLOYMENT.md troubleshooting section
2. Service logs (Vercel, Render)
3. Environment variables are correct
4. DNS has propagated
5. SSL certificates are provisioned

---

**Good luck! 🚀**

**Last Updated**: January 29, 2026

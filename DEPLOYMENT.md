# Deployment Guide: Multilingual Mandi

This guide will walk you through deploying the Multilingual Mandi application to production on **mandiinfo.in** using **100% free services** with **zero budget**.

## 🎯 Deployment Timeline

**Target**: Deploy by February 2nd, 2026
**Estimated Time**: 4-6 hours (can be done in one day)

## 📋 Prerequisites

- GitHub account (free)
- Domain: mandiinfo.in (you already have this)
- Access to domain registrar for DNS configuration

## 🚀 Quick Start Deployment

### Step 1: Database Setup (Neon.tech) - 10 minutes

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up with GitHub (no credit card required)
3. Click "Create Project"
   - Name: `multilingual-mandi`
   - Region: `US East (Ohio)` (closest to Render.com)
   - PostgreSQL version: `16`
4. Click on "Connection Details"
5. Copy the connection string (it looks like):
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
6. Save this for later - you'll need it for backend deployment

**Free Tier Limits**:
- 0.5 GB storage
- 100 compute hours/month
- Automatic scale-to-zero after 5 minutes of inactivity

### Step 2: Redis Cache Setup (Upstash) - 5 minutes

1. Go to [https://upstash.com](https://upstash.com)
2. Sign up with GitHub (no credit card required)
3. Click "Create Database"
   - Name: `multilingual-mandi-cache`
   - Type: `Regional`
   - Region: `us-east-1` (closest to Render.com)
   - TLS: `Enabled`
   - Eviction: `allkeys-lru`
4. Click on "Details" tab
5. Copy the connection string (it looks like):
   ```
   rediss://default:password@host.upstash.io:6379
   ```
6. Save this for later

**Free Tier Limits**:
- 10,000 commands/day
- 100 MB storage

### Step 3: Backend Deployment (Render.com) - 20 minutes

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub (no credit card required)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: `multilingual-mandi-api`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build --workspace=backend`
   - **Start Command**: `npm run migrate --workspace=backend && npm start --workspace=backend`
   - **Instance Type**: `Free`

6. Click "Advanced" and add environment variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste-neon-connection-string>
   REDIS_URL=<paste-upstash-connection-string>
   REDIS_TLS=true
   JWT_SECRET=<generate-random-string>
   JWT_EXPIRES_IN=7d
   OTP_EXPIRY_MINUTES=10
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=<your-gmail>
   SMTP_PASSWORD=<your-gmail-app-password>
   SMTP_FROM=Multilingual Mandi <your-gmail>
   LIBRETRANSLATE_URL=https://libretranslate.com
   ENABLE_OTP_EMAIL=true
   ENABLE_PHOTO_RECOGNITION=true
   ENABLE_TRANSLATION=true
   CORS_ORIGIN=https://mandiinfo.in,https://www.mandiinfo.in
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

   **To generate JWT_SECRET**:
   ```bash
   # On Linux/Mac:
   openssl rand -base64 32
   
   # On Windows PowerShell:
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

   **To get Gmail App Password**:
   - Enable 2-Factor Authentication on your Gmail account
   - Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Generate a new app password
   - Copy the 16-character password

7. Click "Create Web Service"
8. Wait for deployment (5-10 minutes)
9. Once deployed, copy the service URL: `https://multilingual-mandi-api.onrender.com`

**Free Tier Limits**:
- 750 hours/month
- 512 MB RAM
- Spins down after 15 minutes of inactivity
- Cold start: ~30 seconds

### Step 4: Frontend Deployment (Vercel) - 15 minutes

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub (no credit card required)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `packages/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. Add environment variables:
   ```
   VITE_API_URL=https://api.mandiinfo.in
   ```
   (We'll configure the custom domain in the next step)

7. Click "Deploy"
8. Wait for deployment (2-5 minutes)
9. Once deployed, you'll get a URL like: `https://your-project.vercel.app`

**Free Tier Limits**:
- 100 GB bandwidth/month
- Unlimited deployments

### Step 5: Domain Configuration - 30 minutes (+ DNS propagation time)

#### A. Configure Custom Domain in Vercel (Frontend)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add domain: `mandiinfo.in`
4. Add domain: `www.mandiinfo.in`
5. Vercel will show you DNS records to add:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

#### B. Configure Custom Domain in Render (Backend)

1. In Render dashboard, go to your web service
2. Click "Settings" → "Custom Domain"
3. Add domain: `api.mandiinfo.in`
4. Render will show you a CNAME record:
   ```
   Type: CNAME
   Name: api
   Value: multilingual-mandi-api.onrender.com
   ```

#### C. Update DNS Records at Your Domain Registrar

1. Log in to your domain registrar (where you bought mandiinfo.in)
2. Go to DNS settings
3. Add the following records:

   ```
   # Frontend (Vercel)
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 3600
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   
   # Backend (Render)
   Type: CNAME
   Name: api
   Value: multilingual-mandi-api.onrender.com
   TTL: 3600
   ```

4. Save changes
5. Wait for DNS propagation (can take up to 24 hours, usually 1-2 hours)

#### D. Verify DNS Propagation

Check DNS propagation status:
- [https://dnschecker.org](https://dnschecker.org)
- Enter `mandiinfo.in` and check if it resolves to Vercel IP
- Enter `api.mandiinfo.in` and check if it resolves to Render

#### E. Update Frontend Environment Variable

1. Go back to Vercel dashboard
2. Go to "Settings" → "Environment Variables"
3. Update `VITE_API_URL` to: `https://api.mandiinfo.in`
4. Click "Save"
5. Go to "Deployments" and redeploy the latest deployment

### Step 6: SSL/TLS Certificates - Automatic

Both Vercel and Render automatically provision SSL certificates from Let's Encrypt once DNS is configured. This usually takes 5-10 minutes after DNS propagation.

**Verify HTTPS**:
- Visit `https://mandiinfo.in` - should load with green padlock
- Visit `https://api.mandiinfo.in/health` - should return JSON with status

### Step 7: Error Tracking Setup (Sentry) - 10 minutes

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up with GitHub (no credit card required)
3. Create organization (free tier)
4. Create two projects:
   - **Backend**: Node.js/Express
   - **Frontend**: React

5. Copy DSN for backend project
6. Add to Render environment variables:
   ```
   SENTRY_DSN=<backend-dsn>
   ```

7. Copy DSN for frontend project
8. Add to Vercel environment variables:
   ```
   VITE_SENTRY_DSN=<frontend-dsn>
   ```

9. Redeploy both services

**Free Tier Limits**:
- 5,000 errors/month
- 30-day retention

### Step 8: Keep Backend Warm (Prevent Cold Starts) - 5 minutes

Render free tier spins down after 15 minutes of inactivity. To keep it warm:

1. Go to [https://cron-job.org](https://cron-job.org)
2. Sign up (free, no credit card)
3. Create new cron job:
   - **Title**: `Keep Mandi API Warm`
   - **URL**: `https://api.mandiinfo.in/health`
   - **Schedule**: Every 14 minutes
   - **Method**: GET
4. Save and enable

This will ping your backend every 14 minutes to keep it awake.

### Step 9: Monitoring Setup - 10 minutes

1. Go to [https://uptimerobot.com](https://uptimerobot.com)
2. Sign up (free, no credit card)
3. Add two monitors:
   - **Frontend**: `https://mandiinfo.in`
   - **Backend**: `https://api.mandiinfo.in/health`
4. Set check interval: 5 minutes
5. Add your email for alerts

**Free Tier Limits**:
- 50 monitors
- 5-minute check interval

## ✅ Verification Checklist

After deployment, verify everything works:

- [ ] Frontend loads at `https://mandiinfo.in`
- [ ] Backend health check works: `https://api.mandiinfo.in/health`
- [ ] SSL certificates are valid (green padlock)
- [ ] HTTP redirects to HTTPS
- [ ] User registration works
- [ ] OTP email delivery works
- [ ] Product listing works
- [ ] Translation works
- [ ] Image recognition works
- [ ] WhatsApp sharing works
- [ ] Offline mode works
- [ ] Error tracking captures errors in Sentry
- [ ] Uptime monitoring is active

## 🔧 Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify all environment variables are set
- Verify database connection string is correct
- Check if migrations ran successfully

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set to `https://api.mandiinfo.in`
- Check CORS configuration in backend
- Verify DNS is propagated for api subdomain

### Database connection errors
- Verify Neon database is active
- Check connection string format
- Ensure SSL mode is enabled (`?sslmode=require`)
- Check connection pool limits

### Redis connection errors
- Verify Upstash database is active
- Check connection string format (should start with `rediss://`)
- Ensure TLS is enabled

### Email OTP not sending
- Verify Gmail app password is correct
- Check SMTP settings
- Look for errors in Render logs
- Try SendGrid or Mailgun as alternative

### Cold starts taking too long
- Verify cron job is running every 14 minutes
- Check cron-job.org dashboard
- Consider using UptimeRobot as backup

## 📊 Monitoring Resource Usage

Check usage daily to stay within free tiers:

1. **Vercel**: Dashboard → Usage
2. **Render**: Dashboard → Usage
3. **Neon**: Console → Usage
4. **Upstash**: Console → Usage
5. **Sentry**: Dashboard → Usage Stats

## 🔄 Rollback Procedure

If something goes wrong:

### Rollback Frontend (Vercel)
1. Go to Vercel dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

### Rollback Backend (Render)
1. Go to Render dashboard → Deployments
2. Find the last working deployment
3. Click "Redeploy"

## 📝 Post-Deployment Tasks

- [ ] Set up weekly database backups
- [ ] Document any custom configurations
- [ ] Share access with team members
- [ ] Set up monitoring alerts
- [ ] Test all critical user flows
- [ ] Update README with production URLs

## 🎉 You're Live!

Your application is now deployed and accessible at:
- **Frontend**: https://mandiinfo.in
- **Backend API**: https://api.mandiinfo.in

## 💰 Cost Summary

**Total Monthly Cost**: $0.00 (100% free!)

All services used:
- ✅ Vercel (Frontend) - Free
- ✅ Render.com (Backend) - Free
- ✅ Neon.tech (Database) - Free
- ✅ Upstash (Redis) - Free
- ✅ Sentry (Error Tracking) - Free
- ✅ Gmail SMTP (Email OTP) - Free
- ✅ LibreTranslate (Translation) - Free
- ✅ TensorFlow.js (Image Recognition) - Free
- ✅ Cron-job.org (Keep Warm) - Free
- ✅ UptimeRobot (Monitoring) - Free

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service logs (Vercel, Render, Sentry)
3. Check service status pages
4. Refer to RUNBOOK.md for detailed procedures

---

**Last Updated**: January 29, 2026
**Deployment Target**: February 2, 2026

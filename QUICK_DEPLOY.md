# Quick Deploy Guide - Get Live in 2 Hours!

This is a streamlined guide to deploy Multilingual Mandi to mandiinfo.in **TODAY**.

## ⏱️ Time Estimate: 2 hours

## 🚀 Step-by-Step Deployment

### 1. Database Setup (10 min)

1. Go to [neon.tech](https://neon.tech) → Sign up with GitHub
2. Create project → Copy connection string
3. Save it somewhere safe

### 2. Redis Setup (5 min)

1. Go to [upstash.com](https://upstash.com) → Sign up with GitHub
2. Create database → Copy connection string (starts with `rediss://`)
3. Save it

### 3. Backend Deploy (20 min)

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. New Web Service → Connect your repo
3. Settings:
   - Build: `npm install && npm run build --workspace=backend`
   - Start: `npm start --workspace=backend`
   - Add environment variables (see below)
4. Deploy!

**Environment Variables for Render**:
```
NODE_ENV=production
DATABASE_URL=<your-neon-connection-string>
REDIS_URL=<your-upstash-connection-string>
JWT_SECRET=<generate-random-32-char-string>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-gmail>
SMTP_PASSWORD=<your-gmail-app-password>
CORS_ORIGIN=https://mandiinfo.in
```

Generate JWT_SECRET:
```bash
# Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Get Gmail App Password:
- Enable 2FA on Gmail
- Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- Generate password

### 4. Frontend Deploy (15 min)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Import your repo
3. Settings:
   - Root: `packages/frontend`
   - Build: `npm run build`
   - Output: `dist`
4. Add env var: `VITE_API_URL=https://api.mandiinfo.in`
5. Deploy!

### 5. Domain Setup (30 min + DNS wait)

**In Vercel**:
- Add domain: `mandiinfo.in`
- Add domain: `www.mandiinfo.in`
- Copy DNS records shown

**In Render**:
- Add custom domain: `api.mandiinfo.in`
- Copy CNAME record shown

**At Your Domain Registrar**:
Add these DNS records:
```
Type: A, Name: @, Value: 76.76.21.21
Type: CNAME, Name: www, Value: cname.vercel-dns.com
Type: CNAME, Name: api, Value: <your-render-service>.onrender.com
```

Wait 1-2 hours for DNS to propagate.

### 6. Keep Backend Warm (5 min)

1. Go to [cron-job.org](https://cron-job.org) → Sign up
2. Create cron job:
   - URL: `https://api.mandiinfo.in/health`
   - Schedule: Every 14 minutes
3. Enable it

### 7. Monitoring (10 min)

1. Go to [uptimerobot.com](https://uptimerobot.com) → Sign up
2. Add monitor: `https://mandiinfo.in`
3. Add monitor: `https://api.mandiinfo.in/health`
4. Set alerts to your email

## ✅ Verification

After DNS propagates, check:

- [ ] `https://mandiinfo.in` loads
- [ ] `https://api.mandiinfo.in/health` returns JSON
- [ ] Both have green padlock (HTTPS)
- [ ] Can register a user
- [ ] Can create a product

## 🆘 Quick Troubleshooting

**Backend won't start?**
- Check Render logs
- Verify DATABASE_URL is correct
- Check all env vars are set

**Frontend can't connect?**
- Verify `VITE_API_URL=https://api.mandiinfo.in`
- Check CORS_ORIGIN in backend includes your domain
- Redeploy frontend after changing env vars

**DNS not working?**
- Wait longer (can take 24 hours)
- Check [dnschecker.org](https://dnschecker.org)
- Verify records are correct at registrar

## 📞 Need Help?

Check the full DEPLOYMENT.md for detailed instructions and troubleshooting.

---

**You're almost live! 🎉**

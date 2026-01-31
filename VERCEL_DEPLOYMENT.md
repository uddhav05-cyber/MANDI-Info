# Vercel Frontend Deployment Guide

## ✅ Issue Fixed

The "No Output Directory named 'public' found" error has been resolved by creating `vercel.json` configuration files.

## 📁 Files Created

1. **Root `vercel.json`** - Configures Vercel for monorepo structure
2. **`packages/frontend/vercel.json`** - Frontend-specific configuration

Both files specify:
- Output directory: `dist` (Vite's default)
- Build command: `npm run build`
- Framework: Vite
- SPA routing rewrites

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Sign in with GitHub

2. **Import Your Repository**
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project Settings**
   
   Vercel should auto-detect the configuration from `vercel.json`, but verify:
   
   - **Framework Preset**: Vite
   - **Root Directory**: `packages/frontend` (or leave empty if using root vercel.json)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   ```
   VITE_API_URL=https://api.mandiinfo.in
   ```
   
   (You can add more later after backend is deployed)

5. **Deploy**
   - Click "Deploy"
   - Wait 2-5 minutes for build to complete
   - You'll get a URL like: `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from root directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? multilingual-mandi
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

## 🔧 Vercel Configuration Explained

### Root `vercel.json`
```json
{
  "buildCommand": "cd packages/frontend && npm run build",
  "outputDirectory": "packages/frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- **buildCommand**: Navigates to frontend and builds
- **outputDirectory**: Points to Vite's output directory
- **rewrites**: Enables SPA routing (all routes go to index.html)

### Frontend `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- Simpler configuration when deploying from `packages/frontend` directory

## 🎯 Post-Deployment Steps

### 1. Verify Deployment

After deployment succeeds:
- Visit your Vercel URL
- Check that the app loads
- Open browser console for any errors

### 2. Configure Custom Domain

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add domain: `mandiinfo.in`
4. Add domain: `www.mandiinfo.in`
5. Vercel will show DNS records to add:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### 3. Update Environment Variables

Once backend is deployed:
1. Go to "Settings" → "Environment Variables"
2. Update `VITE_API_URL` to: `https://api.mandiinfo.in`
3. Click "Save"
4. Redeploy: Go to "Deployments" → Click "..." → "Redeploy"

### 4. Enable Auto-Deploy

Vercel automatically deploys on every push to `main` branch.

To configure:
1. Go to "Settings" → "Git"
2. Verify "Production Branch" is set to `main`
3. Enable "Auto-deploy" if not already enabled

## 🐛 Troubleshooting

### Build Fails with "No Output Directory"

**Solution**: Ensure `vercel.json` exists and specifies `"outputDirectory": "dist"`

### Build Fails with TypeScript Errors

**Solution**: Run `npm run build --workspace=frontend` locally to see errors

### App Loads but Shows Blank Page

**Possible causes**:
1. **API URL not set**: Add `VITE_API_URL` environment variable
2. **Routing issue**: Verify `rewrites` in `vercel.json`
3. **Build errors**: Check Vercel build logs

### Environment Variables Not Working

**Solution**: 
1. Ensure variables start with `VITE_` prefix
2. Redeploy after adding/changing variables
3. Clear browser cache

### CORS Errors

**Solution**: 
1. Verify backend `CORS_ORIGIN` includes your Vercel domain
2. Update backend environment variable
3. Redeploy backend

## 📊 Monitoring

### View Deployment Logs

1. Go to Vercel dashboard
2. Click on your project
3. Click "Deployments"
4. Click on a deployment to view logs

### View Analytics

1. Go to "Analytics" tab
2. View page views, performance metrics
3. Free tier includes basic analytics

### View Function Logs

1. Go to "Functions" tab (if using serverless functions)
2. View real-time logs

## 🔄 Rollback

If a deployment breaks:

1. Go to "Deployments"
2. Find the last working deployment
3. Click "..." → "Promote to Production"

## 💡 Tips

1. **Preview Deployments**: Every branch push creates a preview URL
2. **Environment Variables**: Use different values for preview vs production
3. **Build Cache**: Vercel caches dependencies for faster builds
4. **Edge Network**: Your app is automatically deployed to Vercel's global CDN
5. **Free Tier**: 100 GB bandwidth/month, unlimited deployments

## 📝 Next Steps

After frontend is deployed:

1. ✅ Frontend deployed to Vercel
2. ⏳ Deploy backend to Render.com
3. ⏳ Configure DNS records
4. ⏳ Update environment variables
5. ⏳ Test end-to-end functionality

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Vite Docs: https://vitejs.dev/guide/
- Check DEPLOYMENT.md for full deployment guide

# Vercel Deployment Guide

## Quick Deploy

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

3. **Environment Variables (Optional)**
   - If you need API keys, add them in Vercel dashboard
   - Go to Project Settings > Environment Variables

## Build Settings

Vercel will automatically:
- Detect Next.js framework
- Run `npm install` or `pnpm install`
- Run `npm run build`
- Deploy to global CDN

## Custom Domain

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

## Performance

- Edge Functions: Ready
- Image Optimization: Enabled
- Analytics: Available in dashboard

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18.x or 20.x)
- Ensure all dependencies are in package.json
- Check build logs in Vercel dashboard

### Three.js Not Rendering
- Ensure `useEffect` only runs on client
- Check browser console for WebGL support

### Content Not Updating
- Clear Vercel cache
- Redeploy from dashboard

## Post-Deploy

- Update social media links in FooterCRT.tsx
- Update contact email in ContactForm.tsx
- Add Google Analytics (optional)

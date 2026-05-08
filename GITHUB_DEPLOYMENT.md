# 🚀 GitHub Deployment Guide

This guide outlines the proper steps to prepare and deploy Quantora to GitHub.

## ✅ Pre-Deployment Checklist

### 1. Clean Up Files

Before pushing to GitHub, ensure these files are NOT committed:

```bash
# Remove if present (they're in .gitignore):
rm -rf Web-App-Builder/node_modules/
rm -rf Web-App-Builder/dist/
rm -rf Web-App-Builder/packages/apm-sdk/dist/
rm -f .env
rm -f .env.local
rm -f Web-App-Builder/.env
rm -f Web-App-Builder/.env.local
rm -rf .vscode/
rm -rf .idea/
rm -rf coverage/
```

### 2. Verify .gitignore

The `.gitignore` file should include:
- ✅ `node_modules/`
- ✅ `dist/`, `build/`
- ✅ `.env`, `.env.local`
- ✅ `.vscode/`, `.idea/`
- ✅ `*.log`, `npm-debug.log*`
- ✅ `coverage/`
- ✅ `.DS_Store`

**Status:** ✅ Already configured

### 3. Environment Variables

**DO NOT commit:**
- `.env` files
- Actual API keys or secrets

**DO commit:**
- `.env.example` - Template with all required variables

**Status:** ✅ `.env.example` is configured

### 4. Documentation

Ensure these files are present and up-to-date:

- ✅ `README.md` - Main project README
- ✅ `Web-App-Builder/README.md` - Application specific docs
- ✅ `ARCHITECTURE_DIAGRAM.md` - System design
- ✅ `QUICK_REFERENCE.md` - Quick lookup guide

**Status:** ✅ All present

### 5. Build & Testing

```bash
# Before pushing, verify everything works:
cd Web-App-Builder

# Type checking
npm run check

# Build verification
npm run verify

# Clean test start
npm ci  # Install from lock file
npm run build

# If successful, ready to push!
```

## 📦 Repository Structure for GitHub

```
Quantora/
├── README.md                          # ✅ Main documentation
├── .gitignore                         # ✅ Git ignore rules
├── LICENSE                            # ✅ MIT License
├── render.yaml                        # ✅ Deployment config
├── docker-compose.yml                 # ✅ Local dev setup
├── Dockerfile                         # ✅ Container config
│
├── ARCHITECTURE_DIAGRAM.md            # ✅ System design
├── QUICK_REFERENCE.md                 # ✅ Quick lookup
├── COMPLETE_SYSTEM_GUIDE.md           # ✅ Full guide
├── BUILD_SUMMARY.md                   # ✅ Build info
├── FEATURE_CHECKLIST.md               # ✅ Features
│
└── Web-App-Builder/
    ├── package.json                   # ✅ Dependencies
    ├── package-lock.json              # ✅ Lock file
    ├── tsconfig.json                  # ✅ TypeScript config
    ├── vite.config.ts                 # ✅ Build config
    ├── tailwind.config.ts             # ✅ Styling config
    ├── drizzle.config.ts              # ✅ DB migrations
    ├── .env.example                   # ✅ Env template
    │
    ├── README.md                      # ✅ App docs
    ├── SETUP.md                       # ✅ Setup guide
    ├── QUICKSTART.md                  # ✅ Quick start
    ├── IMPLEMENTATION_GUIDE.md        # ✅ Implementation
    │
    ├── client/                        # ✅ React frontend
    │   ├── src/
    │   ├── public/
    │   └── index.html
    │
    ├── server/                        # ✅ Express backend
    │   ├── routes.ts
    │   ├── auth.ts
    │   ├── db.ts
    │   ├── index.ts
    │   └── services/
    │
    ├── shared/                        # ✅ Shared code
    │   ├── schema.ts
    │   ├── routes.ts
    │   └── models/
    │
    ├── migrations/                    # ✅ DB migrations
    │   ├── meta/
    │   └── *.sql
    │
    └── packages/apm-sdk/              # ✅ Published SDK
        ├── package.json
        └── src/
```

## 🔐 Secrets Management

### For Local Development
1. Copy `.env.example` to `.env.local`
2. Fill in your values (not committed)

### For Production Deployment
1. Set environment variables in your deployment platform:
   - **Render.com:** Environment tab
   - **Vercel:** Environment Variables
   - **GitHub Actions:** Secrets

2. **Never commit:**
   - API keys
   - Database passwords
   - Session secrets
   - Private tokens

## 🔄 GitHub Actions (Optional)

Create `.github/workflows/deploy.yml` for automated deployment:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: cd Web-App-Builder && npm ci
      - run: cd Web-App-Builder && npm run check
      - run: cd Web-App-Builder && npm run build
      
      # Add deployment steps here
```

## 📋 Deployment Platforms

### Recommended: Render.com

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect GitHub repo to Render
# Dashboard → New Web Service → Connect GitHub

# 3. Configure:
# - Build Command: cd Web-App-Builder && npm install && npm run build
# - Start Command: cd Web-App-Builder && npm start
# - Environment: Add variables from .env.example

# 4. Deploy automatically on push
```

### Alternative: Vercel (Frontend Only)

```bash
# 1. Frontend only deployment
vercel deploy Web-App-Builder/client

# 2. Connect backend separately or use serverless functions
```

### Docker Deployment

```bash
# 1. Build image
docker build -t quantora:latest .

# 2. Push to registry
docker tag quantora:latest your-registry/quantora:latest
docker push your-registry/quantora:latest

# 3. Deploy container
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  -e OPENAI_API_KEY=sk-... \
  your-registry/quantora:latest
```

## 📊 File Size Optimization

### Current Status

```
✅ node_modules/      - EXCLUDED (will reinstall from package.json)
✅ dist/              - EXCLUDED (will rebuild from source)
✅ .env               - EXCLUDED (use .env.example)
✅ Source code        - ~2-5 MB (optimal)
```

### After GitHub Push

Repository size should be **< 10 MB** (if properly configured)

## ✨ Final Checklist

- [ ] All `.env` files removed (kept `.env.example`)
- [ ] `node_modules/` not committed
- [ ] `dist/` and build artifacts not committed
- [ ] `.gitignore` properly configured
- [ ] `README.md` present and up-to-date
- [ ] `.env.example` has all required variables
- [ ] `package.json` and `package-lock.json` present
- [ ] No API keys or secrets in any files
- [ ] Code passes `npm run check`
- [ ] `npm run verify` succeeds
- [ ] Repository is public (or private, as intended)

## 🚀 Deployment Steps

```bash
# 1. Ensure everything is committed (except ignored files)
git status

# 2. Create release tag
git tag -a v1.0.0 -m "Initial release"

# 3. Push to GitHub
git push origin main
git push origin v1.0.0

# 4. Create GitHub release
# Go to GitHub → Releases → Create new release

# 5. Deploy to production
# Connect to Render/Vercel/Docker and deploy
```

## 🔗 Useful Resources

- [Render Deployment Docs](https://render.com/docs)
- [GitHub Actions](https://github.com/features/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Deployment](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## 📞 Troubleshooting

### Issue: Repository too large
**Solution:** Ensure `.gitignore` is working. Check with: `git check-ignore -v <file>`

### Issue: Secrets in history
**Solution:** Use [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to remove

### Issue: Deployment fails
**Solution:** Check logs, verify environment variables set correctly

---

**Ready to deploy? Check the checklist above, then push to GitHub! 🚀**

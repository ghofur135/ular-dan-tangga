# 🐛 Vercel Deployment Troubleshooting

Panduan untuk mengatasi masalah deployment di Vercel.

## 📋 Checklist Awal

Sebelum troubleshoot, pastikan:
- [ ] Code sudah di-push ke GitHub
- [ ] Root directory set ke `SnakeLadderGame`
- [ ] Environment variables sudah diset
- [ ] Build command: `npm run build:web`
- [ ] Output directory: `dist`

---

## 🔍 Common Errors & Solutions

### Error 1: "Command not found: expo"

**Error Message:**
```
Error: Command "expo" not found
```

**Penyebab:** Expo CLI tidak terinstall di build environment

**Solusi:**

**Opsi 1: Update vercel.json**
```json
{
  "buildCommand": "npm run build:web",
  "outputDirectory": "dist"
}
```

**Opsi 2: Update package.json scripts**
```json
{
  "scripts": {
    "build:web": "expo export -p web"
  }
}
```

Kemudian di Vercel settings:
- Build Command: `npm run build:web`

---

### Error 2: "Module not found"

**Error Message:**
```
Error: Cannot find module 'expo'
Error: Cannot find module 'react-native-web'
```

**Penyebab:** Dependencies tidak terinstall dengan benar

**Solusi:**

1. **Clear Vercel cache:**
   - Vercel Dashboard → Settings → General
   - Scroll ke bawah
   - Klik "Clear Cache"
   - Redeploy

2. **Verify package.json:**
   Pastikan semua dependencies ada:
   ```json
   {
     "dependencies": {
       "expo": "~54.0.30",
       "react": "19.1.0",
       "react-dom": "19.1.0",
       "react-native-web": "^0.21.0"
     }
   }
   ```

3. **Force reinstall:**
   - Delete `node_modules` dan `package-lock.json` locally
   - Run `npm install`
   - Commit dan push

---

### Error 3: "Build exceeded maximum duration"

**Error Message:**
```
Error: Build exceeded maximum duration of 45 minutes
```

**Penyebab:** Build terlalu lama

**Solusi:**

1. **Optimize dependencies:**
   Remove unused packages dari `package.json`

2. **Use .vercelignore:**
   Pastikan file `.vercelignore` exclude folder besar:
   ```
   node_modules/
   .expo/
   scripts/
   docs/
   ```

3. **Upgrade Vercel plan** (jika perlu)

---

### Error 4: "Environment variable not set"

**Error Message:**
```
Error: EXPO_PUBLIC_SUPABASE_URL is not defined
```

**Penyebab:** Environment variables tidak diset di Vercel

**Solusi:**

1. **Set di Vercel Dashboard:**
   - Project Settings → Environment Variables
   - Add:
     - `EXPO_PUBLIC_SUPABASE_URL`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Select: Production, Preview, Development
   - Save

2. **Redeploy:**
   - Deployments tab
   - Klik "..." pada latest deployment
   - Klik "Redeploy"

---

### Error 5: "Output directory not found"

**Error Message:**
```
Error: Output directory "dist" not found
```

**Penyebab:** Build command tidak generate folder `dist`

**Solusi:**

1. **Check build command:**
   Vercel Settings → General → Build & Development Settings
   - Build Command: `npm run build:web`
   - Output Directory: `dist`

2. **Test locally:**
   ```bash
   npm run build:web
   ls dist  # Should show files
   ```

3. **Alternative output directory:**
   Jika expo generate folder lain (misal `web-build`), update:
   - Output Directory: `web-build`

---

### Error 6: "Failed to compile"

**Error Message:**
```
Error: Failed to compile
Module parse failed: Unexpected token
```

**Penyebab:** TypeScript atau syntax error

**Solusi:**

1. **Test locally:**
   ```bash
   npm run build:web
   ```
   Fix semua errors yang muncul

2. **Check TypeScript:**
   ```bash
   npx tsc --noEmit
   ```

3. **Update dependencies:**
   ```bash
   npm update
   ```

---

### Error 7: "Root directory not found"

**Error Message:**
```
Error: Root directory "SnakeLadderGame" not found
```

**Penyebab:** Root directory salah

**Solusi:**

1. **Check repository structure:**
   Repository harus punya folder `SnakeLadderGame`

2. **Update Vercel settings:**
   - Project Settings → General
   - Root Directory: `SnakeLadderGame`
   - Save

3. **Verify di GitHub:**
   Buka repository, pastikan struktur:
   ```
   ular-dan-tangga/
   └── SnakeLadderGame/
       ├── package.json
       ├── app.json
       └── ...
   ```

---

## 🔧 Step-by-Step Fix

Jika deployment masih gagal, ikuti langkah ini:

### Step 1: Check Build Logs

1. Buka Vercel Dashboard
2. Klik project Anda
3. Klik tab "Deployments"
4. Klik deployment yang failed
5. Scroll ke "Build Logs"
6. Copy error message

### Step 2: Test Locally

```bash
cd SnakeLadderGame

# Install dependencies
npm install

# Test build
npm run build:web

# Check output
ls dist
```

Jika error muncul, fix dulu locally sebelum deploy.

### Step 3: Verify Configuration

**Vercel Settings:**
- Root Directory: `SnakeLadderGame`
- Build Command: `npm run build:web`
- Output Directory: `dist`
- Install Command: `npm install`

**Environment Variables:**
- `EXPO_PUBLIC_SUPABASE_URL` = `https://xsqdyfexvwomwjqheskv.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` = `your-key`

### Step 4: Clear Cache & Redeploy

1. Settings → General → Clear Cache
2. Deployments → Redeploy

### Step 5: Check GitHub

Pastikan latest code sudah di-push:
```bash
git status
git add .
git commit -m "fix: vercel deployment"
git push origin main
```

---

## 📝 Vercel Configuration Files

### vercel.json (Recommended)

```json
{
  "buildCommand": "npm run build:web",
  "outputDirectory": "dist",
  "devCommand": "npm run web",
  "installCommand": "npm install"
}
```

### package.json scripts

```json
{
  "scripts": {
    "start": "expo start",
    "web": "expo start --web",
    "build:web": "expo export -p web"
  }
}
```

### .vercelignore

```
node_modules/
.expo/
.git/
scripts/
docs/
*.test.ts
*.test.tsx
```

---

## 🎯 Alternative: Manual Configuration

Jika `vercel.json` tidak work, configure manual di dashboard:

1. **Project Settings → General**
2. **Build & Development Settings:**
   - Framework Preset: `Other`
   - Build Command: `npx expo export -p web`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Development Command: `npx expo start --web`

3. **Root Directory:**
   - `SnakeLadderGame`

4. **Node.js Version:**
   - 18.x (recommended)

---

## 🐛 Debug Mode

Enable debug logs untuk troubleshooting:

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy with debug
vercel --debug
```

### Option 2: Build Locally

```bash
cd SnakeLadderGame

# Install
npm install

# Build
npm run build:web

# Serve locally
npx serve dist
```

Buka http://localhost:3000 untuk test.

---

## 📞 Get Help

Jika masih error:

1. **Copy full error message** dari build logs
2. **Check Vercel status:** [status.vercel.com](https://status.vercel.com)
3. **Vercel Community:** [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
4. **Expo Forums:** [forums.expo.dev](https://forums.expo.dev)

---

## ✅ Success Checklist

Deployment berhasil jika:
- [ ] Build logs show "Build Completed"
- [ ] Deployment status: "Ready"
- [ ] URL accessible
- [ ] Website loads without errors
- [ ] Console shows no critical errors
- [ ] Environment variables working

---

## 🎉 After Successful Deployment

1. **Test website:**
   - Open URL
   - Test mode lokal
   - Test mode online
   - Test leaderboard

2. **Monitor:**
   - Check Vercel Analytics
   - Monitor error logs
   - Check performance

3. **Share:**
   - Share URL dengan teman
   - Collect feedback
   - Fix bugs

---

## 💡 Pro Tips

1. **Always test locally first:**
   ```bash
   npm run build:web
   ```

2. **Use preview deployments:**
   - Create branch
   - Push changes
   - Vercel auto-create preview
   - Test before merge to main

3. **Monitor build time:**
   - Optimize if > 5 minutes
   - Remove unused dependencies
   - Use .vercelignore

4. **Keep dependencies updated:**
   ```bash
   npm update
   ```

5. **Use Vercel CLI for faster debugging:**
   ```bash
   vercel dev  # Local development
   vercel --prod  # Deploy to production
   ```

---

## 🔄 Common Workflow

```bash
# 1. Make changes
git add .
git commit -m "update"

# 2. Test locally
npm run build:web

# 3. Push to GitHub
git push origin main

# 4. Vercel auto-deploy

# 5. Check deployment
# Open Vercel dashboard

# 6. If failed, check logs
# Fix errors, repeat
```

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Troubleshooting Guide](https://vercel.com/docs/concepts/deployments/troubleshoot-a-build)

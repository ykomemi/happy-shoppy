# 🛒 Shopping List App — Setup Guide

## What you've got
A React PWA (installable on phone home screen) with AI photo scanning, built with Vite.

---

## Step 1 — Prerequisites (one-time install)

- **Node.js** → https://nodejs.org (download the LTS version)
- **VS Code** → https://code.visualstudio.com
- **Git** → https://git-scm.com

---

## Step 2 — Open the project in VS Code

1. Unzip the `shopping-app` folder somewhere on your computer
2. Open VS Code → **File → Open Folder** → select `shopping-app`
3. Open the integrated terminal: **Terminal → New Terminal**

---

## Step 3 — Add your Anthropic API key

1. Open the file `.env.local` (already in the project)
2. Replace `sk-ant-your-key-here` with your real key from:
   👉 https://console.anthropic.com/keys
3. Save the file — **never commit this file to Git** (it's in .gitignore already)

---

## Step 4 — Install & run locally

In the VS Code terminal:

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser. The app is live! 🎉

---

## Step 5 — Deploy to Vercel (free, gets you a public URL)

### 5a — Push to GitHub
```bash
git init
git add .
git commit -m "first commit"
```
Go to https://github.com/new → create a repo → follow the instructions to push.

### 5b — Deploy on Vercel
1. Go to https://vercel.com → sign up with your GitHub account
2. Click **"Add New Project"** → import your GitHub repo
3. Vercel auto-detects Vite — just click **Deploy**
4. **Important — add the API key as an environment variable:**
   - In Vercel dashboard → your project → **Settings → Environment Variables**
   - Add: `VITE_ANTHROPIC_API_KEY` = your key
   - Click **Redeploy**

You'll get a URL like `https://shopping-app-xyz.vercel.app` — share it on WhatsApp! 🚀

---

## Step 6 — Install as PWA on your phone

Once the Vercel URL is live:

**iPhone:** Open URL in Safari → Share button → "Add to Home Screen"  
**Android:** Open URL in Chrome → ⋮ menu → "Add to Home Screen"

It installs like a native app — no App Store needed.

---

## Tweaking the app

All the app code is in **`src/App.jsx`** — one file, easy to edit:

| What to change | Where in App.jsx |
|---|---|
| Default items list | `DEFAULT_ITEMS` array at the top |
| Add new emoji mappings | `EMOJIS` object |
| Colors / styles | inline `style={{}}` props |
| AI prompt for scanning | Inside `handleImage()` function |
| App title | Search for "My Shopping List" |

After any change: just **save the file** — the browser hot-reloads instantly.
To deploy the update: `git add . && git commit -m "update" && git push` — Vercel auto-deploys.

---

## Project structure

```
shopping-app/
├── src/
│   ├── App.jsx        ← all the app code lives here
│   └── main.jsx       ← entry point (don't touch)
├── public/
│   ├── icon-192.png   ← PWA icon
│   └── icon-512.png   ← PWA icon (large)
├── .env.local         ← your API key (never commit!)
├── .gitignore
├── index.html
├── package.json
└── vite.config.js     ← PWA config lives here
```

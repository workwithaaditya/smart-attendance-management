# 🔐 Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a Project"** → **"New Project"**
3. **Project Name**: `Smart Attendance Management`
4. Click **"Create"**
5. Wait for project creation (~30 seconds)

---

## Step 2: Enable Google+ API

1. In your new project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it
4. Click **"Enable"**

---

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"**
3. Click **"Create"**

###Fill in the form:
- **App name**: `Smart Attendance Management`
- **User support email**: `your-email@gmail.com`
- **Developer contact**: `your-email@gmail.com`
- Leave other fields as default
4. Click **"Save and Continue"**
5. Skip **"Scopes"** → Click **"Save and Continue"**
6. Skip **"Test users"** → Click **"Save and Continue"**
7. Click **"Back to Dashboard"**

---

## Step 4: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth Client ID"**
3. **Application type**: Select **"Web application"**
4. **Name**: `Smart Attendance Web Client`

### Configure URLs:

**Authorized JavaScript origins:**
```
http://localhost:3000
https://your-vercel-url.vercel.app
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
https://your-vercel-url.vercel.app/api/auth/callback/google
```

5. Click **"Create"**

---

## Step 5: Copy Credentials

You'll see a popup with:
- **Client ID**: `123456789.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxx`
1023308028447-ucn59orr1peelqbv47v4rtf3u6pcraut.apps.googleusercontent.com
**Copy both!** You'll need them in `.env`

---

## Step 6: Update Local `.env` File

Create/update `.env` in project root:

```env
# Database (you already have this)
DATABASE_URL="postgresql://..."

# NextAuth Secret (generate new one)
NEXTAUTH_SECRET="run-this-command-in-terminal: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (paste your credentials)
GOOGLE_CLIENT_ID="paste-your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="paste-your-client-secret"
```1023308028447-ucn59orr1peelqbv47v4rtf3u6pcraut.apps.googleusercontent.com

### Generate NEXTAUTH_SECRET:

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Or use online generator:**
https://generate-secret.vercel.app/32

---

## Step 7: Run Database Migration

```bash
npx prisma migrate dev --name add_auth

npx prisma generate
```

---

## Step 8: Test Locally

```bash
npm run dev
```

Visit: `http://localhost:3000`

You should see the Google Sign In button!

---

## Step 9: Deploy to Vercel

### Add Environment Variables in Vercel:

1. Go to Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Add these:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `NEXTAUTH_SECRET` | The secret you generated |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `GOOGLE_CLIENT_ID` | Your Google Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google Client Secret |

4. Select **all environments** (Production, Preview, Development)
5. Click **"Save"**

---

## Step 10: Update Google OAuth URLs for Production

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Click on your **OAuth 2.0 Client ID**
4. Add your Vercel URL:

**Authorized JavaScript origins:**
```
https://your-actual-vercel-url.vercel.app
```

**Authorized redirect URIs:**
```
https://your-actual-vercel-url.vercel.app/api/auth/callback/google
```

5. Click **"Save"**

---

## Step 11: Redeploy Vercel

```bash
git add .
git commit -m "Add Google OAuth authentication"
git push origin main
```

Vercel will auto-deploy!

---

## 🎉 Done!

Your app now has:
- ✅ Google Sign In
- ✅ Multi-user support
- ✅ Isolated user data
- ✅ Professional authentication

---

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- Check that your redirect URI in Google Console **exactly matches**:
  - `http://localhost:3000/api/auth/callback/google` (local)
  - `https://your-url.vercel.app/api/auth/callback/google` (production)

### Error: "Invalid client"
- Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Make sure there are no extra spaces

### Error: "NEXTAUTH_SECRET not set"
- Generate a secret and add to `.env`
- Must be at least 32 characters

### Can't sign in locally
- Make sure dev server is running on port 3000
- Check `NEXTAUTH_URL="http://localhost:3000"`

---

**Need help?** Check the console for error messages!

---

**Built with Claude Sonnet**  
**Developed by @workwithaaditya**  
© 2025 All rights reserved

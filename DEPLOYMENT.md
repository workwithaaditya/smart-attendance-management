# 🚀 Deployment Guide

This guide will help you deploy the Smart Attendance Management System to the web so anyone can access it with a link.

## 📋 Prerequisites

- GitHub account
- Vercel account (free)
- Neon account (free serverless PostgreSQL)

---

## Step 1: Set Up Database (Neon)

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up with your GitHub account (free tier includes 3GB storage)
3. Click **"Create a Project"**

### 1.2 Configure Database
1. **Project Name**: `smart-attendance-db` (or any name you prefer)
2. **Database Name**: `attendance_db`
3. **Region**: Choose closest to your location (e.g., AWS US East)
4. Click **"Create Project"**

### 1.3 Get Database Connection String
1. After project creation, you'll see the **Connection Details**
2. Copy the **Connection String** (looks like):
   ```
   postgresql://username:password@ep-xxxx-xxxx.region.aws.neon.tech/attendance_db?sslmode=require
   ```
3. **Save this for later** - you'll need it for Vercel

### 1.4 Initialize Database Schema
1. Create a `.env` file in your project root (if not already exists)
2. Add your Neon connection string:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xxxx-xxxx.region.aws.neon.tech/attendance_db?sslmode=require"
   ```
3. Run database migration:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

---

## Step 2: Deploy to Vercel

### 2.1 Push Code to GitHub
Make sure your latest code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for deployment with PostgreSQL"
git push origin stable-b1
```

### 2.2 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub

### 2.3 Import Project
1. Click **"Add New Project"** or **"Import Project"**
2. Select your GitHub repository: `smart-attendance-management`
3. Vercel will auto-detect it's a Next.js project ✅

### 2.4 Configure Environment Variables
Before deploying, add your database URL:

1. In the **"Configure Project"** section, scroll to **"Environment Variables"**
2. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste your Neon connection string from Step 1.3
   - **Environment**: Select all (Production, Preview, Development)
3. Click **"Add"**

### 2.5 Deploy
1. Leave other settings as default
2. Click **"Deploy"**
3. Wait 2-3 minutes for build to complete ⏳

### 2.6 Run Database Migration on Production
After first deployment:
1. Go to your Vercel project dashboard
2. Navigate to **"Settings"** → **"Environment Variables"**
3. Confirm `DATABASE_URL` is set
4. Go to **"Deployments"** tab
5. Click on latest deployment → **"..."** menu → **"Redeploy"**
6. Check **"Use existing Build Cache"**
7. Click **"Redeploy"**

**OR** run migration directly from your terminal:
```bash
# Set the DATABASE_URL to your Neon connection string
npx prisma migrate deploy
```

---

## Step 3: Access Your App 🎉

Your app is now live! You'll get a URL like:
```
https://smart-attendance-management.vercel.app
```

### Share the Link
- Copy the URL from Vercel dashboard
- Share with anyone - they can access it directly!
- No signup required for users

---

## 🔧 Post-Deployment

### Custom Domain (Optional)
1. In Vercel dashboard → **"Settings"** → **"Domains"**
2. Add your custom domain (e.g., `attendance.yourdomain.com`)
3. Follow DNS configuration steps

### Monitoring
- View deployment logs in Vercel dashboard
- Check database usage in Neon console
- Monitor API performance in Vercel Analytics (free)

---

## 🐛 Troubleshooting

### Build Fails
**Error**: `Prisma Client not generated`
- Make sure `package.json` has postinstall script:
  ```json
  "scripts": {
    "postinstall": "prisma generate"
  }
  ```

### Database Connection Error
**Error**: `Can't reach database server`
- Check DATABASE_URL is correct in Vercel environment variables
- Ensure connection string has `?sslmode=require` at the end
- Verify Neon database is active (check Neon console)

### App Loads but No Data
- Run database migrations: `npx prisma migrate deploy`
- Check Vercel logs for errors: Dashboard → Deployments → Click deployment → View Function Logs

### SQLite Error on Deployment
**Error**: `SQLite not supported in serverless`
- Make sure `schema.prisma` has `provider = "postgresql"` (not `sqlite`)
- Redeploy after changing

---

## 📊 Usage Limits (Free Tier)

### Vercel Free Tier
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL/HTTPS
- ✅ Preview deployments for PRs

### Neon Free Tier
- ✅ 3GB storage
- ✅ 1 project
- ✅ Unlimited queries
- ✅ Auto-suspend after inactivity (auto-resumes on request)

Both are more than enough for personal/educational projects!

---

## 🔄 Updating Your App

After making changes locally:

```bash
# 1. Test locally
npm run dev

# 2. Commit changes
git add .
git commit -m "Your update message"

# 3. Push to GitHub
git push origin stable-b1

# 4. Vercel auto-deploys! ✨
```

Vercel automatically rebuilds and deploys when you push to GitHub.

---

## 🎯 Next Steps

1. ✅ Share your live URL with friends/classmates
2. ✅ Add custom domain (optional)
3. ✅ Monitor usage in Vercel/Neon dashboards
4. ✅ Set up branch preview deployments for testing

---

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Neon Docs**: [neon.tech/docs](https://neon.tech/docs)
- **Prisma Docs**: [prisma.io/docs](https://prisma.io/docs)

---

**Made with 🤖 Claude Sonnet**  
**Created by [@workwithaaditya017](https://github.com/workwithaaditya017)**

© 2025 All rights reserved

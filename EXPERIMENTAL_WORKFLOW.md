# 🔬 Experimental Development Workflow

## 📋 Branch Strategy

### **Production Branch: `main`**
- ✅ Stable, tested code
- ✅ Connected to Vercel for live deployment
- ✅ Never break this branch!
- 🌐 Live URL: `https://smart-attendance-management.vercel.app`

### **Experimental Branch: `experimental`**
- 🧪 For testing new features
- 🧪 Test locally before merging
- 🧪 Safe to break/experiment
- 💻 Local testing only

---

## 🚀 Quick Commands Reference

### **Switch to Experimental Branch (for testing)**
```bash
git checkout experimental
```

### **Switch to Main Branch (stable version)**
```bash
git checkout main
```

### **See Current Branch**
```bash
git branch
```
*(The branch with * is your current branch)*

---

## 🔬 Experimental Development Workflow

### **Step 1: Start Experimenting**

1. **Make sure you're on experimental branch:**
   ```bash
   git checkout experimental
   ```

2. **Start local dev server:**
   ```bash
   npm run dev
   ```
   → Test at: `http://localhost:3000`

3. **Make your changes:**
   - Edit files freely
   - Try new features
   - Break things if needed!

---

### **Step 2: Test Locally**

1. **Test thoroughly on localhost:**
   - Try all features
   - Check for bugs
   - Verify everything works

2. **If it works → Commit:**
   ```bash
   git add .
   git commit -m "Experiment: [describe what you changed]"
   git push origin experimental
   ```

3. **If it breaks → Reset:**
   ```bash
   # Undo all changes
   git reset --hard HEAD
   
   # Or undo specific file
   git checkout -- path/to/file.tsx
   ```

---

### **Step 3: Merge to Production (when ready)**

**Only do this when experimental changes are perfect!**

```bash
# 1. Switch to main branch
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Merge experimental into main
git merge experimental

# 4. Push to GitHub (Vercel auto-deploys)
git push origin main
```

**Vercel will automatically deploy the changes!** 🚀

---

## 🛡️ Safety Rules

### ✅ **DO:**
- Work on `experimental` branch for new features
- Test everything locally first
- Commit small changes frequently
- Write clear commit messages

### ❌ **DON'T:**
- Don't directly edit `main` branch
- Don't merge untested code to `main`
- Don't push broken code to `main`
- Don't skip local testing

---

## 📊 Current Setup

```
Your Project Structure:

┌─────────────────────────────────────────────────┐
│           GitHub Repository                      │
│                                                  │
│  ┌──────────────┐      ┌──────────────┐        │
│  │  main        │◄─────┤ experimental │        │
│  │  (stable)    │      │  (testing)   │        │
│  └──────────────┘      └──────────────┘        │
│         │                                        │
└─────────┼────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────┐
│            Vercel Deployment                     │
│                                                  │
│  Only watches: main branch                      │
│  Auto-deploys when main is pushed               │
│                                                  │
│  Live URL: https://...vercel.app                │
└─────────────────────────────────────────────────┘
          │
          ▼
    Real Users 👥


Your Local Machine:

┌─────────────────────────────────────────────────┐
│           Local Development                      │
│                                                  │
│  Current Branch: experimental                   │
│  Dev Server: http://localhost:3000              │
│  Database: Neon PostgreSQL (shared)             │
│                                                  │
│  Test here → If good → Merge to main           │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Example Workflow

### **Scenario: Adding a new feature**

```bash
# 1. Start on experimental
git checkout experimental

# 2. Start dev server
npm run dev

# 3. Make changes to files
# ... edit components, add features ...

# 4. Test at http://localhost:3000
# ✅ Everything works!

# 5. Commit the changes
git add .
git commit -m "Feature: Add export to PDF functionality"
git push origin experimental

# 6. Ready to go live? Merge to main
git checkout main
git merge experimental
git push origin main

# 7. Vercel auto-deploys! 🎉
# Check live site in 2-3 minutes
```

---

## 🆘 Common Scenarios

### **Scenario 1: I broke something on experimental**
```bash
# Option A: Undo last commit
git reset --hard HEAD~1

# Option B: Undo all changes
git reset --hard origin/experimental

# Option C: Start fresh from main
git checkout main
git branch -D experimental
git checkout -b experimental
```

---

### **Scenario 2: I want to copy a file from main to experimental**
```bash
# While on experimental branch:
git checkout main -- path/to/file.tsx
```

---

### **Scenario 3: I want to see what changed**
```bash
# See changes between branches
git diff main experimental

# See your uncommitted changes
git diff

# See last commit
git show
```

---

### **Scenario 4: I accidentally worked on main**
```bash
# Save your changes
git stash

# Switch to experimental
git checkout experimental

# Apply your changes
git stash pop
```

---

## 📦 Database Considerations

**Important:** Both branches use the **same database** (Neon PostgreSQL)

### **If you're testing database schema changes:**

1. **Create a backup first:**
   ```bash
   # Backup current schema
   npx prisma db push --preview-feature
   ```

2. **Test schema changes carefully:**
   - They affect both branches
   - Use migrations for production
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

3. **Or use a separate test database:**
   - Create another Neon project for testing
   - Use different `.env` for experimental branch

---

## 🎯 Best Practices

1. **Commit Often**
   ```bash
   # Small, frequent commits are better
   git commit -m "WIP: Testing new feature"
   ```

2. **Use Descriptive Messages**
   ```bash
   # Good ✅
   git commit -m "Feature: Add date range filter to attendance"
   
   # Bad ❌
   git commit -m "fix stuff"
   ```

3. **Test Before Merging**
   - ✅ Test all features
   - ✅ Check mobile responsiveness
   - ✅ Verify database operations
   - ✅ Check error handling

4. **Keep Experimental Up-to-Date**
   ```bash
   # Periodically sync with main
   git checkout experimental
   git merge main
   ```

---

## 🚀 You're All Set!

**Current Status:**
- ✅ Experimental branch created
- ✅ Pushed to GitHub
- ✅ Ready for testing

**You are now on:** `experimental` branch

**Next Steps:**
1. Start coding your experiments
2. Test on localhost
3. Merge to main when ready

---

**Quick Commands:**

| Task | Command |
|------|---------|
| Switch to experimental | `git checkout experimental` |
| Switch to main | `git checkout main` |
| See current branch | `git branch` |
| Start dev server | `npm run dev` |
| Commit changes | `git add . && git commit -m "message"` |
| Push to GitHub | `git push origin experimental` |
| Merge to main | `git checkout main && git merge experimental` |

---

**Pro Tip:** Keep this file open as a reference while experimenting! 📚

---

**Built with Claude Sonnet**  
**Developed by @workwithaaditya**  
© 2025 All rights reserved

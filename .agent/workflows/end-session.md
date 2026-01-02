---
description: How to end a work session and sync changes
---

# End of Session Workflow

Follow these steps at the end of every work session to ensure continuity:

## 1. Update PROJECT-CONTEXT.md

Update the following sections in `PROJECT-CONTEXT.md`:
- **Completed Features**: Mark new features as done
- **Recent Changes**: Add a dated entry describing what was changed
- **Any new integrations or architecture changes**

## 2. Sync to Oracle Server

// turbo
```bash
mutagen sync flush rivego
```

Verify sync status:
// turbo
```bash
mutagen sync list
```

## 3. Commit and Push to GitHub

// turbo
```bash
cd "/Users/tiagoribeiro/.gemini/antigravity/scratch/Rivego automation system"
git add -A
git commit -m "Session update: [brief description]"
git push origin main
```

## 4. Verify Server is Running (Optional)

Check if Oracle dev server is still active:
```bash
ssh oracle "pgrep -f 'next dev' && echo 'Server running' || echo 'Server stopped'"
```

If stopped, restart:
```bash
ssh oracle "cd ~/Rivego && screen -dmS rivego npm run dev -- --hostname 0.0.0.0"
```

---

**Trigger phrase**: When the user says "end session", "save progress", or "sync everything", run this workflow.

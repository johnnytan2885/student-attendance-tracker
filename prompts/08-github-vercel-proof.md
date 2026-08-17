# Prompt 08 — GitHub + Vercel Proof

Use this only after the app/site works locally.

## GitHub push guidance

1. Confirm Git works:
   `git --version`
2. Confirm Git identity:
   `git config --global user.name`
   `git config --global user.email`
3. If identity is missing, set it:
   `git config --global user.name "Your Name"`
   `git config --global user.email "your-email@example.com"`
4. Initialize/commit:
   `git init`
   `git add .`
   `git commit -m "build: complete kdbm lite project"`
5. Create an empty GitHub repo. Do not add README/license/gitignore in GitHub.
6. Add remote and push:
   `git branch -M main`
   `git remote add origin <repo-url>`
   `git push -u origin main`

## Vercel deploy guidance

1. Open Vercel.
2. Add New Project.
3. Import the GitHub repo.
4. For Vite projects:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Deploy.
6. Open the live URL and test the main flow again.

## Proof submission

Submit the strongest proof available:

- Strong: live Vercel URL + GitHub URL + short explanation.
- Good: GitHub URL + localhost screenshot/screen recording + short explanation.
- Minimum: localhost screenshot/screen recording + explanation of what worked and what blocked GitHub/Vercel.

If KD Showcase or event submission is active, submit the proof there using the trainer's current event instructions.

After proof is captured, update `build-status.md` with the proof used, the live/repository links when available, and `Current KDBM Lite stage: Shipped`.

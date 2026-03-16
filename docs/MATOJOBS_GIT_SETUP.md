# Using matojobs account only for this repo

This repo is configured to use a **separate GitHub account (matojobs)** for push/pull. Your other repos continue to use your default account (e.g. nikhilkunweb).

## One-time setup

1. **Create a Personal Access Token (PAT) for matojobs**
   - Log in to GitHub as **matojobs**.
   - Go to **Settings → Developer settings → Personal access tokens → Tokens (classic)**.
   - Generate a new token with at least the **repo** scope.
   - Copy the token (you won’t see it again).

2. **Store the credential for this repo only**
   - In this repo folder, create the file `.git-credentials-matojobs` (it is in `.gitignore`, so it won’t be committed).
   - Add exactly one line in this format (use your real token instead of `YOUR_PAT`):
     ```
     https://matojobs:YOUR_PAT@github.com
     ```
   - Save the file.

3. **Push**
   - From the repo root run: `git push origin main`  
   - Git will use the matojobs credential from `.git-credentials-matojobs` and will not use nikhilkunweb for this repo.

## How it works

- **Local** `credential.helper` is set to `store --file .git-credentials-matojobs`, so only this repo uses that file.
- `.git-credentials-matojobs` is in `.gitignore`, so your token is never committed.
- Other repositories keep using your default (global) GitHub account.

## If you need to change the token

Edit `.git-credentials-matojobs` and replace the token in the URL, or delete the file and run `git push` again; Git will prompt for username (matojobs) and password (new PAT), then store them in that file again.

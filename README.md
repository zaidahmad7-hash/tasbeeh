# Tasbeeh — Duas & Dhikr

A small iPhone app (web app) with two screens:

- **Duas** — one dua per page. Tap the right side for the next, the left side for the previous (or swipe). The ☰ button lists them all.
- **Tasbeeh** — swipe the card to pick a dhikr, tap anywhere below to count. Beads slide, the ring fills, and it glows when you hit the target. Counts are saved on the phone.

## Put it on your iPhone (one-time)
1. On github.com create a new **public** repository, e.g. `tasbeeh`.
2. **Add file → Upload files** → drag in everything from this folder (keep the `icons` folder) → **Commit**.
3. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → **Save**.
4. After a minute your link is `https://<your-username>.github.io/tasbeeh/`.
5. Open it in **Safari** on the iPhone → **Share** → **Add to Home Screen**. It opens full screen and works offline.

## Adding duas later
Open `duas.js` on GitHub → pencil icon → copy one `{ … },` block, paste at the end, edit the text → **Commit**.
New dhikr go in `dhikr.js` the same way. On the phone, open the app twice to pick up the update.

Live at https://zaidahmad7-hash.github.io/tasbeeh/

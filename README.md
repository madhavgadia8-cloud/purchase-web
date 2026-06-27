# Purchase Manager — online version (Next.js + Supabase + Vercel)

A hosted web app for your purchase workflow:

1. You create a requirement (RFQ) with line items.
2. You share a link with vendors. Each vendor opens it, enters their rates, submits.
3. All quotes land in one place. The app awards each item to the cheapest vendor and shows your best‑case total and saving.

Vendors never sign in and never see each other's prices. Only you (the admin) sign in, with a password you choose.

---

## What you need (all free)

- A **GitHub** account — github.com
- A **Vercel** account — vercel.com (sign in with GitHub)
- A **Supabase** account — supabase.com (the database)

---

## Step 1 — Create the database (Supabase)

1. Go to supabase.com → **New project**. Pick a name and a strong database password. Wait ~2 min for it to finish.
2. Open **SQL Editor → New query**, paste everything from `supabase-schema.sql`, click **Run**. This creates the tables.
3. Open **Project Settings → API** and copy two values:
   - **Project URL** → this is `SUPABASE_URL`
   - **service_role** secret key (under "Project API keys") → this is `SUPABASE_SERVICE_ROLE_KEY`
     *(Keep the service_role key private — it's only ever used on the server.)*

## Step 2 — Put the code on GitHub

Option A (no command line): on github.com create a **New repository**, then use **Add file → Upload files** and drag in everything from this `Web App (Vercel)` folder (do **not** upload `node_modules` if present). Commit.

Option B (command line), from inside this folder:
```
git init
git add .
git commit -m "Purchase Manager"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/purchase-web.git
git push -u origin main
```

## Step 3 — Deploy on Vercel

1. vercel.com → **Add New → Project** → import the GitHub repo you just created.
2. Before clicking Deploy, open **Environment Variables** and add three:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key
   - `ADMIN_PASSWORD` = any password you want for the admin login
3. Click **Deploy**. After ~1 minute you get a live URL like `https://purchase-web-xxxx.vercel.app`.

## Step 4 — Use it

- Open your Vercel URL, sign in with `ADMIN_PASSWORD`.
- Create a requirement, then on its page click **Copy link** and send that link to your vendors.
- As vendors submit, refresh the requirement page to see the comparison and the award (cheapest per item) update automatically.

---

## Run it on your own computer first (optional)

Needs Node.js (nodejs.org). In this folder:
```
npm install
copy .env.example .env.local   (Windows)   /   cp .env.example .env.local (Mac/Linux)
# edit .env.local with your Supabase values + an ADMIN_PASSWORD
npm run dev
```
Open http://localhost:3000

---

## How "best / economical" is decided
Each item is awarded to the vendor with the **lowest rate** (split award allowed); those winning rates are summed into the best‑case total. Each vendor's full‑basket total is also shown so you can compare against giving everything to one supplier.

## Notes
- Anyone with a requirement's quote link can submit a quote for it. The link contains a hard‑to‑guess ID. If you need stricter control (per‑vendor tokens, closing dates, edit‑after‑submit), that can be added.
- Free tiers are generous but have limits; for heavy use you may need a paid plan on Supabase/Vercel.

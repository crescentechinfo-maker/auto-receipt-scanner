# 🧾 ReceiptScan — AI Receipt Auto-Sorter

Upload a receipt photo → AI reads it → automatically sorted into your Google Drive.

## How it works

```
User uploads image
  → Google Vision API extracts text (OCR)
  → OpenAI GPT-4o-mini classifies category
  → File uploaded to Google Drive /Receipts/<Category>/<YYYY-MM>/
  → Shareable link returned instantly
```

## Categories

| Category | Drive Folder |
|---|---|
| Food & Beverage | `/Receipts/Food/` |
| Transport | `/Receipts/Transport/` |
| Shopping | `/Receipts/Shopping/` |
| Bills & Utilities | `/Receipts/Bills/` |
| Travel | `/Receipts/Travel/` |
| Office / Work | `/Receipts/Office/` |
| Others | `/Receipts/Others/` |

Files are further grouped by month: `/Receipts/Food/2026-05/McDonalds_20May2026.jpg`

---

## Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd auto-receipt-scanner
npm install
```

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable these APIs:
   - **Cloud Vision API**
   - **Google Drive API**
4. Go to **IAM & Admin → Service Accounts → Create Service Account**
5. Grant it the **Editor** role
6. Under **Keys → Add Key → JSON** — download the key file
7. Share your Google Drive "Receipts" folder with the service account email (`xxx@project.iam.gserviceaccount.com`) as **Editor**

### 3. OpenAI Setup

1. Get an API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. The app uses `gpt-4o-mini` — very cheap (~$0.001 per receipt)

### 4. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
OPENAI_API_KEY=sk-...

# Paste the entire service account JSON as one line:
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

**Tip for the JSON:** Open the downloaded `.json` file, copy all content, and use this to convert it to a single line:
```bash
# On Mac/Linux:
cat service-account.json | tr -d '\n'
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option B: GitHub + Vercel Dashboard

1. Push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variables in **Project Settings → Environment Variables**:
   - `OPENAI_API_KEY`
   - `GOOGLE_SERVICE_ACCOUNT_JSON`
5. Deploy!

> **Note:** The `data/receipts.json` local history file does not persist on Vercel's serverless functions. For production, replace `lib/storage.ts` with [Vercel KV](https://vercel.com/docs/storage/vercel-kv), [Supabase](https://supabase.com/), or any database.

---

## Project Structure

```
├── app/
│   ├── page.tsx                    # Home — upload screen
│   ├── history/page.tsx            # History — all receipts
│   ├── api/
│   │   ├── upload-receipt/route.ts # POST: OCR → classify → Drive upload
│   │   └── history/route.ts        # GET: list all receipts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── UploadZone.tsx              # Drag & drop + camera capture
│   ├── StatusTracker.tsx           # Processing step indicator
│   ├── CategoryBadge.tsx           # Colored category label
│   └── ResultCard.tsx              # Success result card
├── lib/
│   ├── types.ts                    # Shared TypeScript types
│   ├── ocr.ts                      # Google Vision OCR
│   ├── classifier.ts               # OpenAI + rule-based classifier
│   ├── drive.ts                    # Google Drive upload
│   └── storage.ts                  # Local JSON history store
├── data/
│   └── receipts.json               # Local receipt history (gitignored)
├── .env.local.example
├── vercel.json
└── next.config.ts
```

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Next.js API Routes (Node.js runtime)
- **OCR:** Google Cloud Vision API
- **AI Classification:** OpenAI GPT-4o-mini (falls back to rule-based if no key)
- **Storage:** Google Drive API
- **Deployment:** Vercel


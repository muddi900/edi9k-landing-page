# ClipConvo Landing Page

Marketing landing page for ClipConvo AI video editor with beta signup integration.

## Tech Stack

- **Astro** - Static site generation
- **TailwindCSS** - Styling
- **Google Sheets API** - Beta signup storage

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Sheets

1. Create a Google Sheet with a tab named "Beta Signups"
2. Add headers: `Email` (A1) and `Timestamp` (B1)
3. Create a Google Cloud Project
4. Enable Google Sheets API
5. Create a Service Account and download the JSON key
6. Share your Google Sheet with the service account email

### 3. Environment Variables

Create a `.env` file:

```env
GOOGLE_SERVICE_KEY={"type":"service_account",...}
SHEET_ID=your-sheet-id-here
```

Get the `SHEET_ID` from your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:4321`

## Build for Production

```bash
npm run build
```

## Deploy to Netlify

1. Push code to GitHub
2. Connect repo to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy

### Build Settings

- **Build command**: `npm run build`
- **Publish directory**: `dist/`

## Project Structure

```
src/
├── layouts/
│   └── Layout.astro          # Base layout
├── components/
│   ├── Hero.astro            # Hero section
│   ├── Features.astro        # Features grid
│   ├── HowItWorks.astro      # Steps section
│   ├── Pricing.astro         # Pricing cards
│   └── BetaSignup.astro      # Signup form
├── pages/
│   ├── index.astro           # Main page
│   └── api/
│       └── beta-signup.ts    # API endpoint
└── styles/
    └── global.css            # Global styles
```

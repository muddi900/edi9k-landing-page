# edi9k Landing Page

## Overview
Marketing landing page for edi9k AI video editor with beta signup.

## Tech Stack
- **Astro** - Static site generation
- **TailwindCSS** - Styling
- **TypeScript** - Type safety
- **Netlify** - Deployment & hosting

## Page Structure

### 1. Hero Section
- Headline: "AI-Powered Video Editing in Your Pocket"
- Subheadline: "Just describe your edits, we'll make them happen"
- CTA: "Join Beta" button
- Hero video/GIF showing app in action

### 2. Features Section
**AI-Driven Editing**
- "Trim first 10 seconds" → Done
- Natural language commands
- No timeline scrubbing needed

**Non-Destructive Workflow**
- Unlimited undo/redo
- Original files never touched
- Edit history preserved

**Professional Transitions**
- Fade, wipe, slide effects
- AI suggests best transitions
- Preview in real-time

**Cross-Platform**
- iOS, Android, macOS
- Same projects everywhere
- Cloud sync (future)

**Fast & Local**
- All processing on device
- No uploads required
- Privacy-first

### 3. How It Works
1. **Import** - Add your video/audio files
2. **Prompt** - "Add fade transition between clips"
3. **Preview** - See results instantly
4. **Export** - Render final video

### 4. Pricing (Teaser)
- Free tier with watermark
- Pro: $10-15/month unlimited
- Beta users get early access discount

### 5. Beta Signup
- Email input form
- "Join Beta Waitlist" CTA
- POSTs to backend `/beta-signup` endpoint
- Success: "Thanks! We'll email you when ready"

## Components Structure

```
edi9k-landing-page/
├── src/
│   ├── layouts/
│   │   └── Layout.astro          # Base layout
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── Features.astro
│   │   ├── HowItWorks.astro
│   │   ├── Pricing.astro
│   │   └── BetaSignup.astro
│   ├── pages/
│   │   └── index.astro           # Main page
│   └── styles/
│       └── global.css
├── public/
│   └── assets/                   # Images, videos
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## Beta Signup Integration

**Google Sheets Approach**:
- Service account key for Google Sheets API
- Beta signups stored directly in Google Sheet
- Simpler MVP, no backend needed initially

**Frontend** (BetaSignup.astro):
```typescript
async function handleSubmit(e) {
  e.preventDefault();
  const email = form.email.value;

  // Call API route that uses Google Sheets service account
  const res = await fetch('/api/beta-signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, timestamp: new Date().toISOString() })
  });

  // Show success message
}
```

**API Route** (src/pages/api/beta-signup.ts):
```typescript
import { google } from 'googleapis';

export async function POST({ request }) {
  const { email, timestamp } = await request.json();

  // Load service account credentials
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Append to sheet
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Beta Signups!A:B',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[email, timestamp]],
    },
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**Environment Variables** (.env):
```
GOOGLE_SERVICE_KEY={"type":"service_account",...}
SHEET_ID=your-sheet-id-here
```

## Design Direction
- **Modern & Clean**: Minimalist design, lots of whitespace
- **Dark Mode**: Dark theme to match video editing aesthetic
- **Animated**: Subtle animations with Astro's View Transitions
- **Mobile-First**: Responsive for all screen sizes

## Content Tone
- Friendly, approachable
- Focus on "AI makes editing effortless"
- Target: Content creators, not professional editors
- Emphasize speed and simplicity

## Deployment (Netlify)
- **Hosting**: Netlify
- **Build command**: `npm run build`
- **Publish directory**: `dist/`
- **Domain**: edi9k.com or edi9k.netlify.app
- **SSL**: Automatic via Netlify
- **Forms**: Can use Netlify Forms as alternative to custom backend

## Implementation Steps
1. Init Astro project: `npm create astro@latest`
2. Install TailwindCSS: `npx astro add tailwind`
3. Create layout and component structure
4. Build hero section with CTA
5. Features grid with animations
6. How it works section
7. Beta signup form + backend integration
8. Polish responsive design
9. Deploy to Netlify (connect git repo)

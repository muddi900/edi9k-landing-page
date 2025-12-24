import type { APIRoute } from 'astro';
import { google } from 'googleapis';

export const prerender = false;

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 4
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const is429 = error?.status === 429 || error?.code === 429;
      if (!is429 || attempt === maxRetries) throw error;

      // Exponential backoff: 1s, 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry failed');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, timestamp } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for environment variables
    const serviceKey = import.meta.env.GOOGLE_SERVICE_KEY;
    const sheetId = import.meta.env.SHEET_ID;

    if (!serviceKey || !sheetId) {
      console.error('Missing environment variables: GOOGLE_SERVICE_KEY or SHEET_ID');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse service account credentials
    const credentials = JSON.parse(serviceKey);

    // Authenticate with Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Append to sheet with retry logic
    await retryWithBackoff(() =>
      sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Beta Signups!A:B',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[email, timestamp]],
        },
      })
    );

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Beta signup error:', error);

    const status = error?.status || error?.code || 500;
    let message = 'Failed to save signup';

    if (status === 429) {
      message = 'High traffic right now. Please try again in a moment.';
    } else if (status === 503 || status === 500) {
      message = 'Service temporarily unavailable. Please try again.';
    }

    return new Response(
      JSON.stringify({ error: message }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

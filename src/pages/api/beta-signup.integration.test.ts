import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './beta-signup';

describe('Beta Signup Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should handle malformed JSON in service key', async () => {
    vi.stubEnv('GOOGLE_SERVICE_KEY', 'invalid-json');
    vi.stubEnv('SHEET_ID', 'test-sheet-123');

    const request = {
      json: async () => ({
        email: 'user@example.com',
        timestamp: new Date().toISOString(),
      }),
    };

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.error).toBeDefined();
  });

  it('should reject emails without @ symbol', async () => {
    const invalidEmails = [
      'invalid',
      'no-at-sign.com',
      'test.example.org',
      '',
    ];

    for (const email of invalidEmails) {
      const request = {
        json: async () => ({
          email,
          timestamp: new Date().toISOString(),
        }),
      };

      const response = await POST({ request } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid email address');
    }
  });

  it('should handle missing environment variables gracefully', async () => {
    const request = {
      json: async () => ({
        email: 'valid@example.com',
        timestamp: new Date().toISOString(),
      }),
    };

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error');
  });
});

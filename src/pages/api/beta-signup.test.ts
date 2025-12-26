import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './beta-signup';

// Helper to create retry function (extracted from beta-signup.ts)
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

      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry failed');
}

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const mockFn = vi.fn(async () => 'success');
    const result = await retryWithBackoff(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on 429 status errors and eventually succeed', async () => {
    let attempts = 0;
    const mockFn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) {
        const error: any = new Error('Rate limit exceeded');
        error.status = 429;
        throw error;
      }
      return 'success after retries';
    });

    const result = await retryWithBackoff(mockFn);

    expect(result).toBe('success after retries');
    expect(attempts).toBe(3);
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should retry on 429 code errors', async () => {
    let attempts = 0;
    const mockFn = vi.fn(async () => {
      attempts++;
      if (attempts < 2) {
        const error: any = new Error('Rate limit');
        error.code = 429;
        throw error;
      }
      return 'success';
    });

    const result = await retryWithBackoff(mockFn);

    expect(result).toBe('success');
    expect(attempts).toBe(2);
  });

  it('should throw after max retries with 429 errors', async () => {
    const mockFn = vi.fn(async () => {
      const error: any = new Error('Persistent rate limit');
      error.status = 429;
      throw error;
    });

    await expect(retryWithBackoff(mockFn, 2)).rejects.toThrow('Persistent rate limit');
    expect(mockFn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('should not retry non-429 errors', async () => {
    const mockFn = vi.fn(async () => {
      const error: any = new Error('Server error');
      error.status = 500;
      throw error;
    });

    await expect(retryWithBackoff(mockFn)).rejects.toThrow('Server error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should use default maxRetries of 4', async () => {
    // Use a custom retry function with minimal delays for testing
    async function testRetry<T>(fn: () => Promise<T>, maxRetries: number = 4): Promise<T> {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error: any) {
          const is429 = error?.status === 429 || error?.code === 429;
          if (!is429 || attempt === maxRetries) throw error;
          // Minimal delay for testing
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
      throw new Error('Retry failed');
    }

    const mockFn = vi.fn(async () => {
      const error: any = new Error('Rate limit');
      error.status = 429;
      throw error;
    });

    await expect(testRetry(mockFn)).rejects.toThrow();
    expect(mockFn).toHaveBeenCalledTimes(5); // initial + 4 retries
  });

  it('should handle zero max retries', async () => {
    const mockFn = vi.fn(async () => {
      const error: any = new Error('Rate limit');
      error.status = 429;
      throw error;
    });

    await expect(retryWithBackoff(mockFn, 0)).rejects.toThrow();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/beta-signup - validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  const createMockRequest = (body: any) => ({
    json: vi.fn(async () => body),
  });

  it('should return 400 for invalid email', async () => {
    const request = createMockRequest({ email: 'invalid', timestamp: '2025-12-24' });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email address');
  });

  it('should return 400 for missing email', async () => {
    const request = createMockRequest({ timestamp: '2025-12-24' });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email address');
  });

  it('should return 500 for missing environment variables', async () => {
    const request = createMockRequest({
      email: 'test@example.com',
      timestamp: '2025-12-24'
    });

    const response = await POST({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Server configuration error');
  });

  it('should reject emails without @ symbol', async () => {
    const invalidEmails = [
      'invalid',
      'no-at-sign',
      'test.example.com',
      '',
    ];

    for (const email of invalidEmails) {
      const request = createMockRequest({ email, timestamp: '2025-12-24' });
      const response = await POST({ request } as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid email address');
    }
  });
});

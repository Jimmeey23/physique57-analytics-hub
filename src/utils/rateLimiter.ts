/**
 * Rate limiter for Google Sheets API calls
 * Implements a token bucket algorithm with queue management
 */

interface QueuedRequest {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class RateLimiter {
  private queue: QueuedRequest[] = [];
  private tokens: number;
  private lastRefill: number;
  private processing: boolean = false;

  constructor(
    private maxTokens: number = 50, // Max 50 requests per minute (safety margin from 60)
    private refillRate: number = 50, // Refill 50 tokens
    private refillInterval: number = 60000 // Every 60 seconds
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    
    if (timePassed >= this.refillInterval) {
      const intervalsPasssed = Math.floor(timePassed / this.refillInterval);
      this.tokens = Math.min(this.maxTokens, this.tokens + (this.refillRate * intervalsPasssed));
      this.lastRefill = now;
    }
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      this.refillTokens();

      if (this.tokens <= 0) {
        // Wait for next refill
        const waitTime = this.refillInterval - (Date.now() - this.lastRefill);
        await new Promise(resolve => setTimeout(resolve, Math.max(100, waitTime)));
        continue;
      }

      const request = this.queue.shift();
      if (!request) break;

      this.tokens--;

      try {
        const result = await request.fn();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Small delay between requests to avoid bursting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  getStatus() {
    this.refillTokens();
    return {
      availableTokens: this.tokens,
      queueLength: this.queue.length,
      nextRefill: this.lastRefill + this.refillInterval
    };
  }
}

// Singleton instance
export const googleSheetsRateLimiter = new RateLimiter();

/**
 * Wrapper function to rate limit Google Sheets API calls
 */
export async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  return googleSheetsRateLimiter.execute(() => fetch(url, options));
}

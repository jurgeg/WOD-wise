/**
 * Retry logic with exponential backoff and request timeout support.
 */

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class RetryableError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = true
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, opts: RetryOptions): number {
  const delay = opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.3 * delay;
  return Math.min(delay + jitter, opts.maxDelayMs);
}

/** Retry an async function with exponential backoff. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable =
        error instanceof RetryableError ? error.isRetryable : true;
      const statusCode =
        error instanceof RetryableError ? error.statusCode : undefined;
      const shouldRetry =
        attempt < opts.maxRetries &&
        isRetryable &&
        (!statusCode || opts.retryableStatuses.includes(statusCode));

      if (!shouldRetry) break;

      opts.onRetry?.(attempt + 1, lastError);
      await sleep(calculateDelay(attempt, opts));
    }
  }

  throw lastError;
}

/** Fetch with timeout via AbortController. */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Fetch with retry + timeout combined. */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: {
    retryOptions?: Partial<RetryOptions>;
    timeoutMs?: number;
  }
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? 30000;

  return withRetry(async () => {
    const response = await fetchWithTimeout(url, init, timeoutMs);

    if (!response.ok) {
      const isRetryable = [408, 429, 500, 502, 503, 504].includes(response.status);
      throw new RetryableError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        isRetryable
      );
    }

    return response;
  }, options?.retryOptions);
}

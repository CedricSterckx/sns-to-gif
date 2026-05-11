export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, public readonly retryAfter?: number) {
    super('RATE_LIMITED', message, 429);
    this.name = 'RateLimitError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super('NO_MEDIA', message, 404);
    this.name = 'NotFoundError';
  }
}

export class InvalidUrlError extends AppError {
  constructor(message: string) {
    super('INVALID_URL', message, 400);
    this.name = 'InvalidUrlError';
  }
}

export class UpstreamError extends AppError {
  constructor(message: string) {
    super('UPSTREAM_ERROR', message, 502);
    this.name = 'UpstreamError';
  }
}

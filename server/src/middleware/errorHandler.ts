import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: err.errors[0]?.message ?? 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors,
    });
    return;
  }

  if (typeof err === 'object' && err && 'status' in err) {
    const status = Number((err as { status?: number }).status) || 500;
    const message =
      err instanceof Error ? err.message : 'Request failed';
    const code =
      'code' in err && typeof (err as { code?: unknown }).code === 'string'
        ? (err as { code: string }).code
        : undefined;
    res.status(status).json({ message, code });
    return;
  }

  if (err instanceof Error && err.message.includes('Only PDF')) {
    res.status(400).json({ message: err.message, code: 'INVALID_FILE_TYPE' });
    return;
  }

  console.error(err);
  res.status(500).json({
    message: err instanceof Error ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}

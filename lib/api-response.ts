import { NextResponse } from 'next/server';

type ApiErrorExtra = Record<string, unknown>;

export function apiError(
  status: number,
  code: string,
  message: string,
  extra?: ApiErrorExtra
) {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(extra || {}),
    },
    { status }
  );
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === 'string' ? error : 'Unknown error');
}

export function logApiError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
) {
  const normalized = toError(error);

  console.error('[api-error]', {
    context,
    message: normalized.message,
    name: normalized.name,
    ...(metadata || {}),
  });
}

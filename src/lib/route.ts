import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError } from './errors';
import { logger } from './logger';

export interface RouteHandlerOptions<TInput, TOutput> {
  inputSchema?: z.ZodType<TInput>;
  run: (input: TInput, req: Request) => Promise<TOutput>;
}

export function handler<TInput = unknown, TOutput = unknown>(
  options: RouteHandlerOptions<TInput, TOutput>
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      let parsedInput = undefined as TInput;

      if (options.inputSchema) {
        let body: unknown = {};
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          const text = await req.text();
          if (text) {
            try {
              body = JSON.parse(text);
            } catch {
              throw new AppError('VALIDATION', 'Invalid JSON payload');
            }
          }
        } else {
          const url = new URL(req.url);
          body = Object.fromEntries(url.searchParams.entries());
        }

        const parseResult = options.inputSchema.safeParse(body);
        if (!parseResult.success) {
          throw new AppError('VALIDATION', 'Validation failed', parseResult.error.format());
        }
        parsedInput = parseResult.data;
      }

      const result = await options.run(parsedInput, req);
      return NextResponse.json(result);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        const status =
          err.code === 'NOT_FOUND'
            ? 404
            : err.code === 'CONFLICT_STATE' || err.code === 'DAY_CLOSE_BLOCKED'
            ? 409
            : err.code === 'FORBIDDEN_DEMO'
            ? 403
            : err.code === 'VALIDATION'
            ? 400
            : 500;

        return NextResponse.json(err.toJSON(), { status });
      }

      logger.error('Unhandled route error', { error: String(err) });
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected internal error occurred',
          },
        },
        { status: 500 }
      );
    }
  };
}

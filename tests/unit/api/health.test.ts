import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';
import { handler } from '@/lib/route';
import { AppError } from '@/lib/errors';
import { z } from 'zod';

describe('/api/health route and route handler', () => {
  it('GET /api/health returns ok status with config', async () => {
    const req = new Request('http://localhost:3000/api/health');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.db).toBe('ok');
    expect(body.paypalMode).toBeDefined();
    expect(body.llmProvider).toBeDefined();
  });

  it('handles validation error and returns 400', async () => {
    const testHandler = handler({
      inputSchema: z.object({ amount: z.number() }),
      run: async (input) => ({ received: input.amount }),
    });

    const req = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      body: JSON.stringify({ amount: 'not-a-number' }),
    });

    const res = await testHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('VALIDATION');
  });

  it('handles NOT_FOUND AppError and returns 404', async () => {
    const testHandler = handler({
      run: async () => {
        throw new AppError('NOT_FOUND', 'Item not found');
      },
    });

    const req = new Request('http://localhost:3000/api/test');
    const res = await testHandler(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('NOT_FOUND');
  });
});


import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { sql } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

if (!sql && process.env.NODE_ENV !== 'production') {
  console.warn('Neon database not configured - delete API will return mock responses');
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function hashDeleteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

async function fetchStoredTokenHash(id: string): Promise<string | null> {
  if (!sql) return null;

  const rows = await sql`SELECT delete_token_hash FROM score_cards WHERE public_id = ${id} LIMIT 1`;

  if (!rows || rows.length === 0) return null;

  return (rows[0] as { delete_token_hash: string } | undefined)?.delete_token_hash ?? null;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(`delete:${ip}`, { limit: 10, windowMs: 60_000 });

  if (!rate.ok) {
    const retryAfter = Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  try {
    const { id } = params;
    const token = request.headers.get('x-delete-token');

    if (!token) {
      return NextResponse.json({ error: 'Delete token required' }, { status: 401 });
    }

    if (!sql) {
      if (process.env.NODE_ENV === 'production') {
        console.error('DATABASE_URL not configured in production');
        return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    const storedHash = await fetchStoredTokenHash(id);
    if (!storedHash) {
      return NextResponse.json({ error: 'Score card not found' }, { status: 404 });
    }

    const tokenHash = hashDeleteToken(token);
    const matches = safeEqual(tokenHash, storedHash);

    if (!matches) {
      return NextResponse.json({ error: 'Invalid delete token' }, { status: 403 });
    }

    await sql`DELETE FROM score_cards WHERE public_id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

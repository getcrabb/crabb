import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rate-limit';

if (!supabaseAdmin) {
  console.warn('Supabase admin not configured - delete API will return mock responses or errors');
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

function isMissingColumn(error: { message?: string; details?: string }, column: string): boolean {
  const message = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  return message.includes(`column`) && message.includes(column.toLowerCase()) && message.includes('does not exist');
}

async function fetchStoredToken(id: string): Promise<{ hash?: string; legacy?: string } | null> {
  if (!supabaseAdmin) return null;

  const hashResult = await supabaseAdmin
    .from('score_cards')
    .select('delete_token_hash')
    .eq('public_id', id)
    .single();

  if (hashResult.error) {
    if (isMissingColumn(hashResult.error, 'delete_token_hash')) {
      const legacyResult = await supabaseAdmin
        .from('score_cards')
        .select('delete_token')
        .eq('public_id', id)
        .single();

      if (legacyResult.error || !legacyResult.data) {
        return null;
      }

      return { legacy: legacyResult.data.delete_token as string };
    }

    return null;
  }

  if (!hashResult.data) return null;

  const hashValue = hashResult.data.delete_token_hash as string | null;
  if (hashValue) {
    return { hash: hashValue };
  }

  // Fallback to legacy token if hash is null
  const legacyResult = await supabaseAdmin
    .from('score_cards')
    .select('delete_token')
    .eq('public_id', id)
    .single();

  if (legacyResult.error || !legacyResult.data) {
    return null;
  }

  return { legacy: legacyResult.data.delete_token as string };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`delete:${ip}`, { limit: 10, windowMs: 60_000 });

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

    if (!supabaseAdmin) {
      if (!supabase) {
        return NextResponse.json({ success: true });
      }

      console.error('Supabase admin not configured; cannot delete score card');
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });
    }

    const stored = await fetchStoredToken(id);
    if (!stored) {
      return NextResponse.json({ error: 'Score card not found' }, { status: 404 });
    }

    const tokenHash = hashDeleteToken(token);
    const matches =
      (stored.hash && safeEqual(tokenHash, stored.hash)) ||
      (stored.legacy && safeEqual(token, stored.legacy));

    if (!matches) {
      return NextResponse.json({ error: 'Invalid delete token' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('score_cards')
      .delete()
      .eq('public_id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete score card' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

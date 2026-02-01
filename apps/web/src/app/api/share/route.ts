import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generatePublicId, generateDeleteToken } from '@/lib/utils';

if (!supabase) {
  console.warn('Supabase not configured - share API will return mock responses');
}

interface SharePayload {
  score: number;
  grade: string;
  scannerSummary: {
    scanner: string;
    findingsCount: number;
    penalty: number;
  }[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  timestamp: string;
  // v0.8 fields
  cliVersion?: string;
  auditMode?: 'auto' | 'openclaw' | 'crabb' | 'off';
  openclawVersion?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const payload: SharePayload = await request.json();

    // Validate payload
    if (
      typeof payload.score !== 'number' ||
      payload.score < 0 ||
      payload.score > 100
    ) {
      return NextResponse.json(
        { error: 'Invalid score' },
        { status: 400 }
      );
    }

    if (!['A', 'B', 'C', 'D', 'F'].includes(payload.grade)) {
      return NextResponse.json(
        { error: 'Invalid grade' },
        { status: 400 }
      );
    }

    const publicId = generatePublicId();
    const deleteToken = generateDeleteToken();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://crabb.ai';

    // Return mock response if Supabase not configured
    if (!supabase) {
      return NextResponse.json({
        id: publicId,
        url: `${baseUrl}/score/${publicId}`,
        deleteToken,
      });
    }

    // Extract scanner counts
    const getScannerCount = (name: string) =>
      payload.scannerSummary?.find(s => s.scanner === name)?.findingsCount ?? 0;

    const { data, error } = await supabase
      .from('score_cards')
      .insert({
        public_id: publicId,
        delete_token: deleteToken,
        score: payload.score,
        grade: payload.grade,
        credentials_count: getScannerCount('credentials'),
        skills_count: getScannerCount('skills'),
        permissions_count: getScannerCount('permissions'),
        network_count: getScannerCount('network'),
        critical_count: payload.criticalCount ?? 0,
        high_count: payload.highCount ?? 0,
        medium_count: payload.mediumCount ?? 0,
        low_count: payload.lowCount ?? 0,
        cli_version: payload.cliVersion ?? null,
        audit_mode: payload.auditMode ?? null,
        openclaw_version: payload.openclawVersion ?? null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create score card' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: publicId,
      url: `${baseUrl}/score/${publicId}`,
      deleteToken,
    });
  } catch (err) {
    console.error('Share error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

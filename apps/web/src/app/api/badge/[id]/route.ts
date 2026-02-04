import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface BadgeParams {
  params: { id: string };
}

/**
 * Grade color mapping for SVG badges
 */
const GRADE_COLORS: Record<string, string> = {
  'A': '#10B981', // Emerald
  'B': '#3B82F6', // Blue
  'C': '#F59E0B', // Amber
  'D': '#F97316', // Orange
  'F': '#EF4444', // Red
};

/**
 * Generates an SVG badge for the score card
 */
function generateBadge(score: number, grade: string, verified: boolean): string {
  const gradeColor = GRADE_COLORS[grade] || '#64748B';
  const width = verified ? 180 : 140;
  const scoreText = `${score}/100`;
  const gradeText = `Grade ${grade}`;
  const verifiedText = verified ? ' ✓' : '';

  // shields.io style badge
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="Crabb Score: ${score}">
  <title>Crabb Score: ${score} (${gradeText})${verified ? ' - Verified' : ''}</title>
  <linearGradient id="gradient" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="rounded">
    <rect width="${width}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#rounded)">
    <rect width="70" height="20" fill="#555"/>
    <rect x="70" width="${width - 70}" height="20" fill="${gradeColor}"/>
    <rect width="${width}" height="20" fill="url(#gradient)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="35" y="14">Crabb</text>
    <text x="${70 + (width - 70) / 2}" y="14">${scoreText}${verifiedText}</text>
  </g>
</svg>`;
}

/**
 * Generates a "Verified" only badge
 */
function generateVerifiedBadge(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" role="img" aria-label="Crabb Verified">
  <title>Crabb Verified</title>
  <linearGradient id="gradient" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="rounded">
    <rect width="120" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#rounded)">
    <rect width="70" height="20" fill="#555"/>
    <rect x="70" width="50" height="20" fill="#10B981"/>
    <rect width="120" height="20" fill="url(#gradient)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="35" y="14">Crabb</text>
    <text x="95" y="14">✓</text>
  </g>
</svg>`;
}

/**
 * Generates a "Not Found" badge
 */
function generateNotFoundBadge(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="20" role="img" aria-label="Crabb: not found">
  <title>Crabb: not found</title>
  <linearGradient id="gradient" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="rounded">
    <rect width="130" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#rounded)">
    <rect width="70" height="20" fill="#555"/>
    <rect x="70" width="60" height="20" fill="#9CA3AF"/>
    <rect width="130" height="20" fill="url(#gradient)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="35" y="14">Crabb</text>
    <text x="100" y="14">not found</text>
  </g>
</svg>`;
}

export async function GET(request: NextRequest, { params }: BadgeParams) {
  const { id } = params;

  // Check for special badge types
  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  // Generate a simple verified badge without lookup
  if (type === 'verified') {
    return new NextResponse(generateVerifiedBadge(), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
      },
    });
  }

  // Look up score card
  if (!sql) {
    if (process.env.NODE_ENV === 'production') {
      console.error('DATABASE_URL not configured in production');
      return new NextResponse('Service unavailable', { status: 500 });
    }
    // Mock response for development
    const mockBadge = generateBadge(85, 'B', true);
    return new NextResponse(mockBadge, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }

  const rows = await sql`SELECT score, grade, verified FROM score_cards WHERE public_id = ${id} AND expires_at > NOW() LIMIT 1`;

  const card = rows?.[0] as { score: number; grade: string; verified: boolean | null } | undefined;

  if (!card) {
    return new NextResponse(generateNotFoundBadge(), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // 5 min cache for not found
      },
    });
  }

  const badge = generateBadge(card.score, card.grade, card.verified ?? false);

  return new NextResponse(badge, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600', // 1 hour cache
    },
  });
}

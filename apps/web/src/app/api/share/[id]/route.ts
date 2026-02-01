import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const token = request.headers.get('x-delete-token');

    if (!token) {
      return NextResponse.json(
        { error: 'Delete token required' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    // Verify token matches
    const { data: card } = await supabase
      .from('score_cards')
      .select('delete_token')
      .eq('public_id', id)
      .single();

    if (!card) {
      return NextResponse.json(
        { error: 'Score card not found' },
        { status: 404 }
      );
    }

    if (card.delete_token !== token) {
      return NextResponse.json(
        { error: 'Invalid delete token' },
        { status: 403 }
      );
    }

    // Delete the card
    const { error } = await supabase
      .from('score_cards')
      .delete()
      .eq('public_id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete score card' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

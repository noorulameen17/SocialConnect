import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../admin/_utils';

type AsyncParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: AsyncParams) {
  try {
    const { id } = await context.params;
    console.log('Debug route - checking user ID:', id);
    
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    
    const { supabase } = auth;
    
    // Check if user exists with different queries
    const queries = [
      supabase.from('profiles').select('*').eq('id', id),
      supabase.from('profiles').select('id, username, is_admin, active').eq('id', id),
      supabase.from('profiles').select('id').eq('id', id)
    ];
    
    const results = await Promise.all(queries);
    
    console.log('Debug results:', results);
    
    return NextResponse.json({
      userId: id,
      results: results.map((r: any, i: number) => ({
        query: i + 1,
        data: r.data,
        error: r.error,
        count: r.data?.length || 0
      }))
    });
    
  } catch (err) {
    console.error('Debug route error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

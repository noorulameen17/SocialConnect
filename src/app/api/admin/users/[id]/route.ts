import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_utils';

type AsyncParams = { params: Promise<{ id: string }> };

// GET /api/admin/users/[id]
export async function GET(_req: Request, context: AsyncParams) {
  const { id } = await context.params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });
  const { supabase } = auth;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, bio, avatar_url, created_at, active, is_admin')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user: data });
}

// PATCH /api/admin/users/[id]  { is_admin?: boolean, active?: boolean }
export async function PATCH(req: Request, context: AsyncParams) {
  try {
    const { id } = await context.params;
    console.log('PATCH route hit with ID:', id);
    
    const auth = await requireAdmin();
    if ('error' in auth) {
      console.log('Auth error:', auth.error);
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });
    }
    
    const { supabase, user: acting } = auth;
    if (acting.id === id) {
      return NextResponse.json({ error: 'Cannot modify own admin status' }, { status: 400 });
    }
    
    const body = await req.json().catch(() => ({}));
    console.log('Request body:', body);
    
    const updates: any = {};
    if (body.is_admin !== undefined) updates.is_admin = !!body.is_admin;
    if (body.active !== undefined) updates.active = !!body.active;
    
    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    
    console.log('Applying updates:', updates);
    
    // First, let's check if the user exists at all
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, username, is_admin, active')
      .eq('id', id);
      
    console.log('User existence check:', { 
      id, 
      existingUser, 
      checkError,
      userCount: existingUser?.length || 0 
    });
    
    if (checkError) {
      console.error('Error checking user existence:', checkError);
      return NextResponse.json({ 
        error: 'Database error during user check', 
        details: checkError.message,
        userId: id 
      }, { status: 500 });
    }
    
    if (!existingUser || existingUser.length === 0) {
      console.log('No user found with ID:', id);
      
      // Let's also try a broad search to see what users exist
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, username')
        .limit(5);
      
      console.log('Sample of existing users:', allUsers);
      
      return NextResponse.json({ 
        error: 'User not found', 
        searchedId: id,
        sampleUsers: allUsers?.map(u => ({ id: u.id, username: u.username })) || []
      }, { status: 404 });
    }
    
    console.log('User found, proceeding with update');
    
    // Simple update without extra complexity
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('id, is_admin, active');
      
    console.log('Update result:', { data, error });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    if (!data || data.length === 0) {
      console.log('Update returned empty result - likely RLS policy issue');
      
      // Try to verify the update actually happened by re-querying
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('id, is_admin, active')
        .eq('id', id)
        .single();
        
      console.log('Verification query:', { verifyData, verifyError });
      
      if (verifyError) {
        return NextResponse.json({ error: 'Update failed and verification failed' }, { status: 500 });
      }
      
      // Check if the update actually took effect
      const expectedValue = updates.is_admin !== undefined ? updates.is_admin : verifyData.is_admin;
      const actualValue = verifyData.is_admin;
      
      if (expectedValue === actualValue) {
        console.log('Update was successful despite empty return - RLS policy blocking select');
        return NextResponse.json({ user: verifyData });
      } else {
        console.log('Update failed - values do not match:', { expected: expectedValue, actual: actualValue });
        return NextResponse.json({ 
          error: 'Update failed - possibly due to database constraints or RLS policies',
          details: {
            attempted: updates,
            current: verifyData
          }
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ user: data[0] });
    
  } catch (err) {
    console.error('Unexpected error in PATCH route:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

"use server";
import { revalidatePath } from 'next/cache';
import { getServerClient } from './supabaseServer';

export async function signOut() {
  const supabase = await getServerClient();
  await supabase.auth.signOut();
  revalidatePath('/');
}

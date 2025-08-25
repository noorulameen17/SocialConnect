import { NextResponse } from 'next/server';

type AsyncParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: AsyncParams) {
  const { id } = await context.params;
  return NextResponse.json({ message: 'Test route works', id });
}

export async function PATCH(req: Request, context: AsyncParams) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ message: 'PATCH test route works', id, body });
}

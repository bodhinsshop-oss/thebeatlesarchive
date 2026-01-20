import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const randomWork = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM Work ORDER BY RANDOM() LIMIT 1
    `;

    if (!randomWork || randomWork.length === 0) {
      return NextResponse.json({ error: 'No works found' }, { status: 404 });
    }

    return NextResponse.json({ id: randomWork[0].id });
  } catch (error) {
    console.error('Random work error:', error);
    return NextResponse.json({ error: 'Failed to get random work' }, { status: 500 });
  }
}

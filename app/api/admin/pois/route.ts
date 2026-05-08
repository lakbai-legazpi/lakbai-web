import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });
  
  return dbUser?.role === 'ADMIN';
}

export async function GET(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const skip = (page - 1) * limit;

    const pois = await prisma.pOI.findMany({
      where: {
        name: { contains: search, mode: 'insensitive' }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        primaryTag: { select: { name: true } },
        address: { select: { cityMunicipality: true, province: true } },
        _count: { select: { vouches: true, favorites: true } }
      }
    });

    const total = await prisma.pOI.count({
      where: { name: { contains: search, mode: 'insensitive' } }
    });

    return NextResponse.json({ pois, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Admin POIs GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch POIs' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing POI ID' }, { status: 400 });

    await prisma.pOI.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin POIs DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete POI' }, { status: 500 });
  }
}

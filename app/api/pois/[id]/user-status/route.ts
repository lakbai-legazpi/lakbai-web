import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: "Missing POI ID" }, { status: 400 });

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ isVouched: false, isFavorited: false });
        }

        const [vouch, favorite] = await Promise.all([
            prisma.pOIVouch.findUnique({
                where: { poiId_userId: { poiId: id, userId: user.id } }
            }),
            prisma.pOIFavorite.findUnique({
                where: { poiId_userId: { poiId: id, userId: user.id } }
            })
        ]);

        return NextResponse.json({ 
            isVouched: !!vouch, 
            isFavorited: !!favorite 
        });
    } catch (error) {
        console.error("Failed to fetch user status", error);
        return NextResponse.json({ error: "Failed to fetch user status" }, { status: 500 });
    }
}

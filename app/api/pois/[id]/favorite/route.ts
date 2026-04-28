import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: "Missing POI ID" }, { status: 400 });

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existingFavorite = await prisma.pOIFavorite.findUnique({
            where: { poiId_userId: { poiId: id, userId: user.id } }
        });

        if (existingFavorite) {
            // Delete favorite
            await prisma.pOIFavorite.delete({
                where: { id: existingFavorite.id }
            });
            return NextResponse.json({ isFavorited: false });
        } else {
            // Create favorite
            await prisma.pOIFavorite.create({
                data: { poiId: id, userId: user.id }
            });
            return NextResponse.json({ isFavorited: true });
        }
    } catch (error) {
        console.error("Failed to toggle favorite", error);
        return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 });
    }
}

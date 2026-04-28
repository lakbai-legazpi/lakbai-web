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

        const existingVouch = await prisma.pOIVouch.findUnique({
            where: { poiId_userId: { poiId: id, userId: user.id } }
        });

        if (existingVouch) {
            // Delete vouch and decrement count
            await prisma.$transaction([
                prisma.pOIVouch.delete({
                    where: { id: existingVouch.id }
                }),
                prisma.pOI.update({
                    where: { id },
                    data: { vouchCount: { decrement: 1 } }
                })
            ]);
            return NextResponse.json({ isVouched: false });
        } else {
            // Create vouch and increment count
            await prisma.$transaction([
                prisma.pOIVouch.create({
                    data: { poiId: id, userId: user.id }
                }),
                prisma.pOI.update({
                    where: { id },
                    data: { vouchCount: { increment: 1 } }
                })
            ]);
            return NextResponse.json({ isVouched: true });
        }
    } catch (error) {
        console.error("Failed to toggle vouch", error);
        return NextResponse.json({ error: "Failed to toggle vouch" }, { status: 500 });
    }
}

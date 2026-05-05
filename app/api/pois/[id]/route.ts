import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Missing POI ID" }, { status: 400 });
        }

        const poi = await prisma.pOI.findUnique({
            where: { id },
            include: {
                tags: {
                    include: {
                        cluster: true
                    }
                },
                galleries: true,
                address: true,
                operatingHours: true,
                links: true,
                reviews: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                firstName: true,
                                lastName: true,
                                avatarSeed: true,
                                avatarOptions: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!poi) {
            return NextResponse.json({ error: "POI not found" }, { status: 404 });
        }

        return NextResponse.json({ poi });
    } catch (error) {
        console.error("Failed to fetch POI", error);
        return NextResponse.json({ error: "Failed to fetch POI" }, { status: 500 });
    }
}

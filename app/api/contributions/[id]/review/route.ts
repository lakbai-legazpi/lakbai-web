import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

type ReviewBody = {
  action: 'APPROVE' | 'REJECT';
  adminNotes?: string;
};

// ---------------------------------------------------------------------------
// PATCH /api/contributions/[id]/review — admin: approve or reject
// ---------------------------------------------------------------------------
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (dbUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const { id } = await params;
    const body: ReviewBody = await request.json();
    const { action, adminNotes } = body;

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be APPROVE or REJECT' },
        { status: 400 }
      );
    }

    // Fetch the contribution
    const contribution = await prisma.contribution.findUnique({
      where: { id },
    });

    if (!contribution) {
      return NextResponse.json(
        { error: 'Contribution not found' },
        { status: 404 }
      );
    }

    if (contribution.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only PENDING contributions can be reviewed' },
        { status: 409 }
      );
    }

    // -----------------------------------------------------------------------
    // APPROVE — execute the POI mutation
    // -----------------------------------------------------------------------
    if (action === 'APPROVE') {
      const data = contribution.proposedData as Record<string, unknown>;

      if (contribution.type === 'CREATE') {
        // Build the POI create payload from proposedData
        const {
          name,
          description,
          latitude,
          longitude,
          tagIds = [],
          address,
          galleries,
          operatingHours = [],
        } = data as {
          name: string;
          description: string;
          latitude: number;
          longitude: number;
          tagIds?: string[];
          address?: {
            blockLotNumber?: string;
            houseNumber?: string;
            purok?: string;
            street?: string;
            subdivisionName?: string;
            barangay?: string;
            cityMunicipality?: string;
            province?: string;
            postalCode?: string;
          };
          galleries?: {
            urls?: string[];
            uploads?: Array<{
              fileName?: string;
              dataUrl?: string;
            }>;
          };
          operatingHours?: Array<{
            dayOfWeek: number;
            openTime?: string;
            closeTime?: string;
            isClosed?: boolean;
            is24Hours?: boolean;
          }>;
        };

        await prisma.pOI.create({
          data: {
            name,
            description: description ?? '',
            latitude: Number(latitude),
            longitude: Number(longitude),
            tags: tagIds.length > 0
              ? { connect: (tagIds as string[]).map(tid => ({ id: tid })) }
              : undefined,
            address: address
              ? { create: address }
              : undefined,
            operatingHours: operatingHours.length > 0
              ? {
                  create: (operatingHours as Array<{
                    dayOfWeek: number;
                    openTime?: string;
                    closeTime?: string;
                    isClosed?: boolean;
                    is24Hours?: boolean;
                  }>).map(h => ({
                    dayOfWeek: h.dayOfWeek,
                    openTime: h.openTime ?? null,
                    closeTime: h.closeTime ?? null,
                    isClosed: h.isClosed ?? false,
                    is24Hours: h.is24Hours ?? false,
                  })),
                }
              : undefined,
            galleries: galleries
              ? (() => {
                  const galleryImageUrls = [
                    ...(galleries.urls ?? []),
                    ...((galleries.uploads ?? []).map(upload => upload.dataUrl ?? '')),
                  ].filter(url => typeof url === 'string' && url.trim().length > 0);

                  if (galleryImageUrls.length === 0) {
                    return undefined;
                  }

                  return {
                    create: galleryImageUrls.map(imageUrl => ({ imageUrl: imageUrl.trim() })),
                  };
                })()
              : undefined,
          },
        });
      } else if (contribution.type === 'UPDATE') {
        if (!contribution.poiId) {
          return NextResponse.json(
            { error: 'UPDATE contribution is missing poiId' },
            { status: 422 }
          );
        }

        const {
          name,
          description,
          latitude,
          longitude,
          tagIds,
          address,
          galleries,
          operatingHours,
        } = data as {
          name?: string;
          description?: string;
          latitude?: number;
          longitude?: number;
          tagIds?: string[];
          address?: {
            blockLotNumber?: string;
            houseNumber?: string;
            purok?: string;
            street?: string;
            subdivisionName?: string;
            barangay?: string;
            cityMunicipality?: string;
            province?: string;
            postalCode?: string;
          };
          galleries?: {
            urls?: string[];
            uploads?: Array<{
              fileName?: string;
              dataUrl?: string;
            }>;
          };
          operatingHours?: Array<{
            dayOfWeek: number;
            openTime?: string;
            closeTime?: string;
            isClosed?: boolean;
            is24Hours?: boolean;
          }>;
        };

        await prisma.pOI.update({
          where: { id: contribution.poiId },
          data: {
            ...(name        !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(latitude    !== undefined && { latitude: Number(latitude) }),
            ...(longitude   !== undefined && { longitude: Number(longitude) }),
            ...(tagIds      !== undefined && {
              tags: { set: tagIds.map(tid => ({ id: tid })) },
            }),
            ...(address !== undefined && {
              address: {
                upsert: {
                  update: address,
                  create: address,
                },
              },
            }),
            ...(Array.isArray(operatingHours) && {
              operatingHours: {
                deleteMany: {},
                create: operatingHours.map(hour => ({
                  dayOfWeek: hour.dayOfWeek,
                  openTime: hour.openTime ?? null,
                  closeTime: hour.closeTime ?? null,
                  isClosed: hour.isClosed ?? false,
                  is24Hours: hour.is24Hours ?? false,
                })),
              },
            }),
            ...(galleries !== undefined && {
              galleries: (() => {
                const galleryImageUrls = [
                  ...(galleries?.urls ?? []),
                  ...((galleries?.uploads ?? []).map(upload => upload.dataUrl ?? '')),
                ].filter(url => typeof url === 'string' && url.trim().length > 0);

                return {
                  deleteMany: {},
                  create: galleryImageUrls.map(imageUrl => ({ imageUrl: imageUrl.trim() })),
                };
              })(),
            }),
          },
        });
      }
    }

    // -----------------------------------------------------------------------
    // Update contribution status
    // -----------------------------------------------------------------------
    const updated = await prisma.contribution.update({
      where: { id },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        adminNotes: adminNotes ?? null,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ contribution: updated });
  } catch (error) {
    console.error('Failed to review contribution', error);
    return NextResponse.json(
      { error: 'Failed to review contribution' },
      { status: 500 }
    );
  }
}

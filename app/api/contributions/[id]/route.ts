import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const contributionId = resolvedParams.id;
    if (!contributionId) {
      return NextResponse.json(
        { error: 'Contribution ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingContribution = await prisma.contribution.findUnique({
      where: { id: contributionId }
    });

    if (!existingContribution) {
      return NextResponse.json(
        { error: 'Contribution not found' },
        { status: 404 }
      );
    }

    if (existingContribution.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { isDismissed, isRead } = body;

    const dataToUpdate: any = {};
    if (typeof isDismissed === 'boolean') {
      dataToUpdate.isDismissed = isDismissed;
    }
    if (typeof isRead === 'boolean') {
      dataToUpdate.isRead = isRead;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided to update' },
        { status: 400 }
      );
    }

    const updatedContribution = await prisma.contribution.update({
      where: { id: contributionId },
      data: dataToUpdate
    });

    return NextResponse.json({ contribution: updatedContribution });
  } catch (error) {
    console.error('Failed to update contribution status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

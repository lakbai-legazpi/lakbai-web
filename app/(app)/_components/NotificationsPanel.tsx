'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Clock, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TextHeading, TextBody } from '@/components/text';

type ContributionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type ContributionType = 'CREATE' | 'UPDATE';

type Contribution = {
  id: string;
  type: ContributionType;
  status: ContributionStatus;
  proposedData?: Record<string, unknown> | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  poi?: { id: string; name: string } | null;
};

type NotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
  className?: string;
};

const statusStyles: Record<
  ContributionStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-warning-100 text-warning-700',
    icon: Clock
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-success-100 text-success-700',
    icon: CheckCircle2
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-error-100 text-error-700',
    icon: XCircle
  }
};

const formatDate = (value: string) => new Date(value).toLocaleString();

const getContributionTitle = (contribution: Contribution) => {
  if (contribution.poi?.name) return contribution.poi.name;
  const proposedName =
    contribution.proposedData &&
    typeof contribution.proposedData.name === 'string'
      ? contribution.proposedData.name
      : null;
  return proposedName ?? 'Contribution update';
};

export default function NotificationsPanel({
  open,
  onClose,
  className
}: NotificationsPanelProps) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContributions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/contributions');
      if (!res.ok) {
        throw new Error('Failed to load notifications');
      }
      const data = await res.json();
      setContributions(data.contributions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchContributions();
  }, [open, fetchContributions]);

  const reviewedContributions = useMemo(() => {
    return contributions
      .filter(contribution => contribution.status !== 'PENDING')
      .sort((a, b) => {
        const dateA = a.reviewedAt ?? a.createdAt;
        const dateB = b.reviewedAt ?? b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [contributions]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'bg-background border-border flex h-full w-[360px] flex-col border-l shadow-xl',
        className
      )}
      role='dialog'
      aria-label='Notifications'
    >
      <div className='border-border flex items-center justify-between border-b px-5 py-4'>
        <TextHeading className='text-text-main text-lg font-semibold'>
          Notifications
        </TextHeading>
        <button
          type='button'
          onClick={onClose}
          className='text-text-muted hover:text-text-main hover:bg-surface rounded-md p-1 transition-colors'
        >
          <X size={18} />
        </button>
      </div>

      <div className='flex items-center justify-end px-5 py-3'>
        <button
          type='button'
          onClick={fetchContributions}
          disabled={isLoading}
          className='text-text-main hover:bg-surface border-border flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50'
        >
          <RefreshCw
            className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')}
          />
          Refresh
        </button>
      </div>

      <div className='flex-1 overflow-y-auto px-5 py-4'>
        {isLoading && (
          <div className='text-text-muted flex items-center gap-2 text-sm'>
            <RefreshCw className='h-4 w-4 animate-spin' /> Loading updates...
          </div>
        )}

        {!isLoading && error && (
          <div className='border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-sm'>
            {error}
          </div>
        )}

        {!isLoading && !error && reviewedContributions.length === 0 && (
          <div className='text-text-muted flex h-full items-center justify-center text-center text-sm'>
            No updates yet. We will let you know when something comes up.
          </div>
        )}

        {!isLoading && !error && reviewedContributions.length > 0 && (
          <div className='flex flex-col gap-3'>
            {reviewedContributions.map(contribution => {
              const status = statusStyles[contribution.status];
              const StatusIcon = status.icon;
              const title = getContributionTitle(contribution);
              const reviewedAt =
                contribution.reviewedAt ?? contribution.createdAt;

              return (
                <div
                  key={contribution.id}
                  className='border-border bg-surface rounded-xl border px-4 py-3'
                >
                  <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2'>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          status.className
                        )}
                      >
                        <StatusIcon className='h-3 w-3' />
                        {status.label}
                      </span>
                      <span className='text-text-muted text-[11px] font-medium uppercase'>
                        {contribution.type}
                      </span>
                    </div>
                    <span className='text-text-muted text-[11px]'>
                      {formatDate(reviewedAt)}
                    </span>
                  </div>

                  <TextBody className='text-text-main mt-2 text-sm font-semibold'>
                    {title}
                  </TextBody>

                  {contribution.adminNotes && (
                    <TextBody className='text-text-muted mt-1 text-xs'>
                      Admin note: {contribution.adminNotes}
                    </TextBody>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

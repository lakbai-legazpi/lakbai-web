'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, RefreshCw, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TextHeading, TextBody } from '@/components/text';
import { Toast } from './Notificaiton';

export type ContributionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ContributionType = 'CREATE' | 'UPDATE';

export type Contribution = {
  id: string;
  type: ContributionType;
  status: ContributionStatus;
  proposedData?: Record<string, unknown> | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  isDismissed: boolean;
  isRead: boolean;
  poi?: { id: string; name: string } | null;
  poiId?: string | null;
};

type NotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
  className?: string;
  contributions: Contribution[];
  isLoading: boolean;
  error: string | null;
  onContributionsChange: (contributions: Contribution[]) => void;
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
  className,
  contributions,
  isLoading,
  error,
  onContributionsChange
}: NotificationsPanelProps) {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reviewedContributions = useMemo(() => {
    return contributions
      .filter(contribution => 
        contribution.status !== 'PENDING' && 
        !contribution.isDismissed && 
        !(contribution.status === 'APPROVED' && !contribution.poi)
      )
      .sort((a, b) => {
        const dateA = a.reviewedAt ?? a.createdAt;
        const dateB = b.reviewedAt ?? b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [contributions]);

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Optimistic update
    onContributionsChange(
      contributions.map(c => (c.id === id ? { ...c, isDismissed: true } : c))
    );
    try {
      await fetch(`/api/contributions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDismissed: true })
      });
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleCardClick = async (contribution: Contribution) => {
    if (!contribution.isRead) {
      onContributionsChange(
        contributions.map(c => (c.id === contribution.id ? { ...c, isRead: true } : c))
      );
      try {
        await fetch(`/api/contributions/${contribution.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true })
        });
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    if (contribution.status === 'APPROVED' && contribution.poiId) {
      onClose();
      router.push(`/explore?poi=${contribution.poiId}`);
    } else {
      setToastMessage(
        contribution.status === 'REJECTED' 
          ? 'This contribution was rejected.' 
          : 'This location is no longer available.'
      );
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className={cn(
          'bg-background border-border relative z-[100] flex h-full w-[380px] flex-col border-l shadow-2xl transition-all duration-300',
          className
        )}
        role='dialog'
        aria-label='Notifications'
      >
        <div className='border-border bg-surface/50 backdrop-blur-md flex items-center justify-between border-b px-6 py-5 sticky top-0 z-10'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary-100 text-primary-600 p-2 rounded-xl'>
              <Clock className='w-5 h-5' />
            </div>
            <div>
              <TextHeading className='text-text-main text-lg font-bold leading-tight'>
                Notifications
              </TextHeading>
              <p className='text-text-muted text-[11px] font-medium'>
                {isLoading ? 'Updating...' : 'Up to date'}
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='text-text-muted hover:text-text-main bg-surface hover:bg-surface-light rounded-full p-2 border border-transparent hover:border-border transition-all'
          >
            <X size={18} />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto bg-surface/30 px-4 py-5 scrollbar-invisible'>
          {isLoading && reviewedContributions.length === 0 && (
            <div className='text-text-muted flex flex-col items-center justify-center gap-3 mt-10 text-sm'>
              <RefreshCw className='h-6 w-6 text-primary-500 animate-spin' /> 
              Fetching updates...
            </div>
          )}

          {!isLoading && error && (
            <div className='border-error-200 bg-error-50/80 text-error-700 rounded-xl border p-4 text-sm flex items-start gap-3'>
              <XCircle className='h-5 w-5 shrink-0 mt-0.5' />
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && reviewedContributions.length === 0 && (
            <div className='text-text-muted flex flex-col items-center justify-center gap-2 mt-16 text-center text-sm px-6'>
              <div className='bg-surface border border-border p-4 rounded-full mb-2'>
                <CheckCircle2 className='w-8 h-8 text-text-muted/50' />
              </div>
              <p className='font-medium text-text-main'>You're all caught up!</p>
              <p className='text-xs'>We'll notify you here when your contributions are reviewed.</p>
            </div>
          )}

          {!error && reviewedContributions.length > 0 && (
            <div className='flex flex-col gap-3'>
              {reviewedContributions.map(contribution => {
                const status = statusStyles[contribution.status];
                const StatusIcon = status.icon;
                const title = getContributionTitle(contribution);
                const reviewedAt = contribution.reviewedAt ?? contribution.createdAt;

                return (
                  <div
                    key={contribution.id}
                    onClick={() => handleCardClick(contribution)}
                    className={cn(
                      'border-border group relative cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-md',
                      contribution.isRead ? 'bg-surface opacity-75 hover:opacity-100' : 'bg-background shadow-sm ring-1 ring-primary-500/20'
                    )}
                  >
                    {!contribution.isRead && (
                      <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(var(--primary-500),0.5)]"></div>
                    )}
                    <div className='flex items-center justify-between gap-3 mb-3 pr-4'>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide',
                          status.className
                        )}
                      >
                        <StatusIcon className='h-3.5 w-3.5' />
                        {status.label}
                      </span>
                      <span className='text-text-muted text-[11px] font-medium'>
                        {formatDate(reviewedAt)}
                      </span>
                    </div>

                    <TextBody className='text-text-main text-[15px] font-bold leading-tight pr-8'>
                      {title}
                    </TextBody>
                    <p className='text-text-muted text-[11px] font-semibold uppercase tracking-wider mt-1 mb-3'>
                      {contribution.type === 'CREATE' ? 'New Location' : 'Location Edit'}
                    </p>

                    {contribution.adminNotes && (
                      <div className='bg-surface border border-border/50 rounded-lg p-3 mt-1'>
                        <p className='text-text-main text-xs font-semibold mb-1'>Admin Note:</p>
                        <TextBody className='text-text-muted text-xs leading-relaxed'>
                          "{contribution.adminNotes}"
                        </TextBody>
                      </div>
                    )}
                    
                    <button
                      type='button'
                      onClick={(e) => handleDismiss(e, contribution.id)}
                      className='absolute bottom-3 right-3 text-text-muted hover:text-error-500 hover:bg-error-50 rounded-full p-2 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100'
                      title="Dismiss notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Toast Notification for missing POI or Rejections */}
      <Toast
        isOpen={!!toastMessage}
        message={toastMessage || ''}
        type="error"
        onClose={() => setToastMessage(null)}
      />
    </>
  );
}

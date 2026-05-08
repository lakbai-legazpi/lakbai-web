'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContributionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type ContributionType   = 'CREATE'  | 'UPDATE';

type Contributor = {
  id: string;
  name: string | null;
  email: string;
};

type LinkedPoi = {
  id: string;
  name: string;
} | null;

type Contribution = {
  id: string;
  type: ContributionType;
  status: ContributionStatus;
  proposedData: Record<string, unknown>;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: Contributor;
  poi: LinkedPoi;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function StatusBadge({ status }: { status: ContributionStatus }) {
  const map: Record<ContributionStatus, { label: string; className: string; icon: typeof Clock }> = {
    PENDING:  { label: 'Pending',  className: 'bg-warning-100 text-warning-700',  icon: Clock },
    APPROVED: { label: 'Approved', className: 'bg-success-100 text-success-700',  icon: CheckCircle },
    REJECTED: { label: 'Rejected', className: 'bg-error-100 text-error-700',      icon: XCircle },
  };
  const { label, className, icon: Icon } = map[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}>
      <Icon className='h-3 w-3' />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ContributionCard
// ---------------------------------------------------------------------------

function ContributionCard({
  contribution,
  onReview,
}: {
  contribution: Contribution;
  onReview: (id: string, action: 'APPROVE' | 'REJECT', notes?: string) => Promise<void>;
}) {
  const [expanded,   setExpanded]   = useState(false);
  const [notes,      setNotes]      = useState('');
  const [isLoading,  setIsLoading]  = useState(false);

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    setIsLoading(true);
    await onReview(contribution.id, action, notes.trim() || undefined);
    setIsLoading(false);
  };

  const d = contribution.proposedData;
  const isPending = contribution.status === 'PENDING';

  return (
    <article className='bg-background border-border rounded-xl border shadow-sm'>
      {/* Header row */}
      <div className='flex flex-wrap items-start justify-between gap-3 px-5 py-4'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                contribution.type === 'CREATE'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-secondary-100 text-secondary-700'
              )}
            >
              {contribution.type}
            </span>
            <StatusBadge status={contribution.status} />
          </div>

          <p className='text-text-main mt-1 text-sm font-semibold'>
            {String(d.name ?? '—')}
          </p>

          {contribution.poi && (
            <p className='text-text-muted flex items-center gap-1 text-xs'>
              <MapPin className='h-3 w-3' /> Editing: {contribution.poi.name}
            </p>
          )}
        </div>

        <div className='flex flex-col items-end gap-1 text-right'>
          <p className='text-text-muted text-xs'>{contribution.user.name ?? contribution.user.email}</p>
          <p className='text-text-muted text-xs'>{formatDate(contribution.createdAt)}</p>
        </div>
      </div>

      {/* Coordinates */}
      {(d.latitude != null || d.longitude != null) && (
        <div className='border-border text-text-muted border-t px-5 py-2 text-xs'>
          📍 {Number(d.latitude).toFixed(5)}, {Number(d.longitude).toFixed(5)}
        </div>
      )}

      {/* Proposed data preview — expandable */}
      <div className='border-border border-t'>
        <button
          type='button'
          onClick={() => setExpanded(p => !p)}
          className='text-text-muted hover:text-text-main flex w-full items-center justify-between px-5 py-2 text-xs font-medium transition'
        >
          View proposed data
          {expanded ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
        </button>

        {expanded && (
          <pre className='bg-surface-light scrollbar-thin max-h-48 overflow-auto rounded-b-xl px-5 py-3 text-[11px] leading-relaxed'>
            {JSON.stringify(d, null, 2)}
          </pre>
        )}
      </div>

      {/* Admin actions */}
      {isPending && (
        <div className='border-border flex flex-col gap-3 border-t px-5 py-4'>
          <textarea
            rows={2}
            placeholder='Admin notes (optional — visible on rejection)'
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className='border-border text-text-main placeholder:text-text-muted bg-surface focus:border-primary-400 resize-none rounded-lg border px-3 py-2 text-xs outline-none transition'
          />
          <div className='flex gap-2'>
            <button
              type='button'
              disabled={isLoading}
              onClick={() => handleAction('REJECT')}
              className='flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50'
            >
              {isLoading ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <XCircle className='h-3.5 w-3.5' />}
              Reject
            </button>
            <button
              type='button'
              disabled={isLoading}
              onClick={() => handleAction('APPROVE')}
              className='bg-success-500 hover:bg-success-600 flex flex-[2] items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-50'
            >
              {isLoading ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <CheckCircle className='h-3.5 w-3.5' />}
              Approve &amp; Publish
            </button>
          </div>
        </div>
      )}

      {/* Reviewed state */}
      {!isPending && contribution.adminNotes && (
        <div className='border-border border-t px-5 py-3'>
          <p className='text-text-muted text-xs font-semibold'>Admin Notes</p>
          <p className='text-text-main mt-0.5 text-xs'>{contribution.adminNotes}</p>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// AdminPage
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/contributions/pending');
      if (!res.ok) throw new Error('Failed to load contributions');
      const data = await res.json();
      setContributions(data.contributions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPending();
  }, [fetchPending]);

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT', notes?: string) => {
    try {
      const res = await fetch(`/api/contributions/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNotes: notes }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Review failed');
      }
      // Optimistically remove from the pending list
      setContributions(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Review failed');
    }
  };

  return (
    <div className='bg-surface-light min-h-screen'>
      <div className='mx-auto max-w-3xl px-4 py-10'>
        {/* Page Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-text-main text-2xl font-bold'>Contribution Review</h1>
            <p className='text-text-muted mt-1 text-sm'>
              {contributions.length} pending contribution{contributions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type='button'
            onClick={fetchPending}
            disabled={isLoading}
            className='border-border text-text-main hover:bg-surface bg-background flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50'
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* States */}
        {isLoading && (
          <div className='text-text-muted flex items-center justify-center gap-2 py-16 text-sm'>
            <Loader2 className='h-5 w-5 animate-spin' /> Loading contributions…
          </div>
        )}

        {!isLoading && error && (
          <div className='rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700'>
            {error}
          </div>
        )}

        {!isLoading && !error && contributions.length === 0 && (
          <div className='border-border rounded-xl border border-dashed px-5 py-16 text-center'>
            <CheckCircle className='text-success-400 mx-auto h-10 w-10' />
            <p className='text-text-main mt-3 font-semibold'>All caught up!</p>
            <p className='text-text-muted mt-1 text-sm'>No pending contributions to review.</p>
          </div>
        )}

        {!isLoading && !error && contributions.length > 0 && (
          <div className='flex flex-col gap-4'>
            {contributions.map(c => (
              <ContributionCard
                key={c.id}
                contribution={c}
                onReview={handleReview}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

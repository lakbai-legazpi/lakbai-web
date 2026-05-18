'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Trash2, Search, MapPin } from 'lucide-react';
import { Toast } from '@/app/(app)/_components/Notificaiton';

type POI = {
  id: string;
  name: string;
  primaryTag?: { name: string } | null;
  address?: { cityMunicipality: string | null; province: string | null } | null;
  _count: { vouches: number; favorites: number };
};

export default function POIManagementPage() {
  const [pois, setPois] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [poiToDelete, setPoiToDelete] = useState<POI | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 3000);
    },
    []
  );

  const fetchPOIs = useCallback(
    async (searchQuery: string, pageNum: number) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/admin/pois?search=${encodeURIComponent(searchQuery)}&page=${pageNum}`
        );
        if (!res.ok) {
          throw new Error('Failed to load POIs');
        }
        const data = await res.json();
        setPois(data.pois);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error(err);
        showToast(
          err instanceof Error ? err.message : 'Failed to load POIs',
          'error'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPOIs(search, page);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, page, fetchPOIs]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleDelete = async () => {
    if (!poiToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/pois?id=${poiToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPois(prev => prev.filter(p => p.id !== poiToDelete.id));
        setPoiToDelete(null);
        showToast('POI deleted successfully.', 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data?.error ?? 'Failed to delete POI', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(
        err instanceof Error ? err.message : 'Failed to delete POI',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className='mx-auto max-w-6xl px-4 py-10'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-text-main text-2xl font-bold'>POI Management</h1>
          <p className='text-text-muted mt-1 text-sm'>
            Manage Points of Interest across the platform
          </p>
        </div>
      </div>

      <div className='bg-surface border-border overflow-hidden rounded-xl border shadow-sm'>
        <div className='border-border flex items-center border-b p-4'>
          <div className='relative max-w-md flex-1'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <Search className='text-text-muted h-4 w-4' />
            </div>
            <input
              type='text'
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className='border-border focus:border-primary-400 bg-background text-text-main block w-full rounded-lg border py-2 pr-3 pl-10 text-sm transition outline-none'
              placeholder='Search POIs...'
            />
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-full divide-y divide-gray-200'>
            <thead className='bg-slate-50'>
              <tr>
                <th
                  scope='col'
                  className='text-text-muted px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase'
                >
                  Name
                </th>
                <th
                  scope='col'
                  className='text-text-muted px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase'
                >
                  Location
                </th>
                <th
                  scope='col'
                  className='text-text-muted px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase'
                >
                  Category
                </th>
                <th
                  scope='col'
                  className='text-text-muted px-6 py-3 text-left text-xs font-semibold tracking-wider uppercase'
                >
                  Vouches
                </th>
                <th
                  scope='col'
                  className='text-text-muted px-6 py-3 text-right text-xs font-semibold tracking-wider uppercase'
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-surface divide-border divide-y'>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className='px-6 py-12 text-center'>
                    <Loader2 className='text-primary-500 mx-auto h-6 w-6 animate-spin' />
                  </td>
                </tr>
              ) : pois.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className='text-text-muted px-6 py-12 text-center text-sm'
                  >
                    No POIs found.
                  </td>
                </tr>
              ) : (
                pois.map(poi => (
                  <tr
                    key={poi.id}
                    className='transition-colors hover:bg-slate-50'
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-text-main text-sm font-medium'>
                        {poi.name}
                      </div>
                      <div className='text-text-muted text-xs'>
                        ID: {poi.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {poi.address?.cityMunicipality ? (
                        <div className='text-text-muted flex items-center text-sm'>
                          <MapPin className='mr-1 h-3 w-3' />
                          {poi.address.cityMunicipality}, {poi.address.province}
                        </div>
                      ) : (
                        <span className='text-text-muted text-sm'>—</span>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {poi.primaryTag ? (
                        <span className='bg-primary-100 text-primary-700 inline-flex rounded-full px-2 text-xs leading-5 font-semibold'>
                          {poi.primaryTag.name}
                        </span>
                      ) : (
                        <span className='text-text-muted text-sm'>—</span>
                      )}
                    </td>
                    <td className='text-text-main px-6 py-4 text-sm whitespace-nowrap'>
                      {poi._count.vouches}
                    </td>
                    <td className='px-6 py-4 text-right text-sm font-medium whitespace-nowrap'>
                      <button
                        onClick={() => setPoiToDelete(poi)}
                        className='text-red-500 transition-colors hover:text-red-700'
                        title='Delete POI'
                      >
                        <Trash2 className='h-5 w-5' />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className='border-border flex items-center justify-between border-t px-6 py-3'>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className='border-border text-text-main hover:bg-surface-light rounded-md border px-3 py-1 text-sm disabled:opacity-50'
            >
              Previous
            </button>
            <span className='text-text-muted text-sm'>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className='border-border text-text-main hover:bg-surface-light rounded-md border px-3 py-1 text-sm disabled:opacity-50'
            >
              Next
            </button>
          </div>
        )}
      </div>

      {poiToDelete && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-surface border-border w-full max-w-md rounded-2xl border p-6 shadow-xl'>
            <h2 className='text-text-main text-lg font-semibold'>
              Delete this location?
            </h2>
            <p className='text-text-muted mt-2 text-sm'>
              This will permanently remove “{poiToDelete.name}” and cannot be
              undone.
            </p>
            <div className='mt-6 flex items-center justify-end gap-2'>
              <button
                type='button'
                onClick={() => setPoiToDelete(null)}
                className='border-border text-text-main hover:bg-surface-light rounded-lg border px-4 py-2 text-sm'
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleDelete}
                disabled={isDeleting}
                className='rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60'
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast
        isOpen={Boolean(toast)}
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Trash2, Search, MapPin } from 'lucide-react';

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

  const fetchPOIs = useCallback(async (searchQuery: string, pageNum: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/pois?search=${encodeURIComponent(searchQuery)}&page=${pageNum}`);
      if (res.ok) {
        const data = await res.json();
        setPois(data.pois);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPOIs(search, page);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, page, fetchPOIs]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this POI? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/admin/pois?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPois(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Failed to delete POI');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className='mx-auto max-w-6xl px-4 py-10'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-text-main text-2xl font-bold'>POI Management</h1>
          <p className='text-text-muted mt-1 text-sm'>Manage Points of Interest across the platform</p>
        </div>
      </div>

      <div className='bg-surface border-border overflow-hidden rounded-xl border shadow-sm'>
        <div className='border-border flex items-center border-b p-4'>
          <div className='relative flex-1 max-w-md'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <Search className='text-text-muted h-4 w-4' />
            </div>
            <input
              type='text'
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className='border-border focus:border-primary-400 bg-background text-text-main block w-full rounded-lg border py-2 pl-10 pr-3 text-sm outline-none transition'
              placeholder='Search POIs...'
            />
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-full divide-y divide-gray-200'>
            <thead className='bg-slate-50'>
              <tr>
                <th scope='col' className='text-text-muted px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider'>Name</th>
                <th scope='col' className='text-text-muted px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider'>Location</th>
                <th scope='col' className='text-text-muted px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider'>Category</th>
                <th scope='col' className='text-text-muted px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider'>Vouches</th>
                <th scope='col' className='text-text-muted px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider'>Actions</th>
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
                  <td colSpan={5} className='text-text-muted px-6 py-12 text-center text-sm'>
                    No POIs found.
                  </td>
                </tr>
              ) : (
                pois.map(poi => (
                  <tr key={poi.id} className='hover:bg-slate-50 transition-colors'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-text-main text-sm font-medium'>{poi.name}</div>
                      <div className='text-text-muted text-xs'>ID: {poi.id.slice(0, 8)}...</div>
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
                        <span className='bg-primary-100 text-primary-700 inline-flex rounded-full px-2 text-xs font-semibold leading-5'>
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
                        onClick={() => handleDelete(poi.id)}
                        className='text-red-500 transition-colors hover:text-red-700'
                        title="Delete POI"
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
            <span className='text-text-muted text-sm'>Page {page} of {totalPages}</span>
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
    </div>
  );
}

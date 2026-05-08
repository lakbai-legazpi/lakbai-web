import { prisma } from '@/lib/prisma';
import {
  Users,
  MapPin,
  ListChecks,
  AlertCircle
} from 'lucide-react';

export default async function AdminDashboardOverview() {
  // Fetch high-level statistics securely
  const [
    totalUsers,
    totalPois,
    pendingContributions,
    totalJourneys
  ] = await Promise.all([
    prisma.user.count(),
    prisma.pOI.count(),
    prisma.contribution.count({ where: { status: 'PENDING' } }),
    prisma.journey.count()
  ]);

  return (
    <div className='mx-auto max-w-5xl px-4 py-10'>
      <div className='mb-8'>
        <h1 className='text-text-main text-3xl font-bold'>Dashboard Overview</h1>
        <p className='text-text-muted mt-1'>Welcome to the Lakbai admin panel.</p>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {/* Stat Cards */}
        <div className='bg-surface border-border flex items-center gap-4 rounded-xl border p-6 shadow-sm'>
          <div className='bg-primary-100 flex h-12 w-12 items-center justify-center rounded-lg text-primary-600'>
            <Users size={24} />
          </div>
          <div>
            <p className='text-text-muted text-sm font-medium'>Total Users</p>
            <p className='text-text-main text-2xl font-bold'>{totalUsers}</p>
          </div>
        </div>

        <div className='bg-surface border-border flex items-center gap-4 rounded-xl border p-6 shadow-sm'>
          <div className='bg-secondary-100 text-secondary-600 flex h-12 w-12 items-center justify-center rounded-lg'>
            <MapPin size={24} />
          </div>
          <div>
            <p className='text-text-muted text-sm font-medium'>Total POIs</p>
            <p className='text-text-main text-2xl font-bold'>{totalPois}</p>
          </div>
        </div>

        <div className='bg-surface border-border flex items-center gap-4 rounded-xl border p-6 shadow-sm'>
          <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600'>
            <ListChecks size={24} />
          </div>
          <div>
            <p className='text-text-muted text-sm font-medium'>Total Journeys</p>
            <p className='text-text-main text-2xl font-bold'>{totalJourneys}</p>
          </div>
        </div>

        <div className='bg-surface border-border flex items-center gap-4 rounded-xl border p-6 shadow-sm'>
          <div className='bg-warning-100 text-warning-600 flex h-12 w-12 items-center justify-center rounded-lg'>
            <AlertCircle size={24} />
          </div>
          <div>
            <p className='text-text-muted text-sm font-medium'>Pending Contributions</p>
            <p className='text-text-main text-2xl font-bold'>{pendingContributions}</p>
          </div>
        </div>
      </div>

      {/* Additional sections can be added here, e.g. Recent Activity */}
      <div className='mt-10'>
        <h2 className='text-text-main mb-4 text-xl font-bold'>Quick Actions</h2>
        <div className='bg-surface border-border rounded-xl border p-6'>
          <p className='text-text-muted'>Select an option from the sidebar to manage POIs or review pending user contributions.</p>
        </div>
      </div>
    </div>
  );
}

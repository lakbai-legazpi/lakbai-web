import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { AdminSidebar } from './_components/AdminSidebar';

export const metadata = {
  title: 'Lakbai Admin Dashboard',
  description: 'Admin management for Lakbai Platform'
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Fetch user from DB to check role
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, firstName: true, lastName: true, avatarSeed: true, avatarOptions: true }
  });

  // 2. Enforce ADMIN role
  if (!dbUser || dbUser.role !== 'ADMIN') {
    // If not admin, we can redirect to the app or show a 404/Forbidden
    // Redirecting to root is the simplest approach
    redirect('/');
  }

  return (
    <div className='flex h-screen w-full flex-row overflow-hidden bg-surface-light'>
      <AdminSidebar userProfile={dbUser} />
      <main className='flex-1 overflow-auto relative'>
        {children}
      </main>
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/cn';
import { TextSubheading, TextBody } from '@/components/text';
import { GithubLogo } from '@/components/icons/GithubLogo';
import {
  AuthProvider,
  NavAuthButtons,
  FooterActions,
  LegalActions
} from '@/app/(marketing)/_components/HeroActions';

export function MarketingShell({
  children,
  mainClassName
}: {
  children: React.ReactNode;
  mainClassName?: string;
}) {
  return (
    <AuthProvider>
      <div className='relative min-h-screen w-full overflow-hidden bg-white font-sans text-slate-900 selection:bg-blue-100'>
        <nav className='bg-surface border-border fixed top-0 z-50 w-full border-b'>
          <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
            <Link href='/' className='flex items-center gap-2'>
              <div className='relative h-9 w-9'>
                <Image
                  src='/logos/lakbai.svg'
                  alt='Lakbai'
                  fill
                  className='object-contain'
                />
              </div>
              <TextSubheading className='text-primary-500 font-bold'>
                lakbai
              </TextSubheading>
            </Link>

            <NavAuthButtons />
          </div>
        </nav>

        <main className={cn('pt-20', mainClassName)}>{children}</main>

        <footer className='w-full bg-white/50 pt-16 pb-12 backdrop-blur-md'>
          <div className='mx-auto max-w-7xl px-6 md:px-4'>
            <div className='mb-10 h-px w-full bg-slate-200/60' />
            <div className='flex flex-col gap-10'>
              <div className='flex flex-col items-start justify-between gap-8 md:flex-row'>
                <div className='flex max-w-2xl flex-col gap-4'>
                  <div className='relative h-9 w-9'>
                    <Image
                      src='/logos/lakbai.svg'
                      alt='Lakbai'
                      fill
                      className='object-contain'
                    />
                  </div>
                </div>
                <FooterActions />
              </div>

              <div className='flex flex-col items-start justify-between gap-4 border-t border-slate-200/60 pt-8 md:flex-row md:items-center'>
                <div className='flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8'>
                  <TextBody className='text-text-muted font-medium'>
                    © 2026 Lakbai
                  </TextBody>
                  <LegalActions />
                </div>
                <div className='flex items-center gap-4'>
                  <a
                    href='https://github.com/lakbai-platform/lakbai-web'
                    target='_blank'
                    rel='noreferrer'
                    className='text-text-muted hover:text-text-main transition-colors'
                  >
                    <span className='sr-only'>GitHub</span>
                    <GithubLogo size={24} className='hover:text-primary-400' />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Map as MapIcon, MessageSquare, Compass } from 'lucide-react';
import {
  TextDisplay,
  TextHeading,
  TextSubheading,
  TextBody
} from '@/components/text';
import { GithubLogo } from '@/components/icons/GithubLogo';
import {
  AuthProvider,
  NavAuthButtons,
  HeroCTA,
  FooterActions, // Added import
  LegalActions   // Added import
} from '@/app/(marketing)/_components/HeroActions';
import { createClient } from '@/lib/supabase/server';

export default async function LandingPage() {
  // Server-side session check — redirect authenticated users straight to /chat
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/chat');
  }

  return (
    // AuthProvider wraps the whole page so NavAuthButtons and HeroCTA
    // share a single modal state (only one pair of modals rendered).
    <AuthProvider>
      <div className='relative min-h-screen w-full overflow-hidden bg-white font-sans text-slate-900 selection:bg-blue-100'>
        <nav className='bg-surface border-border fixed top-0 z-50 w-full border-b'>
          <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
            <div className='flex items-center gap-2'>
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
            </div>

            <NavAuthButtons />
          </div>
        </nav>

        <main>
          <section className='relative flex min-h-[75vh] flex-col justify-center px-6 pt-32 pb-16'>
            <div className='mx-auto w-full max-w-7xl'>
              <div className='max-w-5xl text-left'>
                <TextDisplay className='mb-6 tracking-tighter text-slate-900 py-2 md:mb-8 md:text-[100px] md:leading-[1.1]'>
                  Plan your <br />
                  <span className='text-primary-500'>perfect journey</span>
                </TextDisplay>

                <TextSubheading className='text-text-muted mb-12 max-w-2xl leading-relaxed md:text-[28px]'>
                  Smart itineraries for the modern{' '}
                  <span className='text-primary-500 font-semibold'>local</span>{' '}
                  explorer
                </TextSubheading>

                <div className='flex items-center justify-start'>
                  <HeroCTA />
                </div>
              </div>
            </div>
          </section>

          <section className='py-16 md:py-24'>
            <div className='mx-auto max-w-7xl px-6'>
              <div className='scrollbar-hide -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-6 md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:px-0 md:pb-0'>
                <div className='w-[88vw] shrink-0 snap-center rounded-[2.5rem] border border-slate-100 bg-white/60 p-10 backdrop-blur-sm transition-all md:w-auto'>
                  <div className='mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl'>
                    <MessageSquare size={28} />
                  </div>
                  <TextHeading className='mb-4 text-slate-900'>
                    AI Concierge
                  </TextHeading>
                  <TextBody className='text-base leading-relaxed text-slate-500'>
                    Smart chat assistance that understands your preferences and
                    plans your day instantly.
                  </TextBody>
                </div>

                <div className='w-[88vw] shrink-0 snap-center rounded-[2.5rem] border border-slate-100 bg-white/60 p-10 backdrop-blur-sm transition-all md:w-auto'>
                  <div className='mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl'>
                    <MapIcon size={28} />
                  </div>
                  <TextHeading className='mb-4 text-slate-900'>
                    Interactive Map
                  </TextHeading>
                  <TextBody className='text-base leading-relaxed text-slate-500'>
                    Live points of interest curated for travelers, including the
                    best food and sights.
                  </TextBody>
                </div>

                <div className='w-[88vw] shrink-0 snap-center rounded-[2.5rem] border border-slate-100 bg-white/60 p-10 backdrop-blur-sm transition-all md:w-auto'>
                  <div className='mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xl'>
                    <Compass size={28} />
                  </div>
                  <TextHeading className='mb-4 text-slate-900'>
                    Seamless Itinerary
                  </TextHeading>
                  <TextBody className='text-base leading-relaxed text-slate-500'>
                    A centralized place to manage your basecamp, daily
                    schedules, and journey history.
                  </TextBody>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className='w-full bg-white/50 pt-16 pb-12 backdrop-blur-md'>
          <div className='mx-auto max-w-7xl px-6'>
            <div className='mb-10 h-px w-full bg-slate-200/60' />
            <div className='flex flex-col gap-10'>
              {/* Top Layer */}
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
                {/* Implemented FooterActions here */}
                <FooterActions />
              </div>

              {/* Bottom Layer */}
              <div className='flex flex-col items-start justify-between gap-4 border-t border-slate-200/60 pt-8 md:flex-row md:items-center'>
                <div className='flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8'>
                  <TextBody className='text-text-muted font-medium'>
                    © 2026 Lakbai
                  </TextBody>
                  {/* Implemented LegalActions here */}
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
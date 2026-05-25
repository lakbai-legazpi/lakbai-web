import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Map as MapIcon, MessageSquare, Compass, ChevronDown } from 'lucide-react';
import {
  TextDisplay,
  TextHeading,
  TextSubheading,
  TextBody
} from '@/components/text';
import { GithubLogo } from '@/components/icons/GithubLogo';
import { NavAuthButtons } from '@/components/auth-provider';
import {
  HeroCTA,
  FooterActions,
  LegalActions
} from '@/app/(marketing)/_components/HeroActions';
import { createClient } from '@/lib/supabase/server';

export default async function LandingPage() {
  // Server-side session check
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <>
      <div 
        className='relative min-h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-blue-100'
        style={{
          backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.05) 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px'
        }}
      >
        <nav className='bg-surface/70 backdrop-blur-xl border-border/50 fixed top-0 z-50 w-full border-b transition-all'>
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
          <section className='relative flex min-h-screen flex-col items-center justify-center pt-24 pb-16 text-center'>
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-300/30 rounded-full blur-[120px] -z-10 pointer-events-none" />
            
            <div className='mx-auto w-full max-w-7xl px-6'>
              <div className='max-w-4xl mx-auto'>
                <TextDisplay className='mb-6 tracking-tighter text-slate-900 py-2 md:mb-8 text-6xl md:text-[96px] md:leading-[1.1]'>
                  Plan your <br />
                  <span className='bg-linear-to-r from-primary-500 to-blue-500 bg-clip-text text-transparent'>perfect journey</span>
                </TextDisplay>

                <TextSubheading className='text-slate-600 mb-12 mx-auto max-w-2xl leading-relaxed md:text-[24px]'>
                  Smart itineraries for the modern{' '}
                  <span className='text-primary-500 font-semibold'>local</span>{' '}
                  explorer
                </TextSubheading>

                <div className='flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150 fill-mode-both'>
                  <HeroCTA />
                </div>
              </div>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-slate-400">
              <ChevronDown size={32} />
            </div>
          </section>

          <section className='py-24 relative bg-white/40 backdrop-blur-xl border-t border-white/50 shadow-inner'>
            <div className='mx-auto max-w-7xl px-6'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                <div className='group rounded-[2.5rem] border border-white bg-white/60 p-10 shadow-xl shadow-slate-200/20 backdrop-blur-md transition-all hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2'>
                  <div className='mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110 group-hover:-rotate-3'>
                    <MessageSquare size={32} />
                  </div>
                  <TextHeading className='mb-4 text-slate-900'>
                    AI Concierge
                  </TextHeading>
                  <TextBody className='text-base leading-relaxed text-slate-500'>
                    Smart chat assistance that understands your preferences and
                    plans your day instantly.
                  </TextBody>
                </div>

                <div className='group rounded-[2.5rem] border border-white bg-white/60 p-10 shadow-xl shadow-slate-200/20 backdrop-blur-md transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2'>
                  <div className='mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/30 transition-transform group-hover:scale-110 group-hover:-rotate-3'>
                    <MapIcon size={32} />
                  </div>
                  <TextHeading className='mb-4 text-slate-900'>
                    Interactive Map
                  </TextHeading>
                  <TextBody className='text-base leading-relaxed text-slate-500'>
                    Live points of interest curated for travelers, including the
                    best food and sights.
                  </TextBody>
                </div>

                <div className='group rounded-[2.5rem] border border-white bg-white/60 p-10 shadow-xl shadow-slate-200/20 backdrop-blur-md transition-all hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2'>
                  <div className='mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition-transform group-hover:scale-110 group-hover:-rotate-3'>
                    <Compass size={32} />
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
    </>
  );
}
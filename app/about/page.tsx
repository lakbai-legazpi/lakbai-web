import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import { MarketingShell } from '@/components/marketing/MarketingShell';
import { InfoTabs } from '@/components/marketing/InfoTabs';
import { TextDisplay, TextHeading, TextBody } from '@/components/text';

export default function AboutPage() {
  return (
    <MarketingShell mainClassName='pb-24'>
      <section className='bg-primary-500 text-white'>
        <div className='mx-auto max-w-6xl px-6 py-16 md:py-20'>
          <TextDisplay className='text-4xl text-white md:text-6xl'>
            about lakbai.
          </TextDisplay>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-6 py-6'>
        <InfoTabs active='about' />
      </section>

      <section className='mx-auto max-w-4xl px-6 pb-24'>
        <div className='flex items-start gap-4'>
          <div>
            <TextHeading className='mb-4 text-slate-900'>
              Who we are...
            </TextHeading>
            <TextBody className='text-base leading-relaxed text-slate-600'>
              LAKBAI was created to make exploring local destinations easier,
              more meaningful, and more connected to the people who know them
              best. It helps travelers plan personalized trips while discovering
              places that might otherwise go unnoticed.
            </TextBody>
            <TextBody className='mt-6 text-base leading-relaxed text-slate-600'>
              At its core, LAKBAI is built with the community. Locals can share
              and update information about destinations, helping ensure that
              every journey is guided by real, up-to-date insights. By bringing
              together travelers and communities, LAKBAI aims to support local
              tourism and turn every trip into a more authentic and memorable
              experience.
            </TextBody>

            <div className='mt-10'>
              <Link
                href='/'
                className='bg-primary-500 inline-flex items-center rounded-full px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90'
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

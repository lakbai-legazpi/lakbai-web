import { MarketingShell } from '@/components/marketing/MarketingShell';
import { TextDisplay, TextHeading, TextBody } from '@/components/text';

export default function TermsPage() {
  return (
    <MarketingShell mainClassName='pb-24'>
      <section className='bg-primary-500 text-white'>
        <div className='mx-auto max-w-6xl px-6 py-16 md:py-20'>
          <TextDisplay className='text-4xl text-white md:text-6xl'>
            Terms of Service
          </TextDisplay>
          <TextBody className='mt-3 text-base text-white/90'>
            Academic Use Guidelines
          </TextBody>
        </div>
      </section>

      <section className='mx-auto max-w-4xl px-6 py-16'>
        <div className='space-y-10'>
          <div>
            <TextHeading className='text-xl text-slate-900'>
              1. Educational Purpose
            </TextHeading>
            <TextBody className='mt-3 text-base leading-relaxed text-slate-600'>
              LAKBAI is a community-based academic project. The itinerary
              generator and navigation planner are for informational purposes
              only.
            </TextBody>
          </div>

          <div>
            <TextHeading className='text-xl text-slate-900'>
              2. User Conduct
            </TextHeading>
            <TextBody className='mt-3 text-base leading-relaxed text-slate-600'>
              Users must follow our code of conduct, prioritizing respect and
              constructive engagement within the platform.
            </TextBody>
          </div>

          <div>
            <TextHeading className='text-xl text-slate-900'>
              3. Community Contributions
            </TextHeading>
            <TextBody className='mt-3 text-base leading-relaxed text-slate-600'>
              Information shared by the community should be accurate and
              respectful. LAKBAI may moderate content to maintain quality and
              safety.
            </TextBody>
          </div>

          <div>
            <TextHeading className='text-xl text-slate-900'>
              4. Availability
            </TextHeading>
            <TextBody className='mt-3 text-base leading-relaxed text-slate-600'>
              Service availability may change as part of ongoing academic
              research and development.
            </TextBody>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

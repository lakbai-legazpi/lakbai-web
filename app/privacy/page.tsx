import { MarketingShell } from '@/components/marketing/MarketingShell';
import { TextDisplay, TextHeading, TextBody } from '@/components/text';

export default function PrivacyPage() {
  return (
    <MarketingShell mainClassName='pb-24'>
      <section className='bg-primary-500 text-white'>
        <div className='mx-auto max-w-6xl px-6 py-16 md:py-20'>
          <TextDisplay className='text-4xl text-white md:text-6xl'>
            Privacy Policy
          </TextDisplay>
          <TextBody className='mt-3 text-base text-white/90'>
            Last updated: April 2026
          </TextBody>
        </div>
      </section>

      <section className='mx-auto max-w-4xl px-6 py-16'>
        <div className='space-y-10'>
          <div>
            <TextHeading className='text-xl text-slate-900'>
              Data Collection
            </TextHeading>
            <TextBody className='mt-3 text-base leading-relaxed text-slate-600'>
              As an academic project, we collect minimal data including your
              username and email to manage your itineraries. Authentication is
              handled securely through Supabase.
            </TextBody>
          </div>

          <div>
            <TextHeading className='text-xl text-slate-900'>Usage</TextHeading>
            <TextBody className='mt-3 text-base leading-relaxed text-slate-600'>
              Your location data is only used to generate routes and is not
              stored permanently. We do not sell or share personal information
              with third parties.
            </TextBody>
          </div>

          <div>
            <TextHeading className='text-xl text-slate-900'>
              Data Retention
            </TextHeading>
            <TextBody className='mt-3 text-base leading-relaxed text-slate-600'>
              We retain account data only as long as it is needed to provide the
              service or to comply with academic documentation requirements.
            </TextBody>
          </div>

          <div>
            <TextHeading className='text-xl text-slate-900'>
              Contact
            </TextHeading>
            <TextBody className='mt-3 text-base leading-relaxed text-slate-600'>
              If you have questions about this privacy policy, please contact us
              through the Contact page.
            </TextBody>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

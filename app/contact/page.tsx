import Image from 'next/image';

import { MarketingShell } from '@/components/marketing/MarketingShell';
import { InfoTabs } from '@/components/marketing/InfoTabs';
import { TextDisplay, TextHeading, TextBody } from '@/components/text';

export default function ContactPage() {
  return (
    <MarketingShell mainClassName='pb-24'>
      <section className='bg-primary-500 text-white'>
        <div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-16 md:py-20'>
          <TextDisplay className='text-4xl text-white md:text-6xl'>
            talk with us!
          </TextDisplay>
          <div className='relative hidden h-16 w-24 md:block'>
            <Image
              src='/email-white.png'
              alt='Email'
              fill
              className='object-contain'
              sizes='96px'
            />
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-6 py-6'>
        <InfoTabs active='contact' />
      </section>

      <section className='mx-auto max-w-4xl px-6 pb-24'>
        <TextHeading className='text-2xl text-slate-900 md:text-4xl'>
          Contact Us
        </TextHeading>
        <TextBody className='mt-3 text-base leading-relaxed text-slate-600'>
          Need help, have an inquiry, or want to share some feedback? Fill out
          the form below and we will be in touch soon.
        </TextBody>

        <form className='mt-10 space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className='space-y-2'>
              <TextBody className='text-sm font-semibold text-slate-700'>
                First name
              </TextBody>
              <input
                type='text'
                name='firstName'
                placeholder='First name'
                className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-white p-4 transition-all outline-none focus:ring-2'
              />
            </div>
            <div className='space-y-2'>
              <TextBody className='text-sm font-semibold text-slate-700'>
                Last name
              </TextBody>
              <input
                type='text'
                name='lastName'
                placeholder='Last name'
                className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-white p-4 transition-all outline-none focus:ring-2'
              />
            </div>
            <div className='space-y-2'>
              <TextBody className='text-sm font-semibold text-slate-700'>
                Email
              </TextBody>
              <input
                type='email'
                name='email'
                placeholder='Email'
                className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-white p-4 transition-all outline-none focus:ring-2'
              />
            </div>
            <div className='space-y-2'>
              <TextBody className='text-sm font-semibold text-slate-700'>
                Phone number
              </TextBody>
              <input
                type='tel'
                name='phone'
                placeholder='Phone number'
                className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-white p-4 transition-all outline-none focus:ring-2'
              />
            </div>
            <div className='space-y-2'>
              <TextBody className='text-sm font-semibold text-slate-700'>
                Company name and title
                <span className='ml-1 text-xs text-slate-400'>
                  (if applicable)
                </span>
              </TextBody>
              <input
                type='text'
                name='company'
                placeholder='Company name and title'
                className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-white p-4 transition-all outline-none focus:ring-2'
              />
            </div>
            <div className='space-y-2'>
              <TextBody className='text-sm font-semibold text-slate-700'>
                Reason for reaching out
              </TextBody>
              <select
                name='reason'
                className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-white p-4 text-slate-600 transition-all outline-none focus:ring-2'
                defaultValue='Need help'
              >
                <option>Need help</option>
                <option>Feedback</option>
                <option>Partnership</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className='space-y-2'>
            <TextBody className='text-sm font-semibold text-slate-700'>
              Message
            </TextBody>
            <textarea
              name='message'
              rows={5}
              placeholder='Tell us more...'
              className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-white p-4 transition-all outline-none focus:ring-2'
            />
          </div>

          <button
            type='button'
            className='bg-primary-500 inline-flex items-center justify-center rounded-full px-10 py-3 text-sm font-semibold text-white transition-all hover:opacity-90'
          >
            Send
          </button>
        </form>
      </section>
    </MarketingShell>
  );
}

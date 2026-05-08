import Image from 'next/image';
import Link from 'next/link';
import { Info } from 'lucide-react';

export default function NotFound() {
  return (
    <main className='relative min-h-screen w-full overflow-hidden'>
      <Image
        src='/art002e009288orig.jpg'
        alt='Earthset captured through the Orion spacecraft window during the Artemis II crew flyby of the Moon'
        fill
        priority
        className='object-cover'
      />

      <div className='absolute inset-0 bg-black/50' />

      <Link
        href='/chat'
        className='absolute top-5 left-5 z-20 inline-flex rounded-md p-1 transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none sm:top-8 sm:left-8'
        aria-label='Go to chat'
      >
        <Image
          src='/logos/lakbai-white.svg'
          alt='Lakbai logo'
          width={60}
          height={60}
          className='h-12 w-12 sm:h-14 sm:w-14'
        />
      </Link>

      <section className='relative z-10 flex min-h-screen items-center justify-center px-6 text-center'>
        <div className='max-w-2xl'>
          <p className='pb-8 text-8xl font-bold text-white'>404</p>
          <h1 className='mt-3 text-8xl leading-tight font-bold text-white sm:text-6xl'>
            Lost in space?
          </h1>
          <p className='mx-auto mt-5 max-w-xl text-base text-white/90 sm:text-lg'>
            It looks like you ventured a bit too far. You can get back home by
            clicking the button below
          </p>

          <div className='mt-8'>
            <Link
              href='/'
              className='bg-primary-500 hover:bg-primary-600 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors sm:text-base'
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <details className='group absolute right-5 bottom-5 z-20 sm:right-8 sm:bottom-8'>
        <summary className='inline-flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-white/30 bg-black/45 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/60 [&::-webkit-details-marker]:hidden'>
          <Info size={18} />
        </summary>
        <div className='absolute top-1/2 right-14 -translate-y-1/2 rounded-full border border-white/30 bg-black/55 px-4 py-2 text-xs whitespace-nowrap text-white shadow-lg backdrop-blur-md sm:text-sm'>
          Photo taken by{' '}
          <a
            href='https://www.nasa.gov/image-detail/art002e009288/'
            target='_blank'
            rel='noreferrer'
            className='font-semibold text-white underline decoration-white/70 underline-offset-4 transition-opacity hover:opacity-85'
          >
            NASA
          </a>
        </div>
      </details>
    </main>
  );
}

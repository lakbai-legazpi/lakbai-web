import Image from 'next/image';

import { MarketingShell } from '@/components/marketing/MarketingShell';
import { InfoTabs } from '@/components/marketing/InfoTabs';
import { TextDisplay, TextHeading, TextBody } from '@/components/text';

const teamMembers = [
  {
    name: 'Johann Reuel Buere',
    role: 'Lead Developer',
    image: '/team/johann.jpg'
  },
  {
    name: 'John Aries Brutas',
    role: 'Developer',
    image: '/team/aries.jpg'
  },
  {
    name: 'John Benedict Del Rosario',
    role: 'Developer',
    image: '/team/benedict.jpg'
  },
  {
    name: 'Christian Morga',
    role: 'Developer',
    image: '/team/christian.jpg'
  },
  {
    name: 'Jaykob Perdigon',
    role: 'Developer',
    image: '/team/jaykob.jpg'
  }
];

export default function TeamPage() {
  return (
    <MarketingShell mainClassName='pb-24'>
      <section className='bg-primary-500 text-white'>
        <div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-16 md:py-20'>
          <TextDisplay className='text-4xl text-white md:text-6xl'>
            meet the team!
          </TextDisplay>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-6 py-6'>
        <InfoTabs active='team' />
      </section>

      <section className='mx-auto max-w-4xl px-6 pb-24'>
        <TextHeading className='text-2xl text-slate-900 md:text-4xl'>
          The People Behind LAKBAI
        </TextHeading>

        <div className='mt-12 space-y-10'>
          {teamMembers.map(member => (
            <div key={member.name} className='flex items-center gap-6'>
              <div className='bg-primary-100 relative h-16 w-16 overflow-hidden rounded-2xl'>
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes='64px'
                  className='object-cover'
                />
              </div>
              <div>
                <TextHeading className='text-lg text-slate-900'>
                  {member.name}
                </TextHeading>
                <TextBody className='text-base leading-relaxed text-slate-600'>
                  {member.role}
                </TextBody>
              </div>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}

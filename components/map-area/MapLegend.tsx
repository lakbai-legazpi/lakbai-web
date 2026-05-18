import {
  MapPin,
  Utensils,
  Landmark,
  TreePine,
  Bed,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/cn';

type MapLegendProps = {
  className?: string;
};

export default function MapLegend({ className }: MapLegendProps) {
  const legendItems = [
    { label: 'Food', color: 'bg-orange-500', icon: Utensils },
    { label: 'Attractions', color: 'bg-purple-500', icon: Landmark },
    { label: 'Nature', color: 'bg-emerald-600', icon: TreePine },
    { label: 'Accommodations', color: 'bg-indigo-500', icon: Bed },
    { label: 'Malls', color: 'bg-amber-500', icon: ShoppingBag },
    { label: 'Other', color: 'bg-blue-500', icon: MapPin }
  ];

  return (
    <div
      className={cn(
        'bg-surface/95 border-border rounded-xl border p-4 shadow-md backdrop-blur-md',
        className
      )}
    >
      <h4 className='text-text-main mb-3 text-sm font-semibold'>Map Legend</h4>
      <div className='flex flex-col gap-2.5'>
        {legendItems.map(item => (
          <div key={item.label} className='flex items-center gap-3'>
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm',
                item.color
              )}
            >
              <item.icon size={12} />
            </div>
            <span className='text-text-main text-xs font-medium'>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

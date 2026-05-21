'use client';

import { useState, useMemo } from 'react';
import { Share2, Copy, Check, FileDown, Printer, X, FileText } from 'lucide-react';
import { format } from 'date-fns';

type POIAddress = {
  blockLotNumber?: string | null;
  houseNumber?: string | null;
  purok?: string | null;
  street?: string | null;
  subdivisionName?: string | null;
  barangay?: string | null;
  cityMunicipality?: string | null;
  province?: string | null;
  postalCode?: string | null;
};

type OperatingHours = {
  dayOfWeek: number;
  openTime?: string | null;
  closeTime?: string | null;
  isClosed: boolean;
  is24Hours: boolean;
};

type POILink = {
  label: string;
  url: string;
};

type POITag = {
  name: string;
};

type POI = {
  id: string;
  name: string;
  description: string;
  address?: POIAddress | null;
  operatingHours?: OperatingHours[];
  links?: POILink[];
  tags?: POITag[];
};

type ItineraryItem = {
  id: string;
  dayNumber: number | null;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  poi: POI;
};

type Journey = {
  id: string;
  title: string;
  description?: string | null;
  destination?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  isFlexibleDates: boolean;
  flexibleDays?: number | null;
  flexibleMonths?: string | null;
  itineraryItems: ItineraryItem[];
};

type ExportJourneyButtonProps = {
  journey: Journey;
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatAddress(addr?: POIAddress | null): string {
  if (!addr) return '';
  const parts = [
    addr.houseNumber || addr.blockLotNumber ? `${addr.houseNumber || ''} ${addr.blockLotNumber || ''}`.trim() : '',
    addr.purok ? `Purok ${addr.purok}` : '',
    addr.street,
    addr.subdivisionName,
    addr.barangay,
    addr.cityMunicipality,
    addr.province,
    addr.postalCode
  ].filter(Boolean);
  return parts.join(', ');
}

function formatDayOfWeek(dayNum: number): string {
  // Prisma dayOfWeek could be 0-6 or 1-7. Let's handle standard ISO or standard weekly mapping.
  return DAY_NAMES[dayNum] || `Day ${dayNum}`;
}

export default function ExportJourneyButton({ journey }: ExportJourneyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedDateRange = useMemo(() => {
    if (journey.isFlexibleDates) {
      const months = journey.flexibleMonths ? JSON.parse(journey.flexibleMonths) : [];
      const monthStr = months.length > 0 ? `Sometime in ${months.join(', ')}` : 'Flexible Dates';
      return `${monthStr} (${journey.flexibleDays || 5} Days)`;
    }

    if (journey.startDate && journey.endDate) {
      const start = new Date(journey.startDate);
      const end = new Date(journey.endDate);
      return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
    }

    return 'Dates unspecified';
  }, [journey]);

  // Formats the journey itinerary into clean markdown
  const markdownContent = useMemo(() => {
    let md = `# ${journey.title}\n`;
    if (journey.destination) {
      md += `**Destination**: ${journey.destination}\n`;
    }
    md += `**Dates**: ${formattedDateRange}\n\n`;

    if (journey.description) {
      md += `> ${journey.description}\n\n`;
    }

    md += `## Itinerary Summary\n\n`;

    // Group items by day
    const groupedItems = new Map<number, ItineraryItem[]>();
    const unscheduledItems: ItineraryItem[] = [];

    journey.itineraryItems.forEach(item => {
      if (item.dayNumber !== null) {
        const list = groupedItems.get(item.dayNumber) ?? [];
        list.push(item);
        groupedItems.set(item.dayNumber, list);
      } else {
        unscheduledItems.push(item);
      }
    });

    // Sort days
    const sortedDays = Array.from(groupedItems.keys()).sort((a, b) => a - b);

    // Format helper for items
    const formatItemMarkdown = (item: ItineraryItem, idx: number) => {
      const poi = item.poi;
      let itemMd = `${idx + 1}. `;
      
      if (item.startTime) {
        itemMd += `**[${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}]** `;
      }
      
      itemMd += `**${poi.name}**\n`;
      
      if (poi.description) {
        itemMd += `   * *Description*: ${poi.description}\n`;
      }

      const addr = formatAddress(poi.address);
      if (addr) {
        itemMd += `   * *Address*: ${addr}\n`;
      }

      if (poi.tags && poi.tags.length > 0) {
        itemMd += `   * *Tags*: ${poi.tags.map(t => t.name).join(', ')}\n`;
      }

      if (poi.operatingHours && poi.operatingHours.length > 0) {
        const hoursSummary = poi.operatingHours
          .map(h => {
            if (h.isClosed) return `${formatDayOfWeek(h.dayOfWeek)}: Closed`;
            if (h.is24Hours) return `${formatDayOfWeek(h.dayOfWeek)}: 24 Hours`;
            return `${formatDayOfWeek(h.dayOfWeek)}: ${h.openTime} - ${h.closeTime}`;
          })
          .join(', ');
        itemMd += `   * *Hours*: ${hoursSummary}\n`;
      }

      if (poi.links && poi.links.length > 0) {
        const linksStr = poi.links.map(l => `[${l.label}](${l.url})`).join(', ');
        itemMd += `   * *Links*: ${linksStr}\n`;
      }

      if (item.notes) {
        itemMd += `   * *Personal Notes*: ${item.notes}\n`;
      }

      return itemMd;
    };

    if (sortedDays.length > 0) {
      sortedDays.forEach(dayNumber => {
        md += `### Day ${dayNumber}\n\n`;
        const items = groupedItems.get(dayNumber) ?? [];
        // Sort items by time, then orderIndex
        const sortedItems = [...items].sort((a, b) => {
          if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
          if (a.startTime) return -1;
          if (b.startTime) return 1;
          return 0; // fallback to index
        });

        if (sortedItems.length === 0) {
          md += `*No items scheduled for Day ${dayNumber}.*\n\n`;
        } else {
          sortedItems.forEach((item, index) => {
            md += formatItemMarkdown(item, index);
          });
          md += `\n`;
        }
      });
    }

    if (unscheduledItems.length > 0) {
      md += `### Unscheduled Places / Ideas\n\n`;
      unscheduledItems.forEach((item, index) => {
        md += formatItemMarkdown(item, index);
      });
      md += `\n`;
    }

    md += `\n*Generated via Lakbai - AI-Powered Travel Assistant*`;
    return md;
  }, [journey, formattedDateRange]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownloadFile = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${journey.title.toLowerCase().replace(/\s+/g, '_')}_itinerary.md`;
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    setIsOpen(false);
    // Allow React to close modal before printing to keep the overlay hidden
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all hover:shadow-md cursor-pointer print:hidden"
      >
        <Share2 size={16} />
        Export Itinerary
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="bg-background border-border relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] border shadow-2xl transition-all flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="border-border flex items-center justify-between border-b px-6 py-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-950 dark:to-background">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary-50 text-primary-600 p-2 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-main">Export Travel Itinerary</h3>
                  <p className="text-[11px] text-text-muted">Choose your preferred export format</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-text-main hover:bg-surface-light rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="border-border bg-surface-light border rounded-2xl p-4 flex flex-col gap-1.5">
                <span className="text-xs text-text-muted font-medium">Journey Details</span>
                <span className="text-sm font-bold text-text-main leading-tight">{journey.title}</span>
                {journey.destination && (
                  <span className="text-xs font-semibold text-primary-600">{journey.destination}</span>
                )}
                <span className="text-xs text-text-muted">{formattedDateRange}</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Option 1: Copy Clipboard */}
                <button
                  onClick={handleCopyToClipboard}
                  className="border-border bg-background hover:bg-surface-light group flex items-center justify-between rounded-2xl border p-4 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl group-hover:scale-105 transition-transform">
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-main block">Copy to Clipboard</span>
                      <span className="text-[10px] text-text-muted block mt-0.5">Copies itinerary formatted in rich Markdown text</span>
                    </div>
                  </div>
                  {copied && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse">
                      Copied!
                    </span>
                  )}
                </button>

                {/* Option 2: Download MD */}
                <button
                  onClick={handleDownloadFile}
                  className="border-border bg-background hover:bg-surface-light group flex items-center justify-between rounded-2xl border p-4 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl group-hover:scale-105 transition-transform">
                      <FileDown size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-main block">Download Markdown file (.md)</span>
                      <span className="text-[10px] text-text-muted block mt-0.5">Save as file for offline apps like Obsidian or Notion</span>
                    </div>
                  </div>
                </button>

                {/* Option 3: Print Itinerary */}
                <button
                  onClick={handlePrint}
                  className="border-border bg-background hover:bg-surface-light group flex items-center justify-between rounded-2xl border p-4 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl group-hover:scale-105 transition-transform">
                      <Printer size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-main block">Print / Save PDF</span>
                      <span className="text-[10px] text-text-muted block mt-0.5">Opens standard print view optimized for clean reading</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-border border-t bg-slate-50 dark:bg-slate-950 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="border-border hover:bg-surface-light text-text-main border rounded-2xl px-4.5 py-2 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

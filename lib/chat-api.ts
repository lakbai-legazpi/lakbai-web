/**
 * Shared API helpers for chat operations.
 * Use these instead of inlining fetch('/api/chat', ...) calls in components.
 */

export async function createBlankChat(): Promise<{ id: string } | null> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isNewContext: true, isBlank: true })
    });
    const data = await res.json();
    return data.chat ?? null;
  } catch (e) {
    console.error('[createBlankChat] Failed:', e);
    return null;
  }
}

export async function createJourneyChat(newJourneyData: {
  destination: string;
  companions?: string;
  preferences?: string;
  budget?: number | null;
  dates?: {
    from?: string;
    to?: string;
    isFlexible?: boolean;
    days?: number;
    month?: string;
    months?: string[];
  };
}): Promise<{ chat: any; journey: any } | null> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isNewContext: true, newJourneyData })
    });
    const data = await res.json();
    return data.chat ? data : null;
  } catch (e) {
    console.error('[createJourneyChat] Failed:', e);
    return null;
  }
}

export async function linkJourneyToChat(chatId: string, newJourneyData: {
  destination: string;
  companions?: string;
  preferences?: string;
  budget?: number | null;
  dates?: {
    from?: string;
    to?: string;
    isFlexible?: boolean;
    days?: number;
    month?: string;
    months?: string[];
  };
}): Promise<{ chat: any; journey: any } | null> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isNewContext: true, updateJourneyContext: true, chatId, newJourneyData })
    });
    const data = await res.json();
    return data.chat ? data : null;
  } catch (e) {
    console.error('[linkJourneyToChat] Failed:', e);
    return null;
  }
}

export async function deleteItem(type: 'chat' | 'journey', id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/chat?type=${type}&id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.error('[deleteItem] Failed:', e);
    return false;
  }
}

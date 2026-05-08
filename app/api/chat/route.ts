import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

const DAILY_AI_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? '25');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';

const getStartOfDay = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const isRateLimited = async (userId: string) => {
  const startOfDay = getStartOfDay();
  const usageCount = await prisma.message.count({
    where: {
      role: 'user',
      createdAt: { gte: startOfDay },
      chat: { userId }
    }
  });
  return usageCount >= DAILY_AI_LIMIT;
};

const toDateOrNull = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, chatId, journeyId, isNewContext, newJourneyData } = body;

    let journey;
    let chat;
    let previousMessages: any[] = [];

    // System instruction to apply to all queries
    const systemInstruction = `
You are an expert AI Travel Planner.
Your goal is to parse user intents, provide helpful conversational responses, and seamlessly update the underlying Journey database object in the background.

Whenever you respond, you MUST output a STRICT JSON object answering to the following schema EXACTLY.
Make sure the conversational reply is inside the "aiText" field.
{
  "aiText": "A friendly conversational response to the user's request. This is what the user will read.",
  "updatedChatTitle": "A concise chat title if the chat is untitled",
  "updatedTitle": "A catchy name for the journey",
  "updatedDestination": "The main city or location (optional)",
  "updatedBudget": 500,
  "updatedStartDate": "YYYY-MM-DD (optional)",
  "updatedEndDate": "YYYY-MM-DD (optional)",
  "updatedIsFlexibleDates": false,
  "updatedFlexibleDays": 3,
  "updatedFlexibleMonths": ["January", "February"],
  "updatedCompanions": "solo | couple | family | friends (optional)",
  "updatedPreferences": "short text summary of preferences (optional)",
  "dayTitles": [
    { "dayNumber": 1, "title": "Arrival and city stroll" }
  ],
  "itinerary": [
    {
      "dayNumber": 1,
      "poiId": "string (must exactly match a provided POI ID)",
      "orderIndex": 0,
      "startTime": "09:00 (optional)",
      "endTime": "11:00 (optional)",
      "notes": "short note (optional)"
    }
  ]
}
Only output the raw JSON. Not wrapped in markdown blocks.
`;

    // 1. Initial State (isNewContext === true)
    if (isNewContext) {
      if (body.isBlank) {
        // Create an untitled blank chat WITH NO JOURNEY
        chat = await prisma.chat.create({
          data: {
            title: 'Untitled Chat',
            userId: user.id
          }
        });

        return NextResponse.json({
          chat: { ...chat, messages: [] },
          journey: null
        });
      }

      // Attach existing journey to blank chat
      if (body.attachJourneyId && body.chatId) {
        // Verify both chat and journey belong to the current user
        const targetChat = await prisma.chat.findUnique({
          where: { id: body.chatId },
          include: { messages: { orderBy: { createdAt: 'asc' } } }
        });

        if (!targetChat || targetChat.userId !== user.id) {
          return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
        }

        const targetJourney = await prisma.journey.findUnique({
          where: { id: body.attachJourneyId },
          include: {
            itineraryItems: { include: { poi: { include: { tags: { include: { cluster: true } } } } } },
            chats: { select: { id: true, title: true, createdAt: true, updatedAt: true } }
          }
        });

        if (!targetJourney || targetJourney.userId !== user.id) {
          return NextResponse.json({ error: "Journey not found or unauthorized" }, { status: 404 });
        }

        // Update chat to link to journey
        chat = await prisma.chat.update({
          where: { id: body.chatId },
          data: {
            journeyId: body.attachJourneyId,
            title: targetJourney.title
          },
          include: { messages: { orderBy: { createdAt: 'asc' } } }
        });

        journey = targetJourney;

        // Return the linked state
        return NextResponse.json({
          chat: { ...chat },
          journey: { ...journey },
          aiText: `Great! I've connected this chat to "${targetJourney.title}". We can continue planning from here!`
        });
      }

      // Traditional parameters flow via explicit newJourneyData constraints
      if (newJourneyData) {
        if (body.updateJourneyContext && body.chatId) {
          // User is filling the modal inside an existing blank chat
          journey = await prisma.journey.create({
            data: {
              title: `Journey to ${newJourneyData.destination}`,
              destination: newJourneyData.destination,
              companions: newJourneyData.companions,
              preferences: newJourneyData.preferences,
              budget: newJourneyData.budget ?? null,
              startDate: newJourneyData.dates?.from
                ? new Date(newJourneyData.dates.from)
                : null,
              endDate: newJourneyData.dates?.to
                ? new Date(newJourneyData.dates.to)
                : null,
              isFlexibleDates: newJourneyData.dates?.isFlexible || false,
              flexibleDays: newJourneyData.dates?.days ?? 5,
              flexibleMonths: newJourneyData.dates?.months
                ? JSON.stringify(newJourneyData.dates.months)
                : null,
              userId: user.id,
              days: {
                create: Array.from({ 
                  length: newJourneyData.dates?.isFlexible 
                    ? (newJourneyData.dates?.days || 0)
                    : (newJourneyData.dates?.from && newJourneyData.dates?.to 
                        ? Math.max(1, Math.ceil((new Date(newJourneyData.dates.to).getTime() - new Date(newJourneyData.dates.from).getTime()) / (1000 * 60 * 60 * 24)) + 1)
                        : 0)
                }).map((_, i) => ({
                  dayNumber: i + 1,
                  title: `Day ${i + 1}`
                }))
              }
            }
          });
          
          chat = await prisma.chat.update({
            where: { id: body.chatId },
            data: { 
              journeyId: journey.id,
              title: `Journey to ${newJourneyData.destination}` 
            }
          });
        } else {
          // Totally new context from scratch
          journey = await prisma.journey.create({
            data: {
              title: `Journey to ${newJourneyData.destination}`,
              destination: newJourneyData.destination,
              companions: newJourneyData.companions,
              preferences: newJourneyData.preferences,
              budget: newJourneyData.budget ?? null,
              startDate: newJourneyData.dates?.from
                ? new Date(newJourneyData.dates.from)
                : null,
              endDate: newJourneyData.dates?.to
                ? new Date(newJourneyData.dates.to)
                : null,
              isFlexibleDates: newJourneyData.dates?.isFlexible || false,
              flexibleDays: newJourneyData.dates?.days ?? 5,
              flexibleMonths: newJourneyData.dates?.months
                ? JSON.stringify(newJourneyData.dates.months)
                : null,
              userId: user.id,
              days: {
                create: Array.from({ 
                  length: newJourneyData.dates?.isFlexible 
                    ? (newJourneyData.dates?.days || 0)
                    : (newJourneyData.dates?.from && newJourneyData.dates?.to 
                        ? Math.max(1, Math.ceil((new Date(newJourneyData.dates.to).getTime() - new Date(newJourneyData.dates.from).getTime()) / (1000 * 60 * 60 * 24)) + 1)
                        : 0)
                }).map((_, i) => ({
                  dayNumber: i + 1,
                  title: `Day ${i + 1}`
                }))
              }
            }
          });
          
          chat = await prisma.chat.create({
            data: {
              journeyId: journey.id,
              title: `Journey to ${newJourneyData.destination}`,
              userId: user.id,
            }
          });
        }

        return NextResponse.json({
          chat,
          journey
        });
      }
    }

    // 2. Continuing an existing chat
    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
    }

    chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    if (!journeyId) {
      if (!message || !message.trim()) {
        return NextResponse.json({ error: 'Missing message' }, { status: 400 });
      }

      if (await isRateLimited(user.id)) {
        return NextResponse.json(
          {
            error: 'Daily AI limit reached. Please try again tomorrow.',
            rateLimited: true
          },
          { status: 429 }
        );
      }

      await prisma.message.create({
        data: { chatId: chat.id, role: 'user', content: message }
      });

      let pois = await prisma.pOI.findMany({
        include: {
          tags: { select: { name: true, cluster: { select: { name: true } } } }
        },
        take: 40
      });

      const contextPois = pois.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        tags: p.tags.map(tag => ({
          name: tag.name,
          cluster: tag.cluster?.name ?? null
        }))
      }));

      const newJourneyPrompt = `
${systemInstruction}

You are creating a NEW journey from scratch.
Use the POI list below as the only valid POI choices.
If the user does not specify dates, you can propose a reasonable multi-day plan.
If the user does not specify a destination, infer one from the POIs and explain in aiText.

User message: "${message}"

Available POIs:
${JSON.stringify(contextPois)}

Return a helpful aiText and a full itinerary.
`;

      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Missing GEMINI_API_KEY' },
          { status: 500 }
        );
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const result = await genAI
        .getGenerativeModel({ model: GEMINI_MODEL })
        .generateContent(newJourneyPrompt);
      const resText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

      let aiData: any;
      try {
        aiData = JSON.parse(resText);
      } catch {
        aiData = {
          aiText:
            'I can build a full itinerary, but I need a destination and a few preferences. Where should we start?',
          itinerary: []
        };
      }

      const destination = aiData.updatedDestination || null;
      const journeyTitle =
        aiData.updatedTitle ||
        (destination ? `Journey to ${destination}` : 'Lakbai Journey');

      const startDate = toDateOrNull(aiData.updatedStartDate);
      const endDate = toDateOrNull(aiData.updatedEndDate);

      const isFlexibleDates =
        typeof aiData.updatedIsFlexibleDates === 'boolean'
          ? aiData.updatedIsFlexibleDates
          : !startDate || !endDate;

      const flexibleDays =
        typeof aiData.updatedFlexibleDays === 'number'
          ? aiData.updatedFlexibleDays
          : null;

      const flexibleMonths = Array.isArray(aiData.updatedFlexibleMonths)
        ? JSON.stringify(aiData.updatedFlexibleMonths)
        : null;

      const itinerary = Array.isArray(aiData.itinerary)
        ? aiData.itinerary
        : [];

      const maxDayFromItinerary = itinerary.reduce(
        (max: number, item: any) => Math.max(max, item.dayNumber || 0),
        0
      );

      const derivedDayCount = isFlexibleDates
        ? flexibleDays || Math.max(1, maxDayFromItinerary || 1)
        : startDate && endDate
          ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
          : Math.max(1, maxDayFromItinerary || 1);

      journey = await prisma.journey.create({
        data: {
          title: journeyTitle,
          destination,
          companions: aiData.updatedCompanions || null,
          preferences: aiData.updatedPreferences || null,
          budget: typeof aiData.updatedBudget === 'number' ? aiData.updatedBudget : null,
          startDate,
          endDate,
          isFlexibleDates,
          flexibleDays: flexibleDays ?? null,
          flexibleMonths,
          userId: user.id,
          days: {
            create: Array.from({ length: derivedDayCount }).map((_, i) => ({
              dayNumber: i + 1,
              title: `Day ${i + 1}`
            }))
          }
        }
      });

      const validPoiIds = new Set(contextPois.map(poi => poi.id));
      for (const item of itinerary) {
        if (!item.poiId || !validPoiIds.has(item.poiId)) continue;
        await prisma.itineraryItem.create({
          data: {
            journeyId: journey.id,
            poiId: item.poiId,
            dayNumber: item.dayNumber ?? null,
            orderIndex: item.orderIndex ?? 0,
            startTime: item.startTime ?? null,
            endTime: item.endTime ?? null,
            notes: item.notes ?? null
          }
        });
      }

      const dayTitles = Array.isArray(aiData.dayTitles) ? aiData.dayTitles : [];
      for (const dayTitle of dayTitles) {
        if (!dayTitle?.dayNumber) continue;
        await prisma.journeyDay.updateMany({
          where: { journeyId: journey.id, dayNumber: dayTitle.dayNumber },
          data: { title: dayTitle.title || `Day ${dayTitle.dayNumber}` }
        });
      }

      const updatedChatTitle =
        aiData.updatedChatTitle ||
        (chat.title.toLowerCase().includes('untitled') ? journeyTitle : null);

      chat = await prisma.chat.update({
        where: { id: chat.id },
        data: {
          journeyId: journey.id,
          ...(updatedChatTitle ? { title: updatedChatTitle } : {})
        }
      });

      if (aiData.aiText) {
        await prisma.message.create({
          data: { chatId: chat.id, role: 'ai', content: aiData.aiText }
        });
      }

      const updatedJourney = await prisma.journey.findUnique({
        where: { id: journey.id },
        include: {
          days: { orderBy: { dayNumber: 'asc' } },
          itineraryItems: {
            include: { poi: { include: { tags: { include: { cluster: true } } } } },
            orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }]
          }
        }
      });

      const updatedChat = await prisma.chat.findUnique({
        where: { id: chat.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });

      return NextResponse.json({
        journey: updatedJourney,
        chat: updatedChat,
        aiText: aiData.aiText
      });
    }

    journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: {
        days: { orderBy: { dayNumber: 'asc' } },
        itineraryItems: { include: { poi: { include: { tags: { include: { cluster: true } } } } } }
      }
    });

    if (!journey || journey.userId !== user.id) {
      return NextResponse.json({ error: 'Journey not found or unauthorized' }, { status: 404 });
    }

    if (await isRateLimited(user.id)) {
      return NextResponse.json(
        {
          error: 'Daily AI limit reached. Please try again tomorrow.',
          rateLimited: true
        },
        { status: 429 }
      );
    }

    // Save the incoming user message to memory immediately
    await prisma.message.create({
      data: { chatId: chat.id, role: 'user', content: message }
    });

    // Formatting Context POIs
    let pois = await prisma.pOI.findMany({
      where: journey.destination ? {
        OR: [
          { address: { cityMunicipality: { contains: journey.destination, mode: 'insensitive' } } },
          { address: { province: { contains: journey.destination, mode: 'insensitive' } } },
          { name: { contains: journey.destination, mode: 'insensitive' } }
        ]
      } : {},
      include: {
        tags: { select: { name: true, cluster: { select: { name: true } } } }
      },
      take: 20
    });
    if (pois.length === 0) {
      pois = await prisma.pOI.findMany({
        include: {
          tags: { select: { name: true, cluster: { select: { name: true } } } }
        },
        take: 20
      });
    }
    const contextPois = pois.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      tags: p.tags.map(tag => ({
        name: tag.name,
        cluster: tag.cluster?.name ?? null
      }))
    }));

    // Prepare History Array
    const history = chat.messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY' },
        { status: 500 }
      );
    }
    const genAI = new GoogleGenerativeAI(apiKey);
     const chatSession = genAI.getGenerativeModel({ model: GEMINI_MODEL }).startChat({
       history: history
    });

    const activePrompt = `
${systemInstruction}

Current Live Journey State:
Chat title: ${chat.title}
Journey title: ${journey.title}
Destination: ${journey.destination}
Budget: ${journey.budget}
Companions: ${journey.companions ?? 'Unknown'}
Preferences: ${journey.preferences ?? 'None provided'}
Dates: ${journey.startDate ? journey.startDate.toISOString() : 'N/A'} to ${journey.endDate ? journey.endDate.toISOString() : 'N/A'}
Flexible Dates: ${journey.isFlexibleDates ? 'Yes' : 'No'}
Flexible Days: ${journey.flexibleDays ?? 'N/A'}
Flexible Months: ${journey.flexibleMonths ?? 'N/A'}
Days: ${JSON.stringify(journey.days.map(day => ({ dayNumber: day.dayNumber, title: day.title })))}
Current Itinerary Setup: ${JSON.stringify(journey.itineraryItems.map(i => ({ day: i.dayNumber, poiId: i.poiId, poi: i.poi.name, startTime: i.startTime, endTime: i.endTime, notes: i.notes })))}

Available POIs in database for this region:
${JSON.stringify(contextPois)}

User's Latest Message: "${message}"

Update the journey as requested by the user, and respond to them!
`;

    const result = await chatSession.sendMessage(activePrompt);
    const resText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    let aiData;
    try {
      aiData = JSON.parse(resText);
    } catch {
      console.error('Failed to parse AI JSON', resText);
       // Emergency fallback message
       aiData = { aiText: resText, itinerary: null };
    }

    // Apply DB Updates
    const journeyUpdates: {
      budget?: number | null;
      title?: string;
      destination?: string | null;
      startDate?: Date | null;
      endDate?: Date | null;
      isFlexibleDates?: boolean;
      flexibleDays?: number | null;
      flexibleMonths?: string | null;
      companions?: string | null;
      preferences?: string | null;
    } = {};

    if (aiData.updatedBudget !== undefined) {
      journeyUpdates.budget = aiData.updatedBudget;
    }
    if (aiData.updatedTitle) {
      journeyUpdates.title = aiData.updatedTitle;
    }
    if (aiData.updatedDestination) {
      journeyUpdates.destination = aiData.updatedDestination;
    }
    if (aiData.updatedStartDate) {
      journeyUpdates.startDate = toDateOrNull(aiData.updatedStartDate);
    }
    if (aiData.updatedEndDate) {
      journeyUpdates.endDate = toDateOrNull(aiData.updatedEndDate);
    }
    if (typeof aiData.updatedIsFlexibleDates === 'boolean') {
      journeyUpdates.isFlexibleDates = aiData.updatedIsFlexibleDates;
    }
    if (typeof aiData.updatedFlexibleDays === 'number') {
      journeyUpdates.flexibleDays = aiData.updatedFlexibleDays;
    }
    if (Array.isArray(aiData.updatedFlexibleMonths)) {
      journeyUpdates.flexibleMonths = JSON.stringify(aiData.updatedFlexibleMonths);
    }
    if (aiData.updatedCompanions !== undefined) {
      journeyUpdates.companions = aiData.updatedCompanions;
    }
    if (aiData.updatedPreferences !== undefined) {
      journeyUpdates.preferences = aiData.updatedPreferences;
    }

    const dayTitles = Array.isArray(aiData.dayTitles) ? aiData.dayTitles : [];
    const itineraryItems = Array.isArray(aiData.itinerary) ? aiData.itinerary : [];
    const maxDayFromTitles = dayTitles.reduce(
      (max: number, item: any) => Math.max(max, item.dayNumber || 0),
      0
    );
    const maxDayFromItinerary = itineraryItems.reduce(
      (max: number, item: any) => Math.max(max, item.dayNumber || 0),
      0
    );
    const currentMaxDay = journey.days.reduce(
      (max, day) => Math.max(max, day.dayNumber),
      0
    );
    const targetMaxDay = Math.max(currentMaxDay, maxDayFromTitles, maxDayFromItinerary);

    if (targetMaxDay > currentMaxDay) {
      await prisma.journeyDay.createMany({
        data: Array.from({ length: targetMaxDay - currentMaxDay }).map((_, i) => ({
          journeyId: journey.id,
          dayNumber: currentMaxDay + i + 1,
          title: `Day ${currentMaxDay + i + 1}`
        }))
      });
    }

    for (const dayTitle of dayTitles) {
      if (!dayTitle?.dayNumber) continue;
      await prisma.journeyDay.updateMany({
        where: { journeyId: journey.id, dayNumber: dayTitle.dayNumber },
        data: { title: dayTitle.title || `Day ${dayTitle.dayNumber}` }
      });
    }

    if (Object.keys(journeyUpdates).length > 0) {
      await prisma.journey.update({
        where: { id: journey.id },
        data: journeyUpdates
      });
    }

    // Refresh Itinerary
    if (Array.isArray(aiData.itinerary)) {
      await prisma.itineraryItem.deleteMany({ where: { journeyId: journey.id } });
      const validPoiIds = new Set(contextPois.map(poi => poi.id));
      for (const item of itineraryItems) {
        if (!item.poiId || !validPoiIds.has(item.poiId)) continue;
        await prisma.itineraryItem.create({
          data: {
            journeyId: journey.id,
            poiId: item.poiId,
            dayNumber: item.dayNumber ?? null,
            orderIndex: item.orderIndex ?? 0,
            startTime: item.startTime ?? null,
            endTime: item.endTime ?? null,
            notes: item.notes ?? null,
          }
        });
      }
    }

    const shouldRename = chat.title.toLowerCase().includes('untitled');
    const nextChatTitle =
      aiData.updatedChatTitle ||
      (shouldRename && aiData.updatedTitle ? aiData.updatedTitle : null);
    if (nextChatTitle) {
      await prisma.chat.update({
        where: { id: chat.id },
        data: { title: nextChatTitle }
      });
    }

    // Save AI Message
    if (aiData.aiText) {
      await prisma.message.create({
        data: { chatId: chat.id, role: 'ai', content: aiData.aiText }
      });
    }

    const updatedJourney = await prisma.journey.findUnique({
      where: { id: journey.id },
      include: {
        days: { orderBy: { dayNumber: 'asc' } },
        itineraryItems: {
          include: { poi: { include: { tags: { include: { cluster: true } } } } },
          orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }]
        }
      }
    });
    
    const updatedChat = await prisma.chat.findUnique({
      where: { id: chat.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    return NextResponse.json({ journey: updatedJourney, chat: updatedChat });
  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Failed to process AI" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    let journey = chat.journeyId
      ? await prisma.journey.findUnique({
          where: { id: chat.journeyId },
          include: {
            days: { orderBy: { dayNumber: 'asc' } },
            itineraryItems: {
              include: { poi: { include: { tags: { include: { cluster: true } } } } },
              orderBy: [{ dayNumber: 'asc' }, { startTime: 'asc' }, { orderIndex: 'asc' }]
            },
            chats: {
              where: { id: { not: chat.id } }, // Exclude current chat
              select: { id: true, title: true, createdAt: true, updatedAt: true }
            }
          }
        })
      : null;

    // Backward compatibility for old journeys without JourneyDay records
    if (journey && journey.days.length === 0) {
      let numDays = 0;
      if (journey.isFlexibleDates) {
        numDays = journey.flexibleDays || 5;
      } else if (journey.startDate && journey.endDate) {
        numDays = Math.max(1, Math.ceil((new Date(journey.endDate).getTime() - new Date(journey.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      } else {
        numDays = journey.itineraryItems.reduce((max, item) => Math.max(max, item.dayNumber || 0), 1);
      }

      if (numDays > 0) {
        const newDays = await Promise.all(
          Array.from({ length: numDays }).map((_, i) => 
            prisma.journeyDay.create({
              data: {
                journeyId: journey.id,
                dayNumber: i + 1,
                title: `Day ${i + 1}`
              }
            })
          )
        );
        journey.days = newDays;
      }
    }

    return NextResponse.json({ chat, journey });
  } catch (error) {
    console.error("GET Chat Error:", error);
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
    }

    if (type === 'chat') {
      await prisma.chat.delete({ where: { id } });
    } else if (type === 'journey') {
      await prisma.journey.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const body = await request.json();
    const { title } = body;

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (type === 'chat') {
      await prisma.chat.update({
        where: { id },
        data: { title: title.trim() }
      });
    } else if (type === 'journey') {
      await prisma.journey.update({
        where: { id },
        data: { title: title.trim() }
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

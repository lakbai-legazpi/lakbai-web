import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
  "updatedTitle": "A catchy name for the journey",
  "updatedDestination": "The main city or location (optional)",
  "updatedBudget": 500,
  "itinerary": [
    {
      "dayNumber": 1,
      "poiId": "string (must exactly match a provided POI ID)",
      "orderIndex": 0
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
            title: "Untitled Chat",
            userId: user?.id ?? null
          }
        });
        const initGreeting = "Hi! I'm your AI Travel Assistant. Where would you like to explore today?";
        await prisma.message.create({
          data: { chatId: chat.id, role: 'ai', content: initGreeting }
        });
        
        return NextResponse.json({ 
           chat: { ...chat, messages: [{ role: 'ai', content: initGreeting }] }, 
           journey: null,
           aiText: initGreeting
        });
      }

      // Traditional parameters flow via explicit newJourneyData constraints
      if (newJourneyData) {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
        
        if (body.updateJourneyContext && body.chatId) {
          // User is filling the modal inside an existing blank chat
          journey = await prisma.journey.create({
            data: {
              title: `Trip to ${newJourneyData.destination}`,
              destination: newJourneyData.destination,
              companions: newJourneyData.companions,
              preferences: newJourneyData.preferences,
              budget: 0,
              startDate: newJourneyData.dates?.isFlexible
                ? null
                : newJourneyData.dates?.from
                  ? new Date(newJourneyData.dates.from)
                  : null,
              endDate: newJourneyData.dates?.isFlexible
                ? null
                : newJourneyData.dates?.to
                  ? new Date(newJourneyData.dates.to)
                  : null,
              isFlexibleDates: newJourneyData.dates?.isFlexible || false,
              flexibleDays: newJourneyData.dates?.isFlexible ? newJourneyData.dates.days : null,
              flexibleMonths: newJourneyData.dates?.isFlexible && newJourneyData.dates.months 
                ? JSON.stringify(newJourneyData.dates.months) 
                : null,
              userId: user?.id ?? null,
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
              title: `Trip to ${newJourneyData.destination}` 
            }
          });
        } else {
          // Totally new context from scratch
          journey = await prisma.journey.create({
            data: {
              title: `Trip to ${newJourneyData.destination}`,
              destination: newJourneyData.destination,
              companions: newJourneyData.companions,
              preferences: newJourneyData.preferences,
              budget: 0,
              startDate: newJourneyData.dates?.isFlexible
                ? null
                : newJourneyData.dates?.from
                  ? new Date(newJourneyData.dates.from)
                  : null,
              endDate: newJourneyData.dates?.isFlexible
                ? null
                : newJourneyData.dates?.to
                  ? new Date(newJourneyData.dates.to)
                  : null,
              isFlexibleDates: newJourneyData.dates?.isFlexible || false,
              flexibleDays: newJourneyData.dates?.isFlexible ? newJourneyData.dates.days : null,
              flexibleMonths: newJourneyData.dates?.isFlexible && newJourneyData.dates.months 
                ? JSON.stringify(newJourneyData.dates.months) 
                : null,
              userId: user?.id ?? null,
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
              title: `Trip to ${newJourneyData.destination}`,
              userId: user?.id ?? null,
            }
          });
        }

        const initPrompt = `
        ${systemInstruction}
        
        The user just created a new journey with these explicit parameters:
        Destination: ${newJourneyData.destination}
        Companions: ${newJourneyData.companions}
        Preferences: ${newJourneyData.preferences}
        Dates Flexible: ${newJourneyData.dates?.isFlexible}
        
        Do not build the full itinerary yet. Return an empty itinerary for now, just establish the updatedTitle and updatedDestination. Fill aiText with an enthusiastic outgoing greeting acknowledging their constraints and asking what kinds of experiences they are initially looking for in ${newJourneyData.destination}!
        `;
        
        const result = await model.generateContent(initPrompt);
        const resText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        let aiData;
        try {
          aiData = JSON.parse(resText);
        } catch (e) {
          aiData = { aiText: "Let's plan your trip! What kind of places do you want to visit?", updatedTitle: journey.title };
        }

        const aiMsg = await prisma.message.create({
          data: { chatId: chat.id, role: 'ai', content: aiData.aiText }
        });
        
        return NextResponse.json({ 
           chat: { ...chat, messages: [{ role: 'ai', content: aiData.aiText }] }, 
           journey,
           aiText: aiData.aiText
        });
      }
    }

    // 2. Continuing an existing chat
    if (!chatId || !journeyId) {
      return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
    }

    journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: { itineraryItems: { include: { poi: { include: { tags: { include: { cluster: true } } } } } } }
    });
    
    chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!journey || !chat) return NextResponse.json({ error: "Data not found" }, { status: 404 });

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
      take: 20
    });
    if (pois.length === 0) pois = await prisma.pOI.findMany({ take: 20 });
    const contextPois = pois.map(p => ({ id: p.id, name: p.name, description: p.description }));

    // Prepare History Array
    const history = chat.messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const chatSession = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" }).startChat({
       history: history
    });

    const activePrompt = `
      ${systemInstruction}
      
      Current Live Journey State:
      Destination: ${journey.destination}
      Budget: ${journey.budget}
      Current Itinerary Setup: ${JSON.stringify(journey.itineraryItems.map(i => ({ day: i.dayNumber, poi: i.poi.name, startTime: i.startTime, endTime: i.endTime })))}
      
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
    if (aiData.updatedBudget || aiData.updatedTitle) {
      await prisma.journey.update({
        where: { id: journey.id },
        data: {
          budget: aiData.updatedBudget || journey.budget,
          title: aiData.updatedTitle || journey.title,
        }
      });
    }

    // Refresh Itinerary
    if (aiData.itinerary && Array.isArray(aiData.itinerary)) {
      await prisma.itineraryItem.deleteMany({ where: { journeyId: journey.id } });
      for (const item of aiData.itinerary) {
        if (!item.poiId) continue;
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

    // Save AI Message
    if (aiData.aiText) {
      await prisma.message.create({
        data: { chatId: chat.id, role: 'ai', content: aiData.aiText }
      });
    }

    const updatedJourney = await prisma.journey.findUnique({
      where: { id: journey.id },
      include: {
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

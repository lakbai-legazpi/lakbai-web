import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GROQ_API_KEY' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing audio file.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Audio file exceeds 25MB limit.' },
        { status: 413 }
      );
    }

    const outgoing = new FormData();
    outgoing.append('file', file);
    outgoing.append(
      'model',
      process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo'
    );
    outgoing.append('response_format', 'json');
    outgoing.append('temperature', '0');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: outgoing
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : { text: await response.text() };

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.error?.message || 'Transcription failed.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ text: payload.text || '' });
  } catch (error) {
    console.error('Groq STT error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio.' },
      { status: 500 }
    );
  }
}

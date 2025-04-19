import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Add runtime configuration for Edge
export const runtime = 'edge';

// Initialize OpenAI with error handling
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that helps users manage their tasks and todo lists. Provide clear, concise responses."
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.5,
    });

    // Validate OpenAI response
    if (!response.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    return NextResponse.json({
      content: response.choices[0].message.content,
      role: 'assistant'
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return appropriate error message based on error type
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { query, pdfId } = await req.json();

    if (!query || !pdfId) {
      return NextResponse.json({ error: 'Missing query or pdfId' }, { status: 400 });
    }

    // 🔍 1. Fetch document by ID
    const docRef = doc(collection(db, 'uploads'), pdfId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    const pdfData = docSnap.data();
    const extractedText = pdfData.text;
    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({ response: "This PDF does not contain extractable text." });
    }

    // 🧠 2. Construct prompt
    const prompt = `
You are a helpful assistant. Use the following document content to answer the question.

Document content:
"""
${extractedText.slice(0, 4000)} 
"""

Question:
${query}

Answer:
`;

    // 🤖 3. Send to Groq (LLaMA3)
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // or your preferred Groq model
        messages: [
          { role: 'system', content: 'You are an expert AI tutor assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        
      })
      // log first 500 chars
    });

    const groqData = await groqRes.json();

    const reply = groqData?.choices?.[0]?.message?.content?.trim() ?? '[No response returned from LLM]';
    if (!reply) {
      console.warn("LLM returned an empty response.");
    }

    return NextResponse.json({ response: reply });
    console.log('Groq full response:', JSON.stringify(groqData, null, 2));

  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  
}
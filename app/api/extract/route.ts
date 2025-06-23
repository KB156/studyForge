// app/api/extract/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, getDoc, doc, updateDoc } from 'firebase/firestore';
import fetch from 'node-fetch';
const pdfParse = require('pdf-parse');

import { db } from '@/lib/firebase';



export async function POST(req: NextRequest) {
  try {
    const { pdfId } = await req.json();
    if (!pdfId) return NextResponse.json({ error: 'Missing PDF ID' }, { status: 400 });

    const pdfRef = doc(db, 'uploads', pdfId);
    const pdfSnap = await getDoc(pdfRef);
    if (!pdfSnap.exists()) return NextResponse.json({ error: 'PDF not found' }, { status: 404 });

    const { url: pdfUrl } = pdfSnap.data();
    if (!pdfUrl) return NextResponse.json({ error: 'PDF URL missing' }, { status: 400 });

    const res = await fetch(pdfUrl);
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 });

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("📥 PDF buffer size:", buffer.length);

    const data = await pdfParse(buffer); // ✅ only pass buffer
    const extractedText = data.text || "";

    await updateDoc(pdfRef, { extractedText });

    return NextResponse.json({ success: true, textLength: extractedText.length });
  } catch (err: any) {
    console.error("❌ Extraction error:", err.message || err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
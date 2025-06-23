// ✅ CORRECT: DO NOT import NextRequest here!
import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// ✅ Initialize Firebase only once
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

// ✅ CORRECT signature for App Router dynamic API routes:
export async function GET(
  request: Request,                     // ✅ standard Web Request
  { params }: { params: { pdfId: string } }  // ✅ destructure params
) {
  const { pdfId } = params;

  try {
    const doc = await db.collection("uploads").doc(pdfId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    const data = doc.data();
    return NextResponse.json({ url: data?.url || null });  // ✅ matches client expectation
  } catch (error) {
    console.error("Error fetching PDF:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

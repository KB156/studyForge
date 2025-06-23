// app/api/saveMetadata/route.ts
import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
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

export async function POST(req: Request) {
  try {
    const { url, userId, fileName } = await req.json();

    // Validate required fields
    if (!url || !userId || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields: url, userId, fileName" }, 
        { status: 400 }
      );
    }

    console.log('Saving metadata:', { url, userId, fileName });

    // Save to Firestore and get the document reference
    const docRef = await db.collection('uploads').add({
      url: url, // Changed from 'url' to 'pdfUrl' to match PDF route
      userId,
      filename: fileName, // Changed from 'fileName' to 'filename' for consistency
      uploadedAt: new Date().toISOString(),
    });

    // Return the document ID so it can be used for navigation
    return NextResponse.json({ 
      success: true, 
      documentId: docRef.id,
      message: "Metadata saved successfully"
    });

  } catch (error) {
    console.error('Error saving metadata:', error);
    return NextResponse.json(
      { error: 'Failed to save metadata' }, 
      { status: 500 }
    );
  }
}
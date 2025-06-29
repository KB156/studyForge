import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pdfId = url.pathname.split("/").pop(); // or extract from regex if needed

  if (!pdfId) {
    return NextResponse.json({ error: "Missing PDF ID" }, { status: 400 });
  }

  try {
    const docRef = doc(db, "uploads", pdfId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    const data = docSnap.data();
    return NextResponse.json({ url: data?.url || null });
  } catch (err) {
    console.error("Error fetching PDF:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
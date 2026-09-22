// app/api/debug/meals/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const meals = db.prepare("SELECT id, slug, title FROM meals").all();
    return NextResponse.json({ meals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
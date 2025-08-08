import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ ok: true, ai: !!process.env.OPENAI_API_KEY });
}

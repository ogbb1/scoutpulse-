import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ ok: true, found: Math.floor(Math.random()*5) + 1 });
}

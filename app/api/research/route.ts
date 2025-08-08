import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: false, error: "no_key" }, { status: 503 });
  }
  const { domain } = await req.json().catch(() => ({}));
  if (!domain) return NextResponse.json({ ok: false, error: "no_domain" }, { status: 400 });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: "You are a sales research assistant. Return a concise bullet list of actionable, non-fluffy findings relevant to payroll/HR switch timing and competitive context." },
      { role: "user", content: `Company domain: ${domain}\nReturn 3-6 bullets. Prefer hiring pages, state compliance pages (esp. IL), and vendor mentions.` }
    ],
  });

  const text = r.choices?.[0]?.message?.content ?? "";
  const results = text.split("\n").map(s => s.replace(/^[-•]\s?/, "").trim()).filter(Boolean).slice(0, 8);
  return NextResponse.json({ ok: true, results });
}

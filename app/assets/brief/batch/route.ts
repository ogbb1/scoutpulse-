import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ ok: false, error: "no_key" }, { status: 503 });
  const { accounts } = await req.json().catch(() => ({ accounts: [] as Array<{name:string;domain?:string;score?:number}> }));
  if (!Array.isArray(accounts) || accounts.length === 0) return NextResponse.json({ ok: false, error: "no_accounts" }, { status: 400 });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `Create one outreach brief per account. For each:
  - 2-line context (why-now)
  - 3 tailored talking points
  - 1 opener line.
  Accounts:
  ${accounts.slice(0,5).map(a=>`• ${a.name} (${a.domain||""}) score:${a.score ?? "–"}`).join("\n")}`;

  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [{ role: "system", content: "You create crisp, sales-ready briefs." }, { role: "user", content: prompt }],
  });

  const text = r.choices?.[0]?.message?.content ?? "";
  return NextResponse.json({ ok: true, jobId: `briefs_${Date.now()}`, text });
}

import { NextResponse } from "next/server";
import { askZhida, ZhidaError } from "@/src/domain/zhida";

export async function GET() {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  try {
    const content = await askZhida("You are a formatter. Follow the user's requested output format exactly.", "请只输出这一个 JSON 对象，不要解释、不要 Markdown：{\"ok\":true}");
    return NextResponse.json({ connected: true, normalized: content.trim().slice(0, 80) });
  } catch (error) {
    return NextResponse.json({ connected: false, error: error instanceof ZhidaError ? error.code : "ZHIDA_HEALTH_FAILED" }, { status: 502 });
  }
}

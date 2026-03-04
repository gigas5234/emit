import { NextResponse } from "next/server";
import { getShareSummary } from "../../_lib/share-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const payload = getShareSummary(id);
  if (!payload) {
    return NextResponse.json({ error: "summary not found" }, { status: 404 });
  }
  return NextResponse.json(payload);
}


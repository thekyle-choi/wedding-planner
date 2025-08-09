import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

const redis = Redis.fromEnv()

export async function GET() {
  try {
    const data = await redis.get("wedding:schedule")
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Failed to get schedule data:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    await redis.set("wedding:schedule", data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save schedule data:", error)
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
  }
}

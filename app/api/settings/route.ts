import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

const redis = Redis.fromEnv()

export async function GET() {
  try {
    const data = await redis.get("wedding:settings")
    return NextResponse.json(data || null)
  } catch (error) {
    console.error("Failed to get settings data:", error)
    return NextResponse.json(null, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    await redis.set("wedding:settings", data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save settings data:", error)
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
  }
}

import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

const redis = Redis.fromEnv()

export async function GET() {
  try {
    const data = await redis.get("wedding:budget")
    // Return empty array if no data exists
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Failed to get budget data:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    // Ensure data is an array before saving
    const budgetData = Array.isArray(data) ? data : []
    await redis.set("wedding:budget", budgetData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save budget data:", error)
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
  }
}

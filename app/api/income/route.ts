import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"
import type { IncomeDatabase } from "@/lib/income-types-simple"
import { createEmptyIncomeDatabase } from "@/lib/income-types-simple"

const redis = Redis.fromEnv()

export async function GET() {
  try {
    const data = await redis.get("wedding:income-simple")
    // Return empty database if no data exists
    return NextResponse.json(data || createEmptyIncomeDatabase())
  } catch (error) {
    console.error("Failed to get income data:", error)
    return NextResponse.json(createEmptyIncomeDatabase(), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate data structure
    if (!data || typeof data !== 'object' || !data.groups) {
      return NextResponse.json({ error: "Invalid data structure" }, { status: 400 })
    }

    // Ensure required fields exist
    const incomeDatabase: IncomeDatabase = {
      currentGroupId: data.currentGroupId || null,
      groups: data.groups || {},
    }

    await redis.set("wedding:income-simple", incomeDatabase)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save income data:", error)
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
  }
}
import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

const redis = Redis.fromEnv()
const SUBSCRIPTIONS_KEY = "wedding:subscriptions"

type ApplyStatus = "예정" | "접수중" | "마감" | "발표대기" | "발표완료"

type SubscriptionItem = {
  id: string
  type: string // 청약 유형
  name: string // 단지명/청약명
  location: string // 위치
  applyDate: string // 접수일
  applyStatus: ApplyStatus // 접수 상태
  announceDate?: string // 발표일
  link?: string // 관련 링크
  memo?: string // 메모
  createdAt: number
  updatedAt: number
}

export async function GET() {
  try {
    const data = await redis.get<any[]>(SUBSCRIPTIONS_KEY)
    const list = Array.isArray(data) ? data : []
    const normalized: SubscriptionItem[] = list
      .map((item) => {
        const applyStatus: ApplyStatus = ["예정", "접수중", "마감", "발표대기", "발표완료"].includes(item?.applyStatus)
          ? item.applyStatus
          : "예정"
        return {
          id: typeof item?.id === "string" ? item.id : crypto.randomUUID(),
          type: typeof item?.type === "string" ? item.type : "",
          name: typeof item?.name === "string" ? item.name : "",
          location: typeof item?.location === "string" ? item.location : "",
          applyDate: typeof item?.applyDate === "string" ? item.applyDate : "",
          applyStatus,
          announceDate: typeof item?.announceDate === "string" ? item.announceDate : undefined,
          link: typeof item?.link === "string" ? item.link : undefined,
          memo: typeof item?.memo === "string" ? item.memo : undefined,
          createdAt: typeof item?.createdAt === "number" ? item.createdAt : Date.now(),
          updatedAt: typeof item?.updatedAt === "number" ? item.updatedAt : Date.now(),
        }
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)

    return NextResponse.json(normalized)
  } catch (error) {
    console.error("Failed to get subscription items:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { id, type, name, location, applyDate, applyStatus, announceDate, link, memo } = payload || {}

    const validApplyStatus: ApplyStatus = ["예정", "접수중", "마감", "발표대기", "발표완료"].includes(applyStatus)
      ? applyStatus
      : "예정"

    const now = Date.now()
    const newItem: SubscriptionItem = {
      id: id || crypto.randomUUID(),
      type: typeof type === "string" ? type : "",
      name: typeof name === "string" ? name : "",
      location: typeof location === "string" ? location : "",
      applyDate: typeof applyDate === "string" ? applyDate : "",
      applyStatus: validApplyStatus,
      announceDate: typeof announceDate === "string" ? announceDate : undefined,
      link: typeof link === "string" ? link : undefined,
      memo: typeof memo === "string" ? memo : undefined,
      createdAt: now,
      updatedAt: now,
    }

    const existing = await redis.get<SubscriptionItem[]>(SUBSCRIPTIONS_KEY)
    const list = Array.isArray(existing) ? existing : []
    list.unshift(newItem)
    await redis.set(SUBSCRIPTIONS_KEY, list)

    return NextResponse.json({ success: true, item: newItem })
  } catch (error) {
    console.error("Failed to save subscription item:", error)
    return NextResponse.json({ error: "save_failed" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json()
    const { id, type, name, location, applyDate, applyStatus, announceDate, link, memo } = payload || {}
    if (typeof id !== "string") {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 })
    }

    const existing = await redis.get<SubscriptionItem[]>(SUBSCRIPTIONS_KEY)
    const list = Array.isArray(existing) ? existing : []
    const idx = list.findIndex((x) => x.id === id)
    if (idx === -1) return NextResponse.json({ error: "not_found" }, { status: 404 })

    const current = list[idx]
    const validApplyStatus: ApplyStatus = ["예정", "접수중", "마감", "발표대기", "발표완료"].includes(applyStatus)
      ? applyStatus
      : current.applyStatus

    const updated: SubscriptionItem = {
      ...current,
      type: typeof type === "string" ? type : current.type,
      name: typeof name === "string" ? name : current.name,
      location: typeof location === "string" ? location : current.location,
      applyDate: typeof applyDate === "string" ? applyDate : current.applyDate,
      applyStatus: validApplyStatus,
      announceDate: typeof announceDate === "string" ? announceDate : current.announceDate,
      link: typeof link === "string" ? link : current.link,
      memo: typeof memo === "string" ? memo : current.memo,
      updatedAt: Date.now(),
    }

    list[idx] = updated
    await redis.set(SUBSCRIPTIONS_KEY, list)
    return NextResponse.json({ success: true, item: updated })
  } catch (error) {
    console.error("Failed to update subscription item:", error)
    return NextResponse.json({ error: "update_failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json()
    const { id } = payload || {}
    if (typeof id !== "string") {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 })
    }
    const existing = await redis.get<SubscriptionItem[]>(SUBSCRIPTIONS_KEY)
    const list = Array.isArray(existing) ? existing : []
    const filtered = list.filter((x) => x.id !== id)
    await redis.set(SUBSCRIPTIONS_KEY, filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete subscription item:", error)
    return NextResponse.json({ error: "delete_failed" }, { status: 500 })
  }
}
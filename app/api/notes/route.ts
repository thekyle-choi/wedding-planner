import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

const redis = Redis.fromEnv()
const NOTES_KEY = "wedding:notes"

type NoteItem = {
  id: string
  title: string
  content: string
  images: string[]
  createdAt: number
  updatedAt: number
}

export async function GET() {
  try {
    const data = await redis.get<any[]>(NOTES_KEY)
    const list = Array.isArray(data) ? data : []
    // Backward compatibility for items saved without title
    const normalized: NoteItem[] = list.map((item) => {
      const content: string = typeof item?.content === "string" ? item.content : ""
      const fallbackTitle = deriveTitle(content)
      return {
        id: typeof item?.id === "string" ? item.id : crypto.randomUUID(),
        title: typeof item?.title === "string" ? item.title : fallbackTitle,
        content,
        images: Array.isArray(item?.images)
          ? item.images.filter((x: unknown) => typeof x === "string")
          : [],
        createdAt: typeof item?.createdAt === "number" ? item.createdAt : Date.now(),
        updatedAt: typeof item?.updatedAt === "number" ? item.updatedAt : Date.now(),
      }
    })
    return NextResponse.json(normalized)
  } catch (error) {
    console.error("Failed to get notes:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { id, title, content, images } = payload || {}

    if (typeof content !== "string") {
      return NextResponse.json({ error: "invalid_content" }, { status: 400 })
    }

    const now = Date.now()
    const newItem: NoteItem = {
      id: id || crypto.randomUUID(),
      title: typeof title === "string" ? title : deriveTitle(content),
      content,
      images: Array.isArray(images) ? images.filter((x: unknown) => typeof x === "string") : [],
      createdAt: now,
      updatedAt: now,
    }

    const existing = await redis.get<NoteItem[]>(NOTES_KEY)
    const list = Array.isArray(existing) ? existing : []
    list.unshift(newItem)
    await redis.set(NOTES_KEY, list)

    return NextResponse.json({ success: true, item: newItem })
  } catch (error) {
    console.error("Failed to save note:", error)
    return NextResponse.json({ error: "save_failed" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json()
    const { id, title, content, images } = payload || {}

    if (typeof id !== "string") {
      return NextResponse.json({ error: "id_required" }, { status: 400 })
    }

    const existing = await redis.get<NoteItem[]>(NOTES_KEY)
    const list = Array.isArray(existing) ? existing : []
    const idx = list.findIndex((n) => n.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }

    const updated: NoteItem = {
      ...list[idx],
      title: typeof title === "string" ? title : (list[idx] as any)?.title ?? deriveTitle((list[idx] as any)?.content ?? ""),
      content: typeof content === "string" ? content : list[idx].content,
      images: Array.isArray(images)
        ? images.filter((x: unknown) => typeof x === "string")
        : list[idx].images,
      updatedAt: Date.now(),
    }
    list[idx] = updated
    await redis.set(NOTES_KEY, list)
    return NextResponse.json({ success: true, item: updated })
  } catch (error) {
    console.error("Failed to update note:", error)
    return NextResponse.json({ error: "update_failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (typeof id !== "string") {
      return NextResponse.json({ error: "id_required" }, { status: 400 })
    }

    const existing = await redis.get<NoteItem[]>(NOTES_KEY)
    const list = Array.isArray(existing) ? existing : []
    const next = list.filter((n) => n.id !== id)
    await redis.set(NOTES_KEY, next)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete note:", error)
    return NextResponse.json({ error: "delete_failed" }, { status: 500 })
  }
}

function deriveTitle(content: string): string {
  const raw = (content || "").trim()
  if (!raw) return "제목 없음"
  const firstLine = raw.split("\n")[0]?.trim() ?? "제목 없음"
  return firstLine.length > 50 ? firstLine.slice(0, 50) + "…" : firstLine
}

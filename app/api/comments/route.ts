import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

const redis = Redis.fromEnv()
const COMMENTS_KEY = "wedding:comments"

type TargetType = "realestate" | "subscription"

type CommentItem = {
  id: string
  targetId: string
  targetType: TargetType
  content: string
  author: "SJ" | "JK"
  createdAt: number
  updatedAt: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get("targetId")
    const targetType = searchParams.get("targetType")

    if (!targetType || !["realestate", "subscription"].includes(targetType)) {
      return NextResponse.json({ error: "invalid_params" }, { status: 400 })
    }

    const data = await redis.get<CommentItem[]>(COMMENTS_KEY)
    const allComments = Array.isArray(data) ? data : []
    
    let comments: CommentItem[]
    
    if (targetId) {
      // 특정 항목의 댓글만 필터링
      comments = allComments
        .filter((comment) => comment.targetId === targetId && comment.targetType === targetType)
        .sort((a, b) => a.createdAt - b.createdAt) // 오래된 순으로 정렬
    } else {
      // 해당 targetType의 모든 댓글 반환
      comments = allComments
        .filter((comment) => comment.targetType === targetType)
        .sort((a, b) => a.createdAt - b.createdAt) // 오래된 순으로 정렬
    }

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Failed to get comments:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { targetId, targetType, content, author } = payload || {}

    if (!targetId || !targetType || !content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json({ error: "invalid_params" }, { status: 400 })
    }

    if (!["realestate", "subscription"].includes(targetType)) {
      return NextResponse.json({ error: "invalid_target_type" }, { status: 400 })
    }

    if (!["SJ", "JK"].includes(author)) {
      return NextResponse.json({ error: "invalid_author" }, { status: 400 })
    }

    const now = Date.now()
    const newComment: CommentItem = {
      id: crypto.randomUUID(),
      targetId: targetId,
      targetType: targetType as TargetType,
      content: content.trim(),
      author: author as "SJ" | "JK",
      createdAt: now,
      updatedAt: now,
    }

    const existing = await redis.get<CommentItem[]>(COMMENTS_KEY)
    const list = Array.isArray(existing) ? existing : []
    list.push(newComment)
    await redis.set(COMMENTS_KEY, list)

    return NextResponse.json({ success: true, comment: newComment })
  } catch (error) {
    console.error("Failed to create comment:", error)
    return NextResponse.json({ error: "create_failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json()
    const { id } = payload || {}
    
    if (typeof id !== "string") {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 })
    }

    const existing = await redis.get<CommentItem[]>(COMMENTS_KEY)
    const list = Array.isArray(existing) ? existing : []
    const filtered = list.filter((x) => x.id !== id)
    
    if (filtered.length === list.length) {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }
    
    await redis.set(COMMENTS_KEY, filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete comment:", error)
    return NextResponse.json({ error: "delete_failed" }, { status: 500 })
  }
}
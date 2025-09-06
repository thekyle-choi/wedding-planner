import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

const redis = Redis.fromEnv()
const APPLIANCES_KEY = "wedding:appliances"

type ApplianceCategory = {
  id: string
  name: string
  items: ApplianceItem[]
  createdAt: number
  updatedAt: number
}

type ApplianceItem = {
  id: string
  categoryId: string
  name: string
  brand?: string
  model?: string
  specs?: string
  price: number
  url?: string
  notes?: string
  images: string[]
  createdAt: number
  updatedAt: number
}

export async function GET() {
  try {
    const data = await redis.get<any[]>(APPLIANCES_KEY)
    const list = Array.isArray(data) ? data : []
    
    const normalized: ApplianceCategory[] = list
      .map((category) => {
        const items: ApplianceItem[] = Array.isArray(category?.items)
          ? category.items.map((item: any) => ({
              id: typeof item?.id === "string" ? item.id : crypto.randomUUID(),
              categoryId: typeof item?.categoryId === "string" ? item.categoryId : category?.id || "",
              name: typeof item?.name === "string" ? item.name : "",
              brand: typeof item?.brand === "string" ? item.brand : undefined,
              model: typeof item?.model === "string" ? item.model : undefined,
              specs: typeof item?.specs === "string" ? item.specs : undefined,
              price: typeof item?.price === "number" ? item.price : 0,
              url: typeof item?.url === "string" ? item.url : undefined,
              notes: typeof item?.notes === "string" ? item.notes : undefined,
              images: Array.isArray(item?.images)
                ? item.images.filter((x: unknown) => typeof x === "string")
                : [],
              createdAt: typeof item?.createdAt === "number" ? item.createdAt : Date.now(),
              updatedAt: typeof item?.updatedAt === "number" ? item.updatedAt : Date.now(),
            }))
          : []

        return {
          id: typeof category?.id === "string" ? category.id : crypto.randomUUID(),
          name: typeof category?.name === "string" ? category.name : "",
          items: items.sort((a, b) => b.updatedAt - a.updatedAt),
          createdAt: typeof category?.createdAt === "number" ? category.createdAt : Date.now(),
          updatedAt: typeof category?.updatedAt === "number" ? category.updatedAt : Date.now(),
        }
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)

    return NextResponse.json(normalized)
  } catch (error) {
    console.error("Failed to get appliance categories:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // Validate that payload is an array of categories
    if (!Array.isArray(payload)) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
    }

    const now = Date.now()
    const normalized: ApplianceCategory[] = payload.map((category) => {
      const items: ApplianceItem[] = Array.isArray(category?.items)
        ? category.items.map((item: any) => ({
            id: typeof item?.id === "string" ? item.id : crypto.randomUUID(),
            categoryId: typeof item?.categoryId === "string" ? item.categoryId : category?.id || crypto.randomUUID(),
            name: typeof item?.name === "string" ? item.name : "",
            brand: typeof item?.brand === "string" ? item.brand : undefined,
            model: typeof item?.model === "string" ? item.model : undefined,
            specs: typeof item?.specs === "string" ? item.specs : undefined,
            price: typeof item?.price === "number" ? item.price : 0,
            url: typeof item?.url === "string" ? item.url : undefined,
            notes: typeof item?.notes === "string" ? item.notes : undefined,
            images: Array.isArray(item?.images) 
              ? item.images.filter((x: unknown) => typeof x === "string")
              : [],
            createdAt: typeof item?.createdAt === "number" ? item.createdAt : now,
            updatedAt: typeof item?.updatedAt === "number" ? item.updatedAt : now,
          }))
        : []

      return {
        id: typeof category?.id === "string" ? category.id : crypto.randomUUID(),
        name: typeof category?.name === "string" ? category.name : "",
        items: items,
        createdAt: typeof category?.createdAt === "number" ? category.createdAt : now,
        updatedAt: typeof category?.updatedAt === "number" ? category.updatedAt : now,
      }
    })

    await redis.set(APPLIANCES_KEY, normalized)
    return NextResponse.json({ success: true, categories: normalized })
  } catch (error) {
    console.error("Failed to save appliance categories:", error)
    return NextResponse.json({ error: "save_failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json()
    const { categoryId, itemId } = payload || {}

    const existing = await redis.get<ApplianceCategory[]>(APPLIANCES_KEY)
    const categories = Array.isArray(existing) ? existing : []

    if (typeof categoryId === "string" && !itemId) {
      // Delete entire category
      const filtered = categories.filter((c) => c.id !== categoryId)
      await redis.set(APPLIANCES_KEY, filtered)
      return NextResponse.json({ success: true })
    } else if (typeof categoryId === "string" && typeof itemId === "string") {
      // Delete specific item from category
      const updated = categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.filter((item) => item.id !== itemId),
              updatedAt: Date.now(),
            }
          : category
      )
      await redis.set(APPLIANCES_KEY, updated)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }
  } catch (error) {
    console.error("Failed to delete appliance data:", error)
    return NextResponse.json({ error: "delete_failed" }, { status: 500 })
  }
}
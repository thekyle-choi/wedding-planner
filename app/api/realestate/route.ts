import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

const redis = Redis.fromEnv()
const REAL_ESTATE_KEY = "wedding:realestate"

type DealType = "월세" | "전세" | "매매"

type RealEstateItem = {
  id: string
  dealType: DealType
  // 가격 정보: dealType 별로 의미 다름
  // 월세: deposit(보증금), monthly(월세)
  // 전세: deposit(전세가)
  // 매매: price(매매가)
  price: {
    deposit?: number
    monthly?: number
    price?: number
  }
  location: string
  area: {
    sqm?: number
    pyeong?: number
  }
  images: string[]
  url?: string
  memo: string
  transportation: string
  rating: number // 1~5
  moveInType: "immediate" | "date"
  moveInDate?: string
  createdAt: number
  updatedAt: number
}

export async function GET() {
  try {
    const data = await redis.get<any[]>(REAL_ESTATE_KEY)
    const list = Array.isArray(data) ? data : []
    const normalized: RealEstateItem[] = list
      .map((item) => {
        const dealType: DealType = ["월세", "전세", "매매"].includes(item?.dealType)
          ? item.dealType
          : "월세"
        const price = typeof item?.price === "object" && item?.price !== null ? item.price : {}
        const area = typeof item?.area === "object" && item?.area !== null ? item.area : {}
        return {
          id: typeof item?.id === "string" ? item.id : crypto.randomUUID(),
          dealType,
          price: {
            deposit: typeof price?.deposit === "number" ? price.deposit : undefined,
            monthly: typeof price?.monthly === "number" ? price.monthly : undefined,
            price: typeof price?.price === "number" ? price.price : undefined,
          },
          location: typeof item?.location === "string" ? item.location : "",
          area: {
            sqm: typeof area?.sqm === "number" ? area.sqm : undefined,
            pyeong: typeof area?.pyeong === "number" ? area.pyeong : undefined,
          },
          images: Array.isArray(item?.images)
            ? item.images.filter((x: unknown) => typeof x === "string")
            : [],
          url: typeof item?.url === "string" ? item.url : undefined,
          memo: typeof item?.memo === "string" ? item.memo : "",
          transportation: typeof item?.transportation === "string" ? item.transportation : "",
          rating: typeof item?.rating === "number" ? item.rating : 0,
          moveInType: item?.moveInType === "date" || item?.moveInType === "immediate" ? item.moveInType : "immediate",
          moveInDate: typeof item?.moveInDate === "string" ? item.moveInDate : undefined,
          createdAt: typeof item?.createdAt === "number" ? item.createdAt : Date.now(),
          updatedAt: typeof item?.updatedAt === "number" ? item.updatedAt : Date.now(),
        }
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)

    return NextResponse.json(normalized)
  } catch (error) {
    console.error("Failed to get real estate items:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { id, dealType, price, location, area, images, memo, transportation, rating, url, moveInType, moveInDate } = payload || {}

    const validDealType: DealType = ["월세", "전세", "매매"].includes(dealType)
      ? dealType
      : "월세"

    const priceObj = typeof price === "object" && price !== null ? price : {}
    const areaObj = typeof area === "object" && area !== null ? area : {}

    const now = Date.now()
    const newItem: RealEstateItem = {
      id: id || crypto.randomUUID(),
      dealType: validDealType,
      price: {
        deposit: typeof priceObj?.deposit === "number" ? priceObj.deposit : undefined,
        monthly: typeof priceObj?.monthly === "number" ? priceObj.monthly : undefined,
        price: typeof priceObj?.price === "number" ? priceObj.price : undefined,
      },
      location: typeof location === "string" ? location : "",
      area: {
        sqm: typeof areaObj?.sqm === "number" ? areaObj.sqm : undefined,
        pyeong: typeof areaObj?.pyeong === "number" ? areaObj.pyeong : undefined,
      },
      images: Array.isArray(images) ? images.filter((x: unknown) => typeof x === "string") : [],
      url: typeof url === "string" ? url : undefined,
      memo: typeof memo === "string" ? memo : "",
      transportation: typeof transportation === "string" ? transportation : "",
      rating: typeof rating === "number" ? rating : 0,
      moveInType: moveInType === "date" || moveInType === "immediate" ? moveInType : "immediate",
      moveInDate: typeof moveInDate === "string" ? moveInDate : undefined,
      createdAt: now,
      updatedAt: now,
    }

    const existing = await redis.get<RealEstateItem[]>(REAL_ESTATE_KEY)
    const list = Array.isArray(existing) ? existing : []
    list.unshift(newItem)
    await redis.set(REAL_ESTATE_KEY, list)

    return NextResponse.json({ success: true, item: newItem })
  } catch (error) {
    console.error("Failed to save real estate item:", error)
    return NextResponse.json({ error: "save_failed" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json()
    const { id, dealType, price, location, area, images, memo, transportation, rating, url, moveInType, moveInDate } = payload || {}
    if (typeof id !== "string") {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 })
    }

    const existing = await redis.get<RealEstateItem[]>(REAL_ESTATE_KEY)
    const list = Array.isArray(existing) ? existing : []
    const idx = list.findIndex((x) => x.id === id)
    if (idx === -1) return NextResponse.json({ error: "not_found" }, { status: 404 })

    const current = list[idx]
    const validDealType: DealType = ["월세", "전세", "매매"].includes(dealType)
      ? dealType
      : current.dealType
    const priceObj = typeof price === "object" && price !== null ? price : current.price
    const areaObj = typeof area === "object" && area !== null ? area : current.area || {}

    const updated: RealEstateItem = {
      ...current,
      dealType: validDealType,
      price: {
        deposit: typeof priceObj?.deposit === "number" ? priceObj.deposit : undefined,
        monthly: typeof priceObj?.monthly === "number" ? priceObj.monthly : undefined,
        price: typeof priceObj?.price === "number" ? priceObj.price : undefined,
      },
      location: typeof location === "string" ? location : current.location,
      area: {
        sqm: typeof areaObj?.sqm === "number" ? areaObj.sqm : undefined,
        pyeong: typeof areaObj?.pyeong === "number" ? areaObj.pyeong : undefined,
      },
      images: Array.isArray(images)
        ? images.filter((x: unknown) => typeof x === "string")
        : current.images,
      url: typeof url === "string" ? url : current.url,
      memo: typeof memo === "string" ? memo : current.memo,
      transportation: typeof transportation === "string" ? transportation : current.transportation || "",
      rating: typeof rating === "number" ? rating : current.rating,
      moveInType: moveInType === "date" || moveInType === "immediate" ? moveInType : current.moveInType,
      moveInDate: typeof moveInDate === "string" ? moveInDate : current.moveInDate,
      updatedAt: Date.now(),
    }

    list[idx] = updated
    await redis.set(REAL_ESTATE_KEY, list)
    return NextResponse.json({ success: true, item: updated })
  } catch (error) {
    console.error("Failed to update real estate item:", error)
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
    const existing = await redis.get<RealEstateItem[]>(REAL_ESTATE_KEY)
    const list = Array.isArray(existing) ? existing : []
    const filtered = list.filter((x) => x.id !== id)
    await redis.set(REAL_ESTATE_KEY, filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete real estate item:", error)
    return NextResponse.json({ error: "delete_failed" }, { status: 500 })
  }
}



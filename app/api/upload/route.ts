import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }

    const safeName = file.name?.replace(/[^a-zA-Z0-9._-]/g, "_") || "upload"
    const filename = `${Date.now()}-${safeName}`

    const blob = await put(filename, file, { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Upload failed", error)
    return NextResponse.json({ error: "upload_failed" }, { status: 500 })
  }
}


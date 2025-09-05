"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Plus, Upload, Trash2, Image as ImageIcon, X, ChevronLeft, ChevronRight, ArrowLeft, Save, Edit3, MapPin, Star, Loader2 } from "lucide-react"

type DealType = "월세" | "전세" | "매매"

export type RealEstateItem = {
  id: string
  dealType: DealType
  price: {
    deposit?: number
    monthly?: number
    price?: number
  }
  location: string
  images: string[]
  url?: string
  memo: string
  rating: number
  moveInType?: "immediate" | "date"
  moveInDate?: string
  createdAt: number
  updatedAt: number
}

interface RealEstateManagerProps {
  items: RealEstateItem[]
  setItems: (items: RealEstateItem[]) => void
  onBack?: () => void
}

export default function RealEstateManager({ items, setItems, onBack }: RealEstateManagerProps) {
  const [mode, setMode] = useState<"list" | "create">("list")
  const [keyword, setKeyword] = useState<string>("")
  const [sortBy, setSortBy] = useState<"updated" | "rating" | "priceAsc" | "priceDesc">("updated")
  const [dealType, setDealType] = useState<DealType>("월세")
  const [deposit, setDeposit] = useState<string>("")
  const [monthly, setMonthly] = useState<string>("")
  const [buyPrice, setBuyPrice] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [url, setUrl] = useState<string>("")
  const [memo, setMemo] = useState<string>("")
  const [rating, setRating] = useState<number>(0)
  const [moveInType, setMoveInType] = useState<"immediate" | "date">("immediate")
  const [moveInDate, setMoveInDate] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const createFileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [preview, setPreview] = useState<{ images: string[]; index: number } | null>(null)

  const selected = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId])

  const filteredSorted = useMemo(() => {
    const term = keyword.trim()
    const list = items.filter((it) => {
      if (!term) return true
      const hay = `${it.location} ${it.memo} ${formatPrice(it.dealType, it.price)}`
      return hay.toLowerCase().includes(term.toLowerCase())
    })

    const priceValue = (it: RealEstateItem) => {
      if (it.dealType === "월세") return typeof it.price.monthly === "number" ? it.price.monthly : (it.price.deposit ?? 0)
      if (it.dealType === "전세") return it.price.deposit ?? 0
      return it.price.price ?? 0
    }

    const sorted = [...list]
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        case "priceAsc":
          return priceValue(a) - priceValue(b)
        case "priceDesc":
          return priceValue(b) - priceValue(a)
        case "updated":
        default:
          return (b.updatedAt || 0) - (a.updatedAt || 0)
      }
    })
    return sorted
  }, [items, keyword, sortBy])

  // Clipboard paste handler (detail mode)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!selected) return
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        if (it.type.startsWith("image/")) {
          const file = it.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        await uploadImages(selected, files)
      }
    }
    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [selected])

  // Clipboard paste handler (create mode)
  useEffect(() => {
    if (mode !== "create") return
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        if (it.type.startsWith("image/")) {
          const file = it.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        await uploadCreateImages(files)
      }
    }
    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [mode])

  const resetForm = () => {
    setDealType("월세")
    setDeposit("")
    setMonthly("")
    setBuyPrice("")
    setLocation("")
    setUrl("")
    setMemo("")
    setRating(0)
    setMoveInType("immediate")
    setMoveInDate("")
  }

  const handleCreate = async () => {
    const price =
      dealType === "월세"
        ? { deposit: toNumberOrUndefined(deposit), monthly: toNumberOrUndefined(monthly) }
        : dealType === "전세"
        ? { deposit: toNumberOrUndefined(deposit) }
        : { price: toNumberOrUndefined(buyPrice) }

    const payload = {
      dealType,
      price,
      location,
      images: createImages,
      url,
      memo,
      rating,
      moveInType,
      moveInDate: moveInType === "date" ? (moveInDate || undefined) : undefined,
    }

    const resp = await fetch("/api/realestate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) return
    const json = await resp.json()
    setItems([json.item as RealEstateItem, ...items])
    resetForm()
    setMode("list")
  }

  const handleDelete = async (id: string) => {
    const resp = await fetch("/api/realestate", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!resp.ok) return
    setItems(items.filter((x) => x.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const uploadImages = useCallback(async (item: RealEstateItem, fileList: File[] | FileList | null) => {
    if (!fileList || ("length" in fileList && fileList.length === 0)) return
    const files = Array.isArray(fileList) ? fileList : Array.from(fileList)
    setUploading(true)
    try {
      // 미리보기 즉시 반영: optimistic UI
      const tempUrls: string[] = files.map((f) => URL.createObjectURL(f))
      setItems(items.map((x) => (x.id === item.id ? { ...x, images: [...x.images, ...tempUrls] } : x)))

      // 업로드 실제 진행
      const uploadedUrls: string[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const resp = await fetch("/api/upload", { method: "POST", body: fd })
        if (resp.ok) {
          const json = await resp.json()
          if (json.url) uploadedUrls.push(json.url)
        }
      }
      // 서버 반영
      const serverImages = [...item.images, ...uploadedUrls]
      const put = await fetch("/api/realestate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, images: serverImages }),
      })
      if (!put.ok) return
      const updatedResp = await put.json()
      const updatedItem = updatedResp.item as RealEstateItem
      // 실제 서버 응답으로 교체 (blob 미리보기 제거)
      setItems(items.map((x) => (x.id === item.id ? updatedItem : x)))
      if (fileInputRef.current) fileInputRef.current.value = ""
    } finally {
      setUploading(false)
    }
  }, [items])

  // create-mode images
  const [createImages, setCreateImages] = useState<string[]>([])
  const uploadCreateImages = useCallback(async (fileList: File[] | FileList | null) => {
    if (!fileList || ("length" in fileList && fileList.length === 0)) return
    const files = Array.isArray(fileList) ? fileList : Array.from(fileList)
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const resp = await fetch("/api/upload", { method: "POST", body: fd })
        if (resp.ok) {
          const json = await resp.json()
          if (json.url) urls.push(json.url)
        }
      }
      setCreateImages((prev) => [...prev, ...urls])
      if (createFileInputRef.current) createFileInputRef.current.value = ""
    } finally {
      setUploading(false)
    }
  }, [])

  const handleSaveDetail = async () => {
    if (!selected) return
    const resp = await fetch("/api/realestate", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selected.id,
        dealType: selected.dealType,
        price: selected.price,
        location: selected.location,
        images: selected.images,
        memo: selected.memo,
        rating: selected.rating,
        moveInType: selected.moveInType,
        moveInDate: selected.moveInDate,
      }),
    })
    if (!resp.ok) return
    const json = await resp.json()
    const updated = json.item as RealEstateItem
    setItems(items.map((x) => (x.id === updated.id ? updated : x)))
    setIsEditing(false)
  }

  const openPreview = (images: string[], index: number) => setPreview({ images, index })
  const closePreview = () => setPreview(null)
  const showPrev = () => preview && setPreview({ images: preview.images, index: (preview.index - 1 + preview.images.length) % preview.images.length })
  const showNext = () => preview && setPreview({ images: preview.images, index: (preview.index + 1) % preview.images.length })

  return (
    <div className="space-y-6 pb-24">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center gap-2 p-4">
          {mode === "list" ? (
            <>
              {onBack && (
                <button onClick={onBack} className="p-2 -ml-2">
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
              )}
              <h2 className="text-lg font-semibold">부동산 메모</h2>
              <div className="ml-auto">
                <button onClick={() => setMode("create")} className="px-3 py-1.5 rounded-lg bg-gray-900 text-white flex items-center gap-1">
                  <Plus className="w-4 h-4" /> 추가
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setMode("list")} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="text-lg font-semibold">부동산 추가</h2>
            </>
          )}
        </div>
      </div>

      {mode === "create" && (
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setDealType("월세")}
                className={`py-2 rounded-lg text-sm ${dealType === "월세" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                월세
              </button>
              <button
                onClick={() => setDealType("전세")}
                className={`py-2 rounded-lg text-sm ${dealType === "전세" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                전세
              </button>
              <button
                onClick={() => setDealType("매매")}
                className={`py-2 rounded-lg text-sm ${dealType === "매매" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                매매
              </button>
            </div>

            {dealType === "월세" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">보증금</div>
                  <input value={deposit} onChange={(e) => setDeposit(e.target.value)} inputMode="numeric" placeholder="보증금" className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">월세</div>
                  <input value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="numeric" placeholder="월세" className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
                </div>
              </div>
            )}

            {dealType === "전세" && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">전세가</div>
                <input value={deposit} onChange={(e) => setDeposit(e.target.value)} inputMode="numeric" placeholder="전세가" className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
              </div>
            )}

            {dealType === "매매" && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">매매가</div>
                <input value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} inputMode="numeric" placeholder="매매가" className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600"><MapPin className="w-4 h-4 text-gray-500" /> 위치</div>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="위치" className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">참고 URL (옵션)</div>
              <div className="flex items-center gap-2">
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="참고 URL (옵션)" className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
                {url.trim() !== "" && (
                  <a
                    href={normalizeUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
                  >
                    바로가기
                  </a>
                )}
              </div>
              {url.trim() !== "" && (
                <div className="text-[11px] text-gray-500">{getHostname(url)}</div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">입주 가능일</div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={moveInType === "immediate"} onChange={() => setMoveInType("immediate")} /> 즉시입주
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={moveInType === "date"} onChange={() => setMoveInType("date")} /> 날짜 지정
                </label>
                {moveInType === "date" && (
                  <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">특이사항 메모</div>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="특이사항 메모" className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 min-h-[80px]" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">평가</div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => setRating(i + 1)} className="p-1">
                    <Star className={`w-5 h-5 ${rating >= i + 1 ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">이미지</div>
              <div className="flex items-center gap-2">
                <input ref={createFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadCreateImages(e.target.files)} />
                <button onClick={() => createFileInputRef.current?.click()} disabled={uploading} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> 이미지 추가
                </button>
                <div className="text-xs text-gray-500">생성 화면에서도 붙여넣기 지원</div>
              </div>
              {createImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {createImages.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img src={url} alt="img" className="w-full h-24 object-cover rounded-lg" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleCreate} className="w-full py-2 bg-gray-900 text-white rounded-lg flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> 추가
            </button>
          </div>
        </div>
      )}

      {mode === "list" && (
        <div className="px-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="검색(위치/메모/가격)"
              className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm"
            >
              <option value="updated">최신순</option>
              <option value="rating">등급순</option>
              <option value="priceAsc">가격낮은순</option>
              <option value="priceDesc">가격높은순</option>
            </select>
          </div>

          {filteredSorted.map((item) => (
            <button key={item.id} onClick={() => { setSelectedId(item.id); setIsEditing(false) }} className="w-full text-left bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">{item.dealType}</div>
                  <div className="font-medium text-gray-900">
                    {formatPrice(item.dealType, item.price)}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="w-4 h-4" /> {item.location || "위치 미입력"}</div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${item.rating >= i + 1 ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                  ))}
                </div>
              </div>
              {item.images.length > 0 && (
                <div className="mt-3">
                  <img src={item.images[0]} alt="preview" className="w-full h-40 object-cover rounded-xl" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detail */}
      {selected && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
          <div className="flex items-center gap-2 p-4 border-b">
            <button onClick={() => setSelectedId(null)} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
            <h3 className="text-base font-semibold">상세</h3>
            <div className="ml-auto flex items-center gap-2">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 flex items-center gap-1"><Edit3 className="w-4 h-4" />편집</button>
              ) : (
                <button onClick={handleSaveDetail} className="px-3 py-1.5 rounded-lg bg-gray-900 text-white flex items-center gap-1"><Save className="w-4 h-4" />저장</button>
              )}
              <button onClick={() => handleDelete(selected.id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 flex items-center gap-1"><Trash2 className="w-4 h-4" />삭제</button>
            </div>
          </div>

          <div className="p-4 space-y-4 pb-28">
            <div className="grid grid-cols-3 gap-2">
              {(["월세", "전세", "매매"] as DealType[]).map((t) => (
                <button key={t} disabled={!isEditing} onClick={() => selected && setItems(items.map((x) => x.id === selected.id ? { ...x, dealType: t } : x))} className={`py-2 rounded-lg text-sm ${selected.dealType === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {selected.dealType === "월세" && (
                <>
                  <div className="space-y-1 col-span-2">
                    <div className="text-xs font-medium text-gray-600">보증금</div>
                    <input disabled={!isEditing} value={selected.price.deposit ?? ""} onChange={(e) => onEditPrice(selected, { deposit: toNumberOrUndefined(e.target.value) })} inputMode="numeric" placeholder="보증금" className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <div className="text-xs font-medium text-gray-600">월세</div>
                    <input disabled={!isEditing} value={selected.price.monthly ?? ""} onChange={(e) => onEditPrice(selected, { monthly: toNumberOrUndefined(e.target.value) })} inputMode="numeric" placeholder="월세" className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
                  </div>
                </>
              )}
              {selected.dealType === "전세" && (
                <div className="space-y-1 col-span-2">
                  <div className="text-xs font-medium text-gray-600">전세가</div>
                  <input disabled={!isEditing} value={selected.price.deposit ?? ""} onChange={(e) => onEditPrice(selected, { deposit: toNumberOrUndefined(e.target.value), monthly: undefined, price: undefined })} inputMode="numeric" placeholder="전세가" className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
                </div>
              )}
              {selected.dealType === "매매" && (
                <div className="space-y-1 col-span-2">
                  <div className="text-xs font-medium text-gray-600">매매가</div>
                  <input disabled={!isEditing} value={selected.price.price ?? ""} onChange={(e) => onEditPrice(selected, { price: toNumberOrUndefined(e.target.value), deposit: undefined, monthly: undefined })} inputMode="numeric" placeholder="매매가" className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600"><MapPin className="w-4 h-4 text-gray-500" /> 위치</div>
              <input disabled={!isEditing} value={selected.location} onChange={(e) => setItems(items.map((x) => x.id === selected.id ? { ...x, location: e.target.value } : x))} placeholder="위치" className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">참고 URL (옵션)</div>
                {(!isEditing && selected.url && selected.url.trim() !== "") ? (
                  <>
                    <a
                      href={normalizeUrl(selected.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white"
                    >
                      바로가기
                    </a>
                    <div className="text-[11px] text-gray-500">{getHostname(selected.url)}</div>
                  </>
                ) : (
                  <input disabled={!isEditing} value={selected.url || ""} onChange={(e) => setItems(items.map((x) => x.id === selected.id ? { ...x, url: e.target.value } : x))} placeholder="참고 URL (옵션)" className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200" />
                )}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">특이사항 메모</div>
                <textarea disabled={!isEditing} value={selected.memo} onChange={(e) => setItems(items.map((x) => x.id === selected.id ? { ...x, memo: e.target.value } : x))} placeholder="특이사항 메모" className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 min-h-[100px]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">평가</div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} disabled={!isEditing} onClick={() => setItems(items.map((x) => x.id === selected.id ? { ...x, rating: i + 1 } : x))} className="p-1">
                    <Star className={`w-6 h-6 ${selected.rating >= i + 1 ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-medium text-gray-600">이미지</div>
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => selected && uploadImages(selected, e.target.files)} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 flex items-center gap-2">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 이미지 업로드
                </button>
                <div className="text-xs text-gray-500">클립보드 붙여넣기 지원</div>
              </div>

              {selected.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {selected.images.map((url, idx) => (
                    <button key={idx} onClick={() => openPreview(selected.images, idx)} className="relative">
                      <img src={url} alt="img" className="w-full h-24 object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg text-gray-400 text-sm">
                  <ImageIcon className="w-4 h-4 mr-1" /> 이미지 없음
                </div>
              )}

              {uploading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> 업로드 중...
                </div>
              )}
            </div>
          </div>

          {/* Image previewer */}
          {preview && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
              <button onClick={closePreview} className="absolute top-4 right-4 p-2 text-white"><X className="w-6 h-6" /></button>
              <button onClick={showPrev} className="absolute left-4 p-2 text-white"><ChevronLeft className="w-8 h-8" /></button>
              <img src={preview.images[preview.index]} className="max-h-[80vh] object-contain" />
              <button onClick={showNext} className="absolute right-4 p-2 text-white"><ChevronRight className="w-8 h-8" /></button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function toNumberOrUndefined(v: string): number | undefined {
  const n = Number(String(v).replace(/[^\d.]/g, ""))
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function normalizeUrl(input: string): string {
  const trimmed = (input || "").trim()
  if (!trimmed) return "#"
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function getHostname(input: string): string {
  try {
    const href = normalizeUrl(input)
    const u = new URL(href)
    return u.hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

function formatPrice(dealType: DealType, price: RealEstateItem["price"]) {
  const format = (n?: number) => (typeof n === "number" ? n.toLocaleString() : "-")
  if (dealType === "월세") return `보증금 ${format(price.deposit)} / 월 ${format(price.monthly)}`
  if (dealType === "전세") return `전세 ${format(price.deposit)}`
  return `매매 ${format(price.price)}`
}

function onEditPrice(selected: RealEstateItem, part: Partial<RealEstateItem["price"]>) {
  // 이 함수는 JSX에서 setItems 클로저와 함께 쓰이므로, 더미로 남겨둡니다.
  // 실제 값 업데이트는 onChange 핸들러에서 setItems(...)로 수행합니다.
}



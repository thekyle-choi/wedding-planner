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
  area: {
    sqm?: number
    pyeong?: number
  }
  images: string[]
  url?: string
  memo: string
  transportation: string
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
  const [transportation, setTransportation] = useState<string>("")
  const [rating, setRating] = useState<number>(0)
  const [moveInType, setMoveInType] = useState<"immediate" | "date">("immediate")
  const [moveInDate, setMoveInDate] = useState<string>("")
  const [areaSqm, setAreaSqm] = useState<string>("")
  const [areaPyeong, setAreaPyeong] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const createFileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [preview, setPreview] = useState<{ images: string[]; index: number } | null>(null)

  const selected = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId])

  // Area conversion handlers
  const handleAreaSqmChange = (value: string) => {
    setAreaSqm(value)
    const num = toNumberOrUndefined(value)
    if (num !== undefined) {
      setAreaPyeong(sqmToPyeong(num).toString())
    } else {
      setAreaPyeong("")
    }
  }

  const handleAreaPyeongChange = (value: string) => {
    setAreaPyeong(value)
    const num = toNumberOrUndefined(value)
    if (num !== undefined) {
      setAreaSqm(pyeongToSqm(num).toString())
    } else {
      setAreaSqm("")
    }
  }

  // Area conversion handlers for detail view
  const handleDetailAreaSqmChange = (value: string) => {
    if (!selected) return
    const num = toNumberOrUndefined(value)
    const newArea = {
      sqm: num,
      pyeong: num !== undefined ? sqmToPyeong(num) : undefined
    }
    setItems(items.map((x) => x.id === selected.id ? { ...x, area: newArea } : x))
  }

  const handleDetailAreaPyeongChange = (value: string) => {
    if (!selected) return
    const num = toNumberOrUndefined(value)
    const newArea = {
      sqm: num !== undefined ? pyeongToSqm(num) : undefined,
      pyeong: num
    }
    setItems(items.map((x) => x.id === selected.id ? { ...x, area: newArea } : x))
  }

  const filteredSorted = useMemo(() => {
    const term = keyword.trim()
    const list = items.filter((it) => {
      if (!term) return true
      const hay = `${it.location} ${it.memo} ${formatPrice(it.dealType, it.price)} ${formatArea(it.area)}`
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
    setTransportation("")
    setRating(0)
    setMoveInType("immediate")
    setMoveInDate("")
    setAreaSqm("")
    setAreaPyeong("")
  }

  const handleCreate = async () => {
    const price =
      dealType === "월세"
        ? { deposit: toNumberOrUndefined(deposit), monthly: toNumberOrUndefined(monthly) }
        : dealType === "전세"
        ? { deposit: toNumberOrUndefined(deposit) }
        : { price: toNumberOrUndefined(buyPrice) }

    const area = {
      sqm: toNumberOrUndefined(areaSqm),
      pyeong: toNumberOrUndefined(areaPyeong)
    }

    const payload = {
      dealType,
      price,
      location,
      area,
      images: createImages,
      url,
      memo,
      transportation,
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
    setCreateImages([])
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
        area: selected.area,
        images: selected.images,
        memo: selected.memo,
        transportation: selected.transportation,
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
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-lg mx-auto px-5">
      {/* Mobile Header */}
      {mode === "list" && (
        <div className="pt-12 mb-6">
          <div className="flex items-center gap-2 mb-1">
            {onBack && (
              <button onClick={onBack} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <h1 className="text-3xl font-light text-gray-900">부동산 메모</h1>
          </div>
          <p className="text-sm text-gray-500">부동산 정보 관리</p>
        </div>
      )}
      
      {mode === "create" && (
        <div className="pt-12 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setMode("list")} className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h1 className="text-3xl font-light text-gray-900">부동산 추가</h1>
          </div>
          <p className="text-sm text-gray-500">새로운 부동산 정보를 추가하세요</p>
        </div>
      )}
      
      {/* Action Buttons */}
      {mode === "list" && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("create")}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors bg-gray-100 text-gray-700 active:bg-gray-200"
          >
            부동산 추가
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
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
                  <input value={deposit} onChange={(e) => setDeposit(e.target.value)} inputMode="numeric" placeholder="보증금" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">월세</div>
                  <input value={monthly} onChange={(e) => setMonthly(e.target.value)} inputMode="numeric" placeholder="월세" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
                </div>
              </div>
            )}

            {dealType === "전세" && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">전세가</div>
                <input value={deposit} onChange={(e) => setDeposit(e.target.value)} inputMode="numeric" placeholder="전세가" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
              </div>
            )}

            {dealType === "매매" && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">매매가</div>
                <input value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} inputMode="numeric" placeholder="매매가" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600"><MapPin className="w-4 h-4 text-gray-500" /> 위치</div>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="위치" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">면적</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">제곱미터(㎡)</div>
                  <input 
                    value={areaSqm} 
                    onChange={(e) => handleAreaSqmChange(e.target.value)} 
                    inputMode="decimal" 
                    placeholder="0" 
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">평수</div>
                  <input 
                    value={areaPyeong} 
                    onChange={(e) => handleAreaPyeongChange(e.target.value)} 
                    inputMode="decimal" 
                    placeholder="0" 
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
                  />
                </div>
              </div>
              <div className="text-xs text-gray-400">한 쪽을 입력하면 다른 쪽이 자동으로 계산됩니다 (1평 = 3.31㎡)</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">참고 URL (옵션)</div>
              <div className="flex items-center gap-2">
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="참고 URL (옵션)" className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
                {url.trim() !== "" && (
                  <a
                    href={normalizeUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium active:bg-blue-700"
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
                  <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className="px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">특이사항 메모</div>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="특이사항 메모" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 min-h-[80px]" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">교통 정보</div>
              <textarea value={transportation} onChange={(e) => setTransportation(e.target.value)} placeholder="교통편, 소요시간, 환승 정보 등" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 min-h-[80px]" />
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
                <button onClick={() => createFileInputRef.current?.click()} disabled={uploading} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium active:bg-gray-200 flex items-center gap-2 disabled:opacity-50">
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

            <button onClick={handleCreate} className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium active:bg-gray-800">
              부동산 추가
            </button>
        </div>
      )}

      {mode === "list" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="검색(위치/메모/가격/면적)"
              className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            >
              <option value="updated">최신순</option>
              <option value="rating">등급순</option>
              <option value="priceAsc">가격낮은순</option>
              <option value="priceDesc">가격높은순</option>
            </select>
          </div>

          {filteredSorted.map((item) => (
            <button key={item.id} onClick={() => { setSelectedId(item.id); setIsEditing(false) }} className="w-full text-left bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">{item.dealType}</div>
                  <div className="font-medium text-gray-900">
                    {formatPrice(item.dealType, item.price)}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="w-4 h-4" /> {item.location || "위치 미입력"}</div>
                  {formatArea(item.area) && (
                    <div className="text-sm text-gray-500">{formatArea(item.area)}</div>
                  )}
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
      </div>

      {/* Detail */}
      {selected && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 p-4 border-b">
              <button onClick={() => setSelectedId(null)} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
              <h3 className="text-base font-semibold">상세</h3>
              <div className="ml-auto flex items-center gap-2">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium active:bg-gray-200 flex items-center gap-1"><Edit3 className="w-4 h-4" />편집</button>
                ) : (
                  <button onClick={handleSaveDetail} className="px-4 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium active:bg-gray-800 flex items-center gap-1"><Save className="w-4 h-4" />저장</button>
                )}
                <button onClick={() => handleDelete(selected.id)} className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium active:bg-red-100 flex items-center gap-1"><Trash2 className="w-4 h-4" />삭제</button>
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
                    <input disabled={!isEditing} value={selected.price.deposit ?? ""} onChange={(e) => setItems(items.map((x) => x.id === selected.id ? { ...x, price: { ...x.price, deposit: toNumberOrUndefined(e.target.value) } } : x))} inputMode="numeric" placeholder="보증금" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <div className="text-xs font-medium text-gray-600">월세</div>
                    <input disabled={!isEditing} value={selected.price.monthly ?? ""} onChange={(e) => setItems(items.map((x) => x.id === selected.id ? { ...x, price: { ...x.price, monthly: toNumberOrUndefined(e.target.value) } } : x))} inputMode="numeric" placeholder="월세" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
                  </div>
                </>
              )}
              {selected.dealType === "전세" && (
                <div className="space-y-1 col-span-2">
                  <div className="text-xs font-medium text-gray-600">전세가</div>
                  <input disabled={!isEditing} value={selected.price.deposit ?? ""} onChange={(e) => setItems(items.map((x) => x.id === selected.id ? { ...x, price: { deposit: toNumberOrUndefined(e.target.value), monthly: undefined, price: undefined } } : x))} inputMode="numeric" placeholder="전세가" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
                </div>
              )}
              {selected.dealType === "매매" && (
                <div className="space-y-1 col-span-2">
                  <div className="text-xs font-medium text-gray-600">매매가</div>
                  <input disabled={!isEditing} value={selected.price.price ?? ""} onChange={(e) => setItems(items.map((x) => x.id === selected.id ? { ...x, price: { price: toNumberOrUndefined(e.target.value), deposit: undefined, monthly: undefined } } : x))} inputMode="numeric" placeholder="매매가" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600"><MapPin className="w-4 h-4 text-gray-500" /> 위치</div>
              <input disabled={!isEditing} value={selected.location} onChange={(e) => setItems(items.map((x) => x.id === selected.id ? { ...x, location: e.target.value } : x))} placeholder="위치" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">면적</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">제곱미터(㎡)</div>
                  <input 
                    disabled={!isEditing}
                    value={selected.area?.sqm ?? ""} 
                    onChange={(e) => handleDetailAreaSqmChange(e.target.value)} 
                    inputMode="decimal" 
                    placeholder="0" 
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">평수</div>
                  <input 
                    disabled={!isEditing}
                    value={selected.area?.pyeong ?? ""} 
                    onChange={(e) => handleDetailAreaPyeongChange(e.target.value)} 
                    inputMode="decimal" 
                    placeholder="0" 
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                  />
                </div>
              </div>
              {isEditing && (
                <div className="text-xs text-gray-400">한 쪽을 입력하면 다른 쪽이 자동으로 계산됩니다 (1평 = 3.31㎡)</div>
              )}
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
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-medium active:bg-blue-700"
                    >
                      바로가기
                    </a>
                    <div className="text-[11px] text-gray-500">{getHostname(selected.url)}</div>
                  </>
                ) : (
                  <input disabled={!isEditing} value={selected.url || ""} onChange={(e) => setItems(items.map((x) => x.id === selected.id ? { ...x, url: e.target.value } : x))} placeholder="참고 URL (옵션)" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
                )}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">특이사항 메모</div>
                <textarea disabled={!isEditing} value={selected.memo} onChange={(e) => setItems(items.map((x) => x.id === selected.id ? { ...x, memo: e.target.value } : x))} placeholder="특이사항 메모" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50 min-h-[100px]" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">교통 정보</div>
                <textarea disabled={!isEditing} value={selected.transportation} onChange={(e) => setItems(items.map((x) => x.id === selected.id ? { ...x, transportation: e.target.value } : x))} placeholder="교통편, 소요시간, 환승 정보 등" className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50 min-h-[100px]" />
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
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium active:bg-gray-200 flex items-center gap-2 disabled:opacity-50">
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

// Area conversion functions
const PYEONG_TO_SQM = 3.3058
const SQM_TO_PYEONG = 1 / PYEONG_TO_SQM

function pyeongToSqm(pyeong: number): number {
  return Number((pyeong * PYEONG_TO_SQM).toFixed(2))
}

function sqmToPyeong(sqm: number): number {
  return Number((sqm * SQM_TO_PYEONG).toFixed(2))
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

function formatArea(area?: RealEstateItem["area"]) {
  if (!area || (!area.sqm && !area.pyeong)) return ""
  if (area.sqm && area.pyeong) {
    return `${area.pyeong}평 (${area.sqm}㎡)`
  }
  if (area.pyeong) return `${area.pyeong}평`
  if (area.sqm) return `${area.sqm}㎡`
  return ""
}




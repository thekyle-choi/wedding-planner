"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Upload, Trash2, Image as ImageIcon, X, ChevronLeft, ChevronRight, ArrowLeft, Save, Edit3, MapPin, Star, Loader2, ChevronDown } from "lucide-react"

type DealType = "월세" | "전세" | "매매"
type ApplyStatus = "예정" | "접수중" | "마감" | "발표대기" | "발표완료"

export type SubscriptionItem = {
  id: string
  type: string // 청약 유형 (공공분양, 민간분양, 공공임대 등)
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
  subscriptions: SubscriptionItem[]
  setSubscriptions: (items: SubscriptionItem[]) => void
  onBack?: () => void
}

export default function RealEstateManager({ items, setItems, subscriptions, setSubscriptions, onBack }: RealEstateManagerProps) {
  const [mode, setMode] = useState<"list" | "create">("list")
  const [activeTab, setActiveTab] = useState<"interest" | "subscription">("interest")
  const [keyword, setKeyword] = useState<string>("")
  const [sortBy, setSortBy] = useState<"updated" | "rating" | "priceAsc" | "priceDesc">("updated")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
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

  // 청약 관련 상태
  const [subscriptionType, setSubscriptionType] = useState<string>("공공분양")
  const [subscriptionName, setSubscriptionName] = useState<string>("")
  const [subscriptionLocation, setSubscriptionLocation] = useState<string>("")
  const [applyDate, setApplyDate] = useState<string>("")
  const [applyStatus, setApplyStatus] = useState<ApplyStatus>("예정")
  const [announceDate, setAnnounceDate] = useState<string>("")
  const [subscriptionLink, setSubscriptionLink] = useState<string>("")
  const [subscriptionMemo, setSubscriptionMemo] = useState<string>("")
  const [subscriptionKeyword, setSubscriptionKeyword] = useState<string>("")
  const [subscriptionSortBy, setSubscriptionSortBy] = useState<"updated" | "applyDate">("updated")
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null)

  const selected = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId])
  const selectedSubscription = useMemo(() => subscriptions.find((i) => i.id === selectedSubscriptionId) || null, [subscriptions, selectedSubscriptionId])

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

  // 그룹화된 데이터 (지역별)
  const groupedData = useMemo(() => {
    const groups: Record<string, RealEstateItem[]> = {}
    
    filteredSorted.forEach((item) => {
      const city = extractCity(item.location)
      if (!groups[city]) {
        groups[city] = []
      }
      groups[city].push(item)
    })
    
    // 그룹을 배열로 변환하고 항목 수로 정렬
    return Object.entries(groups)
      .map(([city, items]) => ({ city, items, count: items.length }))
      .sort((a, b) => b.count - a.count)
  }, [filteredSorted])

  // 청약 필터링 및 정렬
  const filteredSortedSubscriptions = useMemo(() => {
    const term = subscriptionKeyword.trim()
    const list = subscriptions.filter((it) => {
      if (!term) return true
      const hay = `${it.type} ${it.name} ${it.location} ${it.memo || ""} ${it.applyStatus}`
      return hay.toLowerCase().includes(term.toLowerCase())
    })

    const sorted = [...list]
    sorted.sort((a, b) => {
      if (subscriptionSortBy === "applyDate") {
        return new Date(b.applyDate).getTime() - new Date(a.applyDate).getTime()
      }
      return (b.updatedAt || 0) - (a.updatedAt || 0)
    })
    return sorted
  }, [subscriptions, subscriptionKeyword, subscriptionSortBy])

  const toggleGroupExpanded = (city: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(city)) {
      newExpanded.delete(city)
    } else {
      newExpanded.add(city)
    }
    setExpandedGroups(newExpanded)
  }

  // 그룹 뷰: 처음 로딩하거나 그룹이 바뀔 때 모든 그룹 자동 확장
  useEffect(() => {
    if (groupedData.length > 0) {
      const allCities = new Set(groupedData.map(g => g.city))
      setExpandedGroups(allCities)
    }
  }, [groupedData])

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

  const resetSubscriptionForm = () => {
    setSubscriptionType("공공분양")
    setSubscriptionName("")
    setSubscriptionLocation("")
    setApplyDate("")
    setApplyStatus("예정")
    setAnnounceDate("")
    setSubscriptionLink("")
    setSubscriptionMemo("")
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

  const handleCreateSubscription = async () => {
    const payload = {
      type: subscriptionType,
      name: subscriptionName,
      location: subscriptionLocation,
      applyDate,
      applyStatus,
      announceDate: announceDate || undefined,
      link: subscriptionLink || undefined,
      memo: subscriptionMemo,
    }

    const resp = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) return
    const json = await resp.json()
    setSubscriptions([json.item as SubscriptionItem, ...subscriptions])
    resetSubscriptionForm()
    setMode("list")
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

  const handleSaveSubscriptionDetail = async () => {
    if (!selectedSubscription) return
    const resp = await fetch("/api/subscriptions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedSubscription.id,
        type: selectedSubscription.type,
        name: selectedSubscription.name,
        location: selectedSubscription.location,
        applyDate: selectedSubscription.applyDate,
        applyStatus: selectedSubscription.applyStatus,
        announceDate: selectedSubscription.announceDate,
        link: selectedSubscription.link,
        memo: selectedSubscription.memo,
      }),
    })
    if (!resp.ok) return
    const json = await resp.json()
    const updated = json.item as SubscriptionItem
    setSubscriptions(subscriptions.map((x) => (x.id === updated.id ? updated : x)))
    setIsEditing(false)
  }

  const handleDeleteSubscription = async (id: string) => {
    const resp = await fetch("/api/subscriptions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!resp.ok) return
    setSubscriptions(subscriptions.filter((x) => x.id !== id))
    if (selectedSubscriptionId === id) setSelectedSubscriptionId(null)
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
          
          {/* 탭 추가 */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("interest")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "interest"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              관심
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "subscription"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              청약
            </button>
          </div>
        </div>
      )}
      
      {mode === "create" && (
        <div className="pt-12 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setMode("list")} className="p-2 -ml-2">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h1 className="text-3xl font-light text-gray-900">{activeTab === "interest" ? "부동산 추가" : "청약 추가"}</h1>
          </div>
          <p className="text-sm text-gray-500">{activeTab === "interest" ? "새로운 부동산 정보를 추가하세요" : "새로운 청약 정보를 추가하세요"}</p>
        </div>
      )}
      
      {/* Action Buttons */}
      {mode === "list" && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("create")}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors bg-gray-100 text-gray-700 active:bg-gray-200"
          >
            {activeTab === "interest" ? "부동산 추가" : "청약 추가"}
          </button>
        </div>
      )}

      {mode === "create" && activeTab === "interest" && (
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

      {mode === "create" && activeTab === "subscription" && (
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">청약 유형</div>
            <input 
              value={subscriptionType} 
              onChange={(e) => setSubscriptionType(e.target.value)} 
              placeholder="예: 공공분양, 민간분양, 공공임대" 
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">단지명/청약명</div>
            <input 
              value={subscriptionName} 
              onChange={(e) => setSubscriptionName(e.target.value)} 
              placeholder="예: 행복도시 A-1BL" 
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">위치</div>
            <input 
              value={subscriptionLocation} 
              onChange={(e) => setSubscriptionLocation(e.target.value)} 
              placeholder="예: 세종시 행복동" 
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">접수일</div>
              <input 
                type="date" 
                value={applyDate} 
                onChange={(e) => setApplyDate(e.target.value)} 
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">발표일</div>
              <input 
                type="date" 
                value={announceDate} 
                onChange={(e) => setAnnounceDate(e.target.value)} 
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">접수 상태</div>
            <div className="grid grid-cols-5 gap-2">
              {(["예정", "접수중", "마감", "발표대기", "발표완료"] as ApplyStatus[]).map((status) => (
                <button 
                  key={status}
                  onClick={() => setApplyStatus(status)} 
                  className={`py-2 px-3 rounded-lg text-xs ${
                    applyStatus === status ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">관련 링크 (옵션)</div>
            <input 
              value={subscriptionLink} 
              onChange={(e) => setSubscriptionLink(e.target.value)} 
              placeholder="관련 페이지 URL" 
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">메모</div>
            <textarea 
              value={subscriptionMemo} 
              onChange={(e) => setSubscriptionMemo(e.target.value)} 
              placeholder="특이사항 메모" 
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 min-h-[80px]" 
            />
          </div>

          <button 
            onClick={handleCreateSubscription} 
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium active:bg-gray-800"
          >
            청약 추가
          </button>
        </div>
      )}

      {mode === "list" && (
        <div className="space-y-3">
          {activeTab === "interest" ? (
            <>
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
              
              {/* Group View (통합) */}
              {groupedData.map(({ city, items, count }) => (
                <div key={city} className="bg-gray-50 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleGroupExpanded(city)}
                    className="w-full p-4 text-left hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedGroups.has(city) ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <h3 className="text-base font-medium text-gray-900">{city}</h3>
                        <span className="text-sm text-gray-500">({count}개)</span>
                      </div>
                    </div>
                  </button>
                  
                  {expandedGroups.has(city) && (
                    <div className="px-4 pb-4 space-y-2">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { setSelectedId(item.id); setIsEditing(false) }}
                          className="w-full text-left bg-white rounded-xl p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <div className="text-sm text-gray-500">{item.dealType}</div>
                              <div className="font-medium text-gray-900 text-sm">
                                {formatPrice(item.dealType, item.price)}
                              </div>
                              <div className="text-xs text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {item.location || "위치 미입력"}
                              </div>
                              {formatArea(item.area) && (
                                <div className="text-xs text-gray-500">{formatArea(item.area)}</div>
                              )}
                              <div className="flex items-center gap-1 pt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${item.rating >= i + 1 ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                                ))}
                              </div>
                            </div>
                            {item.images.length > 0 && (
                              <img src={item.images[0]} alt="preview" className="w-16 h-16 object-cover rounded-lg" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <>
              {/* 청약 탭 UI */}
              <div className="flex items-center gap-2">
                <input
                  value={subscriptionKeyword}
                  onChange={(e) => setSubscriptionKeyword(e.target.value)}
                  placeholder="검색(유형/단지명/위치/메모)"
                  className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                />
                <select
                  value={subscriptionSortBy}
                  onChange={(e) => setSubscriptionSortBy(e.target.value as any)}
                  className="px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="updated">최신순</option>
                  <option value="applyDate">접수일순</option>
                </select>
              </div>
              
              {/* 청약 리스트 */}
              <div className="space-y-2">
                {filteredSortedSubscriptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">등록된 청약 정보가 없습니다</p>
                  </div>
                ) : (
                  filteredSortedSubscriptions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedSubscriptionId(item.id); setIsEditing(false) }}
                      className="w-full text-left bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            item.applyStatus === "접수중" ? "bg-green-100 text-green-700" :
                            item.applyStatus === "예정" ? "bg-blue-100 text-blue-700" :
                            item.applyStatus === "마감" ? "bg-gray-100 text-gray-700" :
                            item.applyStatus === "발표대기" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {item.applyStatus}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="mr-3">{item.type}</span>
                          <span className="mr-3">{item.location}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          접수일: {item.applyDate || "미정"}
                          {item.announceDate && ` · 발표일: ${item.announceDate}`}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
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

      {/* 청약 상세 */}
      {selectedSubscription && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 p-4 border-b">
              <button onClick={() => setSelectedSubscriptionId(null)} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
              <h3 className="text-base font-semibold">청약 상세</h3>
              <div className="ml-auto flex items-center gap-2">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium active:bg-gray-200 flex items-center gap-1"><Edit3 className="w-4 h-4" />편집</button>
                ) : (
                  <button onClick={handleSaveSubscriptionDetail} className="px-4 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium active:bg-gray-800 flex items-center gap-1"><Save className="w-4 h-4" />저장</button>
                )}
                <button onClick={() => handleDeleteSubscription(selectedSubscription.id)} className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium active:bg-red-100 flex items-center gap-1"><Trash2 className="w-4 h-4" />삭제</button>
              </div>
            </div>

            <div className="p-4 space-y-4 pb-28">
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">청약 유형</div>
                <input 
                  disabled={!isEditing} 
                  value={selectedSubscription.type} 
                  onChange={(e) => setSubscriptions(subscriptions.map((x) => x.id === selectedSubscription.id ? { ...x, type: e.target.value } : x))} 
                  placeholder="청약 유형" 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">단지명/청약명</div>
                <input 
                  disabled={!isEditing} 
                  value={selectedSubscription.name} 
                  onChange={(e) => setSubscriptions(subscriptions.map((x) => x.id === selectedSubscription.id ? { ...x, name: e.target.value } : x))} 
                  placeholder="단지명" 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">위치</div>
                <input 
                  disabled={!isEditing} 
                  value={selectedSubscription.location} 
                  onChange={(e) => setSubscriptions(subscriptions.map((x) => x.id === selectedSubscription.id ? { ...x, location: e.target.value } : x))} 
                  placeholder="위치" 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">접수일</div>
                  <input 
                    disabled={!isEditing}
                    type="date" 
                    value={selectedSubscription.applyDate} 
                    onChange={(e) => setSubscriptions(subscriptions.map((x) => x.id === selectedSubscription.id ? { ...x, applyDate: e.target.value } : x))} 
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">발표일</div>
                  <input 
                    disabled={!isEditing}
                    type="date" 
                    value={selectedSubscription.announceDate || ""} 
                    onChange={(e) => setSubscriptions(subscriptions.map((x) => x.id === selectedSubscription.id ? { ...x, announceDate: e.target.value || undefined } : x))} 
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">접수 상태</div>
                <div className="grid grid-cols-5 gap-2">
                  {(["예정", "접수중", "마감", "발표대기", "발표완료"] as ApplyStatus[]).map((status) => (
                    <button 
                      key={status}
                      disabled={!isEditing}
                      onClick={() => setSubscriptions(subscriptions.map((x) => x.id === selectedSubscription.id ? { ...x, applyStatus: status } : x))} 
                      className={`py-2 px-3 rounded-lg text-xs ${
                        selectedSubscription.applyStatus === status ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
                      } disabled:opacity-50`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">관련 링크 (옵션)</div>
                {(!isEditing && selectedSubscription.link && selectedSubscription.link.trim() !== "") ? (
                  <>
                    <a
                      href={normalizeUrl(selectedSubscription.link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-medium active:bg-blue-700"
                    >
                      바로가기
                    </a>
                    <div className="text-[11px] text-gray-500">{getHostname(selectedSubscription.link)}</div>
                  </>
                ) : (
                  <input 
                    disabled={!isEditing} 
                    value={selectedSubscription.link || ""} 
                    onChange={(e) => setSubscriptions(subscriptions.map((x) => x.id === selectedSubscription.id ? { ...x, link: e.target.value || undefined } : x))} 
                    placeholder="관련 링크 (옵션)" 
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                  />
                )}
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">메모</div>
                <textarea 
                  disabled={!isEditing} 
                  value={selectedSubscription.memo || ""} 
                  onChange={(e) => setSubscriptions(subscriptions.map((x) => x.id === selectedSubscription.id ? { ...x, memo: e.target.value || undefined } : x))} 
                  placeholder="메모" 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50 min-h-[100px]" 
                />
              </div>
            </div>
          </div>
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

// 지역명에서 시 이름 추출
function extractCity(location: string): string {
  if (!location) return "기타"
  
  // 시 단위 추출 (예: "경기도 의정부시" → "의정부시")
  const cityMatch = location.match(/([가-힣]+시)/);
  if (cityMatch) {
    return cityMatch[1];
  }
  
  // 구 단위 추출 (예: "서울특별시 강남구" → "강남구")
  const guMatch = location.match(/([가-힣]+구)/);
  if (guMatch) {
    return guMatch[1];
  }
  
  // 군 단위 추출 (예: "경기도 가평군" → "가평군")
  const gunMatch = location.match(/([가-힣]+군)/);
  if (gunMatch) {
    return gunMatch[1];
  }
  
  // 특별한 경우들 처리
  if (location.includes("서울")) return "서울";
  if (location.includes("인천")) return "인천";
  if (location.includes("대전")) return "대전";
  if (location.includes("대구")) return "대구";
  if (location.includes("부산")) return "부산";
  if (location.includes("광주")) return "광주";
  if (location.includes("울산")) return "울산";
  if (location.includes("세종")) return "세종";
  
  return "기타";
}




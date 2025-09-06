"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Plus, Trash2, Edit3, Save, Star, ChevronDown, ChevronRight, ExternalLink, Upload, Image as ImageIcon, X, ChevronLeft, Loader2 } from "lucide-react"

export type ApplianceCategory = {
  id: string
  name: string
  items: ApplianceItem[]
  createdAt: number
  updatedAt: number
}

export type ApplianceItem = {
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

interface ApplianceManagerProps {
  categories: ApplianceCategory[]
  setCategories: (categories: ApplianceCategory[]) => void
  onBack?: () => void
}

export default function ApplianceManager({ categories, setCategories, onBack }: ApplianceManagerProps) {
  const [mode, setMode] = useState<"list" | "create-category" | "create-item">("list")
  const [keyword, setKeyword] = useState<string>("")
  const [sortBy, setSortBy] = useState<"updated" | "price">("updated")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<{ images: string[]; index: number } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const createFileInputRef = useRef<HTMLInputElement | null>(null)

  // Category form
  const [categoryName, setCategoryName] = useState<string>("")

  // Item form
  const [itemName, setItemName] = useState<string>("")
  const [itemBrand, setItemBrand] = useState<string>("")
  const [itemModel, setItemModel] = useState<string>("")
  const [itemSpecs, setItemSpecs] = useState<string>("")
  const [itemPrice, setItemPrice] = useState<string>("")
  const [itemUrl, setItemUrl] = useState<string>("")
  const [itemNotes, setItemNotes] = useState<string>("")
  const [createImages, setCreateImages] = useState<string[]>([])

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null
    for (const category of categories) {
      const item = category.items.find(i => i.id === selectedItemId)
      if (item) return item
    }
    return null
  }, [categories, selectedItemId])

  const filteredCategories = useMemo(() => {
    const term = keyword.trim().toLowerCase()
    if (!term) return categories

    return categories.map(category => ({
      ...category,
      items: category.items.filter(item => 
        item.name.toLowerCase().includes(term) ||
        (item.brand || "").toLowerCase().includes(term) ||
        (item.model || "").toLowerCase().includes(term) ||
        (item.specs || "").toLowerCase().includes(term) ||
        (item.notes || "").toLowerCase().includes(term)
      )
    })).filter(category => 
      category.name.toLowerCase().includes(term) || category.items.length > 0
    )
  }, [categories, keyword])

  const sortedCategories = useMemo(() => {
    return [...filteredCategories].map(category => ({
      ...category,
      items: [...category.items].sort((a, b) => {
        switch (sortBy) {
          case "price":
            return a.price - b.price
          case "updated":
          default:
            return (b.updatedAt || 0) - (a.updatedAt || 0)
        }
      })
    })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }, [filteredCategories, sortBy])

  // Calculate total price based on average price per category
  const totalPrice = useMemo(() => {
    return categories.reduce((sum, category) => {
      if (category.items.length === 0) return sum
      const avgPrice = category.items.reduce((itemSum, item) => itemSum + item.price, 0) / category.items.length
      return sum + avgPrice
    }, 0)
  }, [categories])

  // Auto-expand all categories when data changes
  useEffect(() => {
    if (sortedCategories.length > 0) {
      const allCategoryIds = new Set(sortedCategories.map(c => c.id))
      setExpandedCategories(allCategoryIds)
    }
  }, [sortedCategories])

  const toggleCategoryExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const resetCategoryForm = () => {
    setCategoryName("")
  }

  const resetItemForm = () => {
    setItemName("")
    setItemBrand("")
    setItemModel("")
    setItemSpecs("")
    setItemPrice("")
    setItemUrl("")
    setItemNotes("")
    setCreateImages([])
  }

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return

    const newCategory: ApplianceCategory = {
      id: Date.now().toString(),
      name: categoryName.trim(),
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const newCategories = [newCategory, ...categories]
    setCategories(newCategories)
    resetCategoryForm()
    setMode("list")
  }

  const handleCreateItem = async () => {
    if (!selectedCategoryId || !itemName.trim()) return

    const newItem: ApplianceItem = {
      id: Date.now().toString(),
      categoryId: selectedCategoryId,
      name: itemName.trim(),
      brand: itemBrand.trim() || undefined,
      model: itemModel.trim() || undefined,
      specs: itemSpecs.trim() || undefined,
      price: parseFloat(itemPrice.replace(/[^\d.]/g, "")) || 0,
      url: itemUrl.trim() || undefined,
      notes: itemNotes.trim() || undefined,
      images: createImages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const newCategories = categories.map(category => 
      category.id === selectedCategoryId
        ? { ...category, items: [newItem, ...category.items], updatedAt: Date.now() }
        : category
    )

    setCategories(newCategories)
    resetItemForm()
    setMode("list")
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const newCategories = categories.filter(c => c.id !== categoryId)
    setCategories(newCategories)
  }

  const handleDeleteItem = async (itemId: string) => {
    const newCategories = categories.map(category => ({
      ...category,
      items: category.items.filter(item => item.id !== itemId),
      updatedAt: Date.now()
    }))
    setCategories(newCategories)
    if (selectedItemId === itemId) {
      setSelectedItemId(null)
    }
  }

  const handleSaveItem = async () => {
    if (!selectedItem) return

    const updatedItem: ApplianceItem = {
      ...selectedItem,
      updatedAt: Date.now(),
    }

    const newCategories = categories.map(category => ({
      ...category,
      items: category.items.map(item => 
        item.id === selectedItem.id ? updatedItem : item
      ),
      updatedAt: Date.now()
    }))

    setCategories(newCategories)
    setIsEditing(false)
  }

  const normalizeUrl = (url: string): string => {
    const trimmed = (url || "").trim()
    if (!trimmed) return "#"
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }

  const getHostname = (url: string): string => {
    try {
      const href = normalizeUrl(url)
      const u = new URL(href)
      return u.hostname.replace(/^www\./, "")
    } catch {
      return ""
    }
  }

  // Image upload handlers
  const uploadImages = useCallback(async (item: ApplianceItem, fileList: File[] | FileList | null) => {
    if (!fileList || ("length" in fileList && fileList.length === 0)) return
    const files = Array.isArray(fileList) ? fileList : Array.from(fileList)
    setUploading(true)
    try {
      // 미리보기 즉시 반영: optimistic UI
      const tempUrls: string[] = files.map((f) => URL.createObjectURL(f))
      const newCategories = categories.map(category => ({
        ...category,
        items: category.items.map(i => 
          i.id === item.id 
            ? { ...i, images: [...i.images, ...tempUrls], updatedAt: Date.now() } 
            : i
        ),
        updatedAt: Date.now()
      }))
      setCategories(newCategories)

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
      const finalCategories = categories.map(category => ({
        ...category,
        items: category.items.map(i => 
          i.id === item.id 
            ? { ...i, images: serverImages, updatedAt: Date.now() } 
            : i
        ),
        updatedAt: Date.now()
      }))
      setCategories(finalCategories)
      
      if (fileInputRef.current) fileInputRef.current.value = ""
    } finally {
      setUploading(false)
    }
  }, [categories, setCategories])

  // create-mode images
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

  // Clipboard paste handlers
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!selectedItem) return
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
        await uploadImages(selectedItem, files)
      }
    }
    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [selectedItem, uploadImages])

  // Clipboard paste handler (create mode)
  useEffect(() => {
    if (mode !== "create-item") return
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
  }, [mode, uploadCreateImages])

  const openPreview = (images: string[], index: number) => setPreview({ images, index })
  const closePreview = () => setPreview(null)
  const showPrev = () => preview && setPreview({ images: preview.images, index: (preview.index - 1 + preview.images.length) % preview.images.length })
  const showNext = () => preview && setPreview({ images: preview.images, index: (preview.index + 1) % preview.images.length })

  const formatPrice = (price: number): string => {
    return price.toLocaleString() + "원"
  }

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
              <h1 className="text-3xl font-light text-gray-900">가전 관리</h1>
            </div>
            <p className="text-sm text-gray-500">가전제품 후보 목록 관리</p>
            
            {/* Total price display */}
            <div className="mt-4 p-4 bg-yellow-50 rounded-2xl">
              <div className="text-center">
                <p className="text-2xl font-light text-gray-900">{formatPrice(totalPrice)}</p>
                <p className="text-sm text-gray-600">평균 가격 기준 총 가격</p>
              </div>
            </div>
          </div>
        )}

        {mode === "create-category" && (
          <div className="pt-12 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setMode("list")} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <h1 className="text-3xl font-light text-gray-900">카테고리 추가</h1>
            </div>
            <p className="text-sm text-gray-500">새로운 가전 카테고리를 추가하세요</p>
          </div>
        )}

        {mode === "create-item" && (
          <div className="pt-12 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setMode("list")} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <h1 className="text-3xl font-light text-gray-900">제품 추가</h1>
            </div>
            <p className="text-sm text-gray-500">새로운 제품을 추가하세요</p>
          </div>
        )}

        {/* Action Buttons */}
        {mode === "list" && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("create-category")}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors bg-gray-100 text-gray-700 active:bg-gray-200"
            >
              카테고리 추가
            </button>
          </div>
        )}

        {/* Create Category Form */}
        {mode === "create-category" && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">카테고리 이름</div>
              <input 
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="예: TV, 세탁기, 냉장고" 
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
              />
            </div>

            <button 
              onClick={handleCreateCategory}
              disabled={!categoryName.trim()}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium active:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              카테고리 추가
            </button>
          </div>
        )}

        {/* Create Item Form */}
        {mode === "create-item" && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">제품명 *</div>
              <input 
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="제품명을 입력하세요" 
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">브랜드</div>
                <input 
                  value={itemBrand}
                  onChange={(e) => setItemBrand(e.target.value)}
                  placeholder="예: 삼성, LG" 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">모델명</div>
                <input 
                  value={itemModel}
                  onChange={(e) => setItemModel(e.target.value)}
                  placeholder="모델명" 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">규격/사양</div>
              <input 
                value={itemSpecs}
                onChange={(e) => setItemSpecs(e.target.value)}
                placeholder="예: 55인치, 20kg, 500L" 
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">가격 *</div>
              <input 
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                inputMode="numeric"
                placeholder="0" 
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">참고 URL</div>
              <input 
                value={itemUrl}
                onChange={(e) => setItemUrl(e.target.value)}
                placeholder="제품 페이지 URL" 
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" 
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">메모</div>
              <textarea 
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="특이사항, 장단점 등" 
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 min-h-[80px]" 
              />
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

            <button 
              onClick={handleCreateItem}
              disabled={!itemName.trim() || !itemPrice.trim()}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium active:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              제품 추가
            </button>
          </div>
        )}

        {/* List View */}
        {mode === "list" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="검색(카테고리/제품명/브랜드/모델)"
                className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              >
                <option value="updated">최신순</option>
                <option value="price">가격순</option>
              </select>
            </div>

            {/* Categories */}
            {sortedCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">등록된 가전 카테고리가 없습니다</p>
              </div>
            ) : (
              sortedCategories.map((category) => (
                <div key={category.id} className="bg-gray-50 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <button
                      onClick={() => toggleCategoryExpanded(category.id)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      {expandedCategories.has(category.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <h3 className="text-base font-medium text-gray-900">{category.name}</h3>
                      <span className="text-sm text-gray-500">({category.items.length}개)</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCategoryId(category.id)
                          setMode("create-item")
                        }}
                        className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {expandedCategories.has(category.id) && (
                    <div className="px-4 pb-4 space-y-2">
                      {category.items.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          등록된 제품이 없습니다
                        </div>
                      ) : (
                        category.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => { setSelectedItemId(item.id); setIsEditing(false) }}
                            className="w-full text-left bg-white rounded-xl p-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                                </div>
                                {(item.brand || item.model) && (
                                  <div className="text-xs text-gray-600">
                                    {item.brand} {item.model}
                                  </div>
                                )}
                                {item.specs && (
                                  <div className="text-xs text-gray-500">{item.specs}</div>
                                )}
                                <div className="font-medium text-gray-900 text-sm">
                                  {formatPrice(item.price)}
                                </div>
                              </div>
                              {item.images && item.images.length > 0 && (
                                <img src={item.images[0]} alt="preview" className="w-16 h-16 object-cover rounded-lg" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 p-4 border-b">
              <button onClick={() => setSelectedItemId(null)} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <h3 className="text-base font-semibold">제품 상세</h3>
              <div className="ml-auto flex items-center gap-2">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium active:bg-gray-200 flex items-center gap-1">
                    <Edit3 className="w-4 h-4" />편집
                  </button>
                ) : (
                  <button onClick={handleSaveItem} className="px-4 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium active:bg-gray-800 flex items-center gap-1">
                    <Save className="w-4 h-4" />저장
                  </button>
                )}
                <button onClick={() => handleDeleteItem(selectedItem.id)} className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium active:bg-red-100 flex items-center gap-1">
                  <Trash2 className="w-4 h-4" />삭제
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 pb-28">
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">제품명</div>
                <input 
                  disabled={!isEditing}
                  value={selectedItem.name} 
                  onChange={(e) => setCategories(categories.map(cat => ({
                    ...cat,
                    items: cat.items.map(item => 
                      item.id === selectedItem.id ? { ...item, name: e.target.value } : item
                    )
                  })))}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">브랜드</div>
                  <input 
                    disabled={!isEditing}
                    value={selectedItem.brand || ""} 
                    onChange={(e) => setCategories(categories.map(cat => ({
                      ...cat,
                      items: cat.items.map(item => 
                        item.id === selectedItem.id ? { ...item, brand: e.target.value || undefined } : item
                      )
                    })))}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">모델명</div>
                  <input 
                    disabled={!isEditing}
                    value={selectedItem.model || ""} 
                    onChange={(e) => setCategories(categories.map(cat => ({
                      ...cat,
                      items: cat.items.map(item => 
                        item.id === selectedItem.id ? { ...item, model: e.target.value || undefined } : item
                      )
                    })))}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">규격/사양</div>
                <input 
                  disabled={!isEditing}
                  value={selectedItem.specs || ""} 
                  onChange={(e) => setCategories(categories.map(cat => ({
                    ...cat,
                    items: cat.items.map(item => 
                      item.id === selectedItem.id ? { ...item, specs: e.target.value || undefined } : item
                    )
                  })))}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">가격</div>
                <input 
                  disabled={!isEditing}
                  value={selectedItem.price} 
                  onChange={(e) => setCategories(categories.map(cat => ({
                    ...cat,
                    items: cat.items.map(item => 
                      item.id === selectedItem.id ? { ...item, price: parseFloat(e.target.value.replace(/[^\d.]/g, "")) || 0 } : item
                    )
                  })))}
                  inputMode="numeric"
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">참고 URL</div>
                {(!isEditing && selectedItem.url && selectedItem.url.trim() !== "") ? (
                  <>
                    <a
                      href={normalizeUrl(selectedItem.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-medium active:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      제품 페이지 보기
                    </a>
                    <div className="text-[11px] text-gray-500">{getHostname(selectedItem.url)}</div>
                  </>
                ) : (
                  <input 
                    disabled={!isEditing}
                    value={selectedItem.url || ""} 
                    onChange={(e) => setCategories(categories.map(cat => ({
                      ...cat,
                      items: cat.items.map(item => 
                        item.id === selectedItem.id ? { ...item, url: e.target.value || undefined } : item
                      )
                    })))}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" 
                  />
                )}
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">메모</div>
                <textarea 
                  disabled={!isEditing}
                  value={selectedItem.notes || ""} 
                  onChange={(e) => setCategories(categories.map(cat => ({
                    ...cat,
                    items: cat.items.map(item => 
                      item.id === selectedItem.id ? { ...item, notes: e.target.value || undefined } : item
                    )
                  })))}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50 min-h-[100px]" 
                />
              </div>

              <div className="space-y-3">
                <div className="text-xs font-medium text-gray-600">이미지</div>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => selectedItem && uploadImages(selectedItem, e.target.files)} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium active:bg-gray-200 flex items-center gap-2 disabled:opacity-50">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 이미지 업로드
                  </button>
                  <div className="text-xs text-gray-500">클립보드 붙여넣기 지원</div>
                </div>

                {selectedItem.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedItem.images.map((url, idx) => (
                      <button key={idx} onClick={() => openPreview(selectedItem.images, idx)} className="relative">
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
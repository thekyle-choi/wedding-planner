"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Plus, Upload, Trash2, Image as ImageIcon, X, ChevronLeft, ChevronRight, ArrowLeft, Save, Edit3, Grid, List, Tag } from "lucide-react"

type NoteItem = {
  id: string
  title: string
  content: string
  category: string
  images: string[]
  createdAt: number
  updatedAt: number
}

interface NotesManagerProps {
  notes: NoteItem[]
  setNotes: (notes: NoteItem[]) => void
}

const categoryOptions = [
  { value: "general", label: "일반", color: "bg-gray-100 text-gray-800" },
  { value: "important", label: "중요", color: "bg-red-100 text-red-800" },
  { value: "ideas", label: "아이디어", color: "bg-blue-100 text-blue-800" },
  { value: "todo", label: "할 일", color: "bg-green-100 text-green-800" },
  { value: "meeting", label: "회의", color: "bg-purple-100 text-purple-800" },
  { value: "wedding", label: "웨딩", color: "bg-pink-100 text-pink-800" },
  { value: "planning", label: "기획", color: "bg-yellow-100 text-yellow-800" },
  { value: "reference", label: "참고자료", color: "bg-indigo-100 text-indigo-800" }
]

export default function NotesManager({ notes, setNotes }: NotesManagerProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [mode, setMode] = useState<"list" | "create">("list")
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<{ images: string[]; index: number } | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId])

  const groupedNotes = useMemo(() => {
    const groups: Record<string, NoteItem[]> = {}
    notes.forEach(note => {
      const category = note.category || "uncategorized"
      if (!groups[category]) groups[category] = []
      groups[category].push(note)
    })
    return groups
  }, [notes])

  const getCategoryInfo = (categoryValue: string) => {
    if (!categoryValue) return { value: "uncategorized", label: "미분류", color: "bg-gray-100 text-gray-500" }
    return categoryOptions.find(cat => cat.value === categoryValue) || { value: categoryValue, label: categoryValue, color: "bg-gray-100 text-gray-800" }
  }


  useEffect(() => {
    // nothing
  }, [])


  const handleAddNote = async () => {
    const payload = { title, content, category, images: [] as string[] }
    const resp = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) return
    const data = await resp.json()
    setNotes([data.item, ...notes])
    setTitle("")
    setContent("")
    setCategory("")
    setMode("list")
  }

  const handleDelete = async (id: string) => {
    const resp = await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!resp.ok) return
    setNotes(notes.filter((n) => n.id !== id))
  }

  const handleUploadImages = async (note: NoteItem, files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append("file", file)
        const resp = await fetch("/api/upload", { method: "POST", body: fd })
        if (resp.ok) {
          const json = await resp.json()
          if (json.url) urls.push(json.url)
        }
      }
      const updated = { ...note, images: [...note.images, ...urls] }
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, images: updated.images }),
      })
      setNotes(notes.map((n) => (n.id === note.id ? updated : n)))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSaveDetail = async () => {
    if (!selectedNote) return
    const resp = await fetch("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedNote.id, title: selectedNote.title, content: selectedNote.content, category: selectedNote.category }),
    })
    if (!resp.ok) return
    const json = await resp.json()
    const updated = json.item as NoteItem
    setNotes(notes.map((n) => (n.id === updated.id ? updated : n)))
    setIsEditing(false)
  }

  const openPreview = (images: string[], index: number) => {
    setPreview({ images, index })
  }

  const closePreview = () => setPreview(null)

  const showPrev = () => {
    if (!preview) return
    setPreview({ images: preview.images, index: (preview.index - 1 + preview.images.length) % preview.images.length })
  }

  const showNext = () => {
    if (!preview) return
    setPreview({ images: preview.images, index: (preview.index + 1) % preview.images.length })
  }

  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview()
      if (e.key === "ArrowLeft") showPrev()
      if (e.key === "ArrowRight") showNext()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [preview])

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-lg mx-auto px-5">
        {/* Mobile Header */}
        <div className="pt-12 mb-6">
        {selectedNote ? (
          <div className="flex items-center gap-2">
            <button className="p-2 -ml-2 rounded-xl hover:bg-gray-100" onClick={() => { setSelectedId(null); setIsEditing(false) }} aria-label="뒤로">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-light text-gray-900 mb-1">메모 상세</h1>
          </div>
        ) : mode === "create" ? (
          <div className="flex items-center gap-2">
            <button className="p-2 -ml-2 rounded-xl hover:bg-gray-100" onClick={() => setMode("list")} aria-label="뒤로">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-light text-gray-900 mb-1">새 메모 작성</h1>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-light text-gray-900 mb-1">메모</h1>
            </div>
            <p className="text-sm text-gray-500 mb-6">간단한 메모와 사진을 보관하세요</p>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode("create")}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors bg-gray-100 text-gray-700 active:bg-gray-200"
              >
                메모 추가
              </button>
              <div className="flex items-center gap-0">
                <div className="flex rounded-lg bg-gray-100 p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                      viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                      viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        </div>

        {mode === "create" && !selectedNote && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
            <input
              className="w-full bg-white rounded-xl p-3 text-sm outline-none border border-gray-200 focus:border-gray-400 transition"
              placeholder="메모 제목 (예: 웨딩 아이디어)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full bg-white rounded-xl p-3 text-sm outline-none border border-gray-200 focus:border-gray-400 transition"
              rows={8}
              placeholder="메모 내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <input
              className="w-full bg-white rounded-xl p-3 text-sm outline-none border border-gray-200 focus:border-gray-400 transition"
              placeholder="카테고리 (예: 아이디어, 할 일, 중요...)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <button
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium active:bg-gray-800 disabled:opacity-50"
              onClick={handleAddNote}
              disabled={!content.trim() && !title.trim()}
            >
              메모 저장
            </button>
          </div>
        )}

        {mode === "list" && !selectedNote ? (
          <div className="space-y-6">
            {Object.entries(groupedNotes).map(([categoryValue, categoryNotes]) => {
              const categoryInfo = getCategoryInfo(categoryValue)
              return (
                <div key={categoryValue}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${categoryInfo.color}`}>
                      <Tag className="w-3 h-3 inline mr-1" />
                      {categoryInfo.label}
                    </span>
                    <span className="text-xs text-gray-400">({categoryNotes.length}개)</span>
                  </div>
                  
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 gap-2">
                      {categoryNotes.map((note) => (
                        <button
                          key={note.id}
                          className="text-left border border-gray-100 rounded-xl p-3 active:bg-gray-50 h-32 flex flex-col"
                          onClick={() => setSelectedId(note.id)}
                        >
                          <p className="text-sm font-medium text-gray-900 truncate mb-1">
                            {note.title || "제목 없음"}
                          </p>
                          
                          {note.images.length > 0 && (
                            <div className="flex gap-1 mb-2 overflow-hidden">
                              {note.images.slice(0, 4).map((image, idx) => (
                                <div key={idx} className="w-6 h-6 rounded bg-gray-100 overflow-hidden shrink-0">
                                  <img 
                                    src={image} 
                                    alt="" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {note.images.length > 4 && (
                                <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center shrink-0">
                                  <span className="text-[8px] text-gray-600">+{note.images.length - 4}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500 flex-1 line-clamp-2 leading-relaxed mb-2">
                            {note.content}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            {note.images.length > 0 && (
                              <div className="flex items-center text-gray-400">
                                <ImageIcon className="w-3 h-3 mr-1" />
                                <span className="text-[10px]">{note.images.length}</span>
                              </div>
                            )}
                            <div className="text-[10px] text-gray-400 ml-auto">
                              {new Date(note.updatedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                ) : (
                  <div className="space-y-2">
                    {categoryNotes.map((note) => (
                      <button
                        key={note.id}
                        className="w-full text-left border border-gray-100 rounded-xl p-4 active:bg-gray-50"
                        onClick={() => setSelectedId(note.id)}
                      >
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-gray-900 truncate mb-1">
                            {note.title || "제목 없음"}
                          </p>
                          
                          {note.images.length > 0 && (
                            <div className="flex gap-1 mb-2 overflow-hidden">
                              {note.images.slice(0, 6).map((image, idx) => (
                                <div key={idx} className="w-6 h-6 rounded bg-gray-100 overflow-hidden shrink-0">
                                  <img 
                                    src={image} 
                                    alt="" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {note.images.length > 6 && (
                                <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center shrink-0">
                                  <span className="text-[8px] text-gray-600">+{note.images.length - 6}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500 truncate mb-2">{note.content}</p>
                          
                          <div className="flex items-center justify-between">
                            {note.images.length > 0 && (
                              <div className="flex items-center text-gray-400">
                                <ImageIcon className="w-3 h-3 mr-1" />
                                <span className="text-[10px]">{note.images.length}개 이미지</span>
                              </div>
                            )}
                            <div className="text-[10px] text-gray-400 ml-auto">
                              {new Date(note.updatedAt).toLocaleDateString("ko-KR")}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          
          {notes.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">메모를 추가해보세요</p>
              <p className="text-sm text-gray-400">카테고리별로 정리해서 관리할 수 있어요</p>
            </div>
          )}
        </div>
        ) : (
          selectedNote && (
          <div className="border border-gray-100 rounded-2xl p-4">
            {!isEditing ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="pr-3 min-w-0">
                    <p className="text-base font-medium text-gray-900 break-words">{selectedNote.title || "제목 없음"}</p>
                    <div className="flex items-center gap-2 mt-1 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryInfo(selectedNote.category).color}`}>
                        <Tag className="w-3 h-3 inline mr-1" />
                        {getCategoryInfo(selectedNote.category).label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedNote.content}</p>
                  </div>
                  <button className="text-gray-500 hover:text-gray-900" onClick={() => setIsEditing(true)} aria-label="편집">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2">
                  {selectedNote.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedNote.images.map((url, idx) => (
                      <button key={idx} type="button" onClick={() => openPreview(selectedNote.images, idx)} className="group relative">
                        <img src={url} alt="note" className="w-full h-24 object-cover rounded-xl border border-gray-100" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-1" /> 첨부된 이미지가 없습니다
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[10px] text-gray-400">{new Date(selectedNote.updatedAt).toLocaleString("ko-KR")}</div>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUploadImages(selectedNote, e.target.files)} />
                  <button className="px-3 py-2 rounded-xl bg-gray-100 text-gray-900 text-xs disabled:opacity-50" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload className="inline-block w-3.5 h-3.5 mr-1" /> 이미지 추가
                  </button>
                  <button className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs hover:bg-red-100" onClick={() => { handleDelete(selectedNote.id); setSelectedId(null) }}>
                    <Trash2 className="inline-block w-3.5 h-3.5 mr-1" /> 삭제
                  </button>
                </div>
              </div>
            </div>
            ) : (
              <div className="space-y-2">
                <input
                  className="w-full bg-white rounded-xl p-3 text-sm outline-none border border-gray-200 focus:border-gray-400 transition"
                  value={selectedNote.title}
                  onChange={(e) => {
                    const next = { ...selectedNote, title: e.target.value }
                    setNotes(notes.map((n) => (n.id === next.id ? next : n)))
                  }}
                  placeholder="제목을 입력하세요"
                />
                <input
                  className="w-full bg-white rounded-xl p-3 text-sm outline-none border border-gray-200 focus:border-gray-400 transition"
                  placeholder="카테고리 (예: 아이디어, 할 일, 중요...)"
                  value={selectedNote.category || ""}
                  onChange={(e) => {
                    const next = { ...selectedNote, category: e.target.value }
                    setNotes(notes.map((n) => (n.id === next.id ? next : n)))
                  }}
                />
                <textarea
                  className="w-full bg-white rounded-xl p-3 text-sm outline-none border border-gray-200 focus:border-gray-400 transition"
                  rows={8}
                  value={selectedNote.content}
                  onChange={(e) => {
                    const next = { ...selectedNote, content: e.target.value }
                    setNotes(notes.map((n) => (n.id === next.id ? next : n)))
                  }}
                  placeholder="내용을 입력하세요"
                />
                <div className="flex justify-end gap-2">
                  <button className="px-4 py-2 rounded-xl bg-gray-100 text-gray-900 text-sm" onClick={() => setIsEditing(false)}>취소</button>
                  <button className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm" onClick={handleSaveDetail}>
                    <Save className="inline-block w-4 h-4 mr-1" /> 저장
                  </button>
                </div>
              </div>
            )}
          </div>
          )
        )}

        {preview && (
          <div
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) closePreview()
            }}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white"
              onClick={closePreview}
              aria-label="닫기"
            >
              <X className="w-6 h-6" />
            </button>

            {preview.images.length > 1 && (
              <>
                <button
                  className="absolute left-2 md:left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={(e) => { e.stopPropagation(); showPrev() }}
                  aria-label="이전"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  className="absolute right-2 md:right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={(e) => { e.stopPropagation(); showNext() }}
                  aria-label="다음"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div
              className="max-w-[90vw] max-h-[85vh]"
              onTouchStart={(e) => { touchStartX.current = e.changedTouches[0].clientX }}
              onTouchEnd={(e) => {
                touchEndX.current = e.changedTouches[0].clientX
                const delta = (touchStartX.current ?? 0) - (touchEndX.current ?? 0)
                if (Math.abs(delta) > 50) {
                  if (delta > 0) showNext()
                  else showPrev()
                }
              }}
            >
              <img
                src={preview.images[preview.index]}
                alt="preview"
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              {preview.images.length > 1 && (
                <div className="text-center text-xs text-white/70 mt-3">
                  {preview.index + 1} / {preview.images.length}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, Upload, Trash2, Image as ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react"

type NoteItem = {
  id: string
  content: string
  images: string[]
  createdAt: number
  updatedAt: number
}

interface NotesManagerProps {
  notes: NoteItem[]
  setNotes: (notes: NoteItem[]) => void
}

export default function NotesManager({ notes, setNotes }: NotesManagerProps) {
  const [content, setContent] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<{ images: string[]; index: number } | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  useEffect(() => {
    // nothing
  }, [])

  const handleAddNote = async () => {
    const payload = { content, images: [] as string[] }
    const resp = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) return
    const data = await resp.json()
    setNotes([data.item, ...notes])
    setContent("")
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
    <div className="max-w-lg mx-auto px-5 pb-24">
      <div className="pt-12 mb-4">
        <h1 className="text-2xl font-light text-gray-900">메모</h1>
        <p className="text-sm text-gray-500">간단한 메모와 사진을 보관하세요</p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 mb-6">
        <textarea
          className="w-full bg-white rounded-xl p-3 text-sm outline-none border border-gray-200 focus:border-gray-400 transition"
          rows={3}
          placeholder="메모를 입력하세요..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <button
            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm disabled:opacity-50"
            onClick={handleAddNote}
            disabled={!content.trim()}
          >
            <Plus className="inline-block w-4 h-4 mr-1" /> 추가
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="border border-gray-100 rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-900 whitespace-pre-wrap pr-3">{note.content}</p>
              <button
                className="text-gray-400 hover:text-red-500"
                onClick={() => handleDelete(note.id)}
                aria-label="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3">
              {note.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {note.images.map((url, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => openPreview(note.images, idx)}
                      className="group relative"
                    >
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
            <div className="mt-3 flex items-center justify-between">
              <div className="text-[10px] text-gray-400">
                {new Date(note.updatedAt).toLocaleString("ko-KR")}
              </div>
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUploadImages(note, e.target.files)} />
                <button
                  className="px-3 py-2 rounded-xl bg-gray-100 text-gray-900 text-xs disabled:opacity-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="inline-block w-3.5 h-3.5 mr-1" /> 이미지 추가
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
  )
}


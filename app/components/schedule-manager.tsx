"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Clock, Edit, Check, X } from "lucide-react"

interface ScheduleItem {
  id: string
  title: string
  date: string
  completed: boolean
  category: string
}

interface ScheduleManagerProps {
  items: ScheduleItem[]
  setItems: (items: ScheduleItem[]) => void
  eventType: string
  onBack?: () => void
}

const categoryOptions = {
  wedding: ["예약/계약", "준비물", "의상", "촬영", "초대", "기타"],
  birthday: ["장소", "음식", "장식", "초대", "선물", "기타"],
  corporate: ["기획", "장소", "케이터링", "장비", "연사", "기타"],
  anniversary: ["예약", "선물", "준비", "기타"],
}

const scheduleTemplates = {
  wedding: [
    { title: "웨딩홀 예약", category: "예약/계약", daysBeforeEvent: 180 },
    { title: "스튜디오 예약", category: "촬영", daysBeforeEvent: 120 },
    { title: "드레스 시착", category: "의상", daysBeforeEvent: 90 },
    { title: "청첩장 제작", category: "초대", daysBeforeEvent: 60 },
    { title: "메이크업 리허설", category: "의상", daysBeforeEvent: 30 },
    { title: "최종 확인", category: "기타", daysBeforeEvent: 7 },
  ],
  birthday: [
    { title: "장소 예약", category: "장소", daysBeforeEvent: 30 },
    { title: "케이크 주문", category: "음식", daysBeforeEvent: 14 },
    { title: "초대장 발송", category: "초대", daysBeforeEvent: 14 },
    { title: "장식 준비", category: "장식", daysBeforeEvent: 7 },
    { title: "선물 준비", category: "선물", daysBeforeEvent: 7 },
  ],
  corporate: [
    { title: "기획안 작성", category: "기획", daysBeforeEvent: 60 },
    { title: "장소 예약", category: "장소", daysBeforeEvent: 45 },
    { title: "연사 섭외", category: "연사", daysBeforeEvent: 30 },
    { title: "케이터링 예약", category: "케이터링", daysBeforeEvent: 21 },
    { title: "장비 준비", category: "장비", daysBeforeEvent: 7 },
  ],
}

export default function ScheduleManager({ items, setItems, eventType, onBack }: ScheduleManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editCategory, setEditCategory] = useState("")

  const categories = categoryOptions[eventType as keyof typeof categoryOptions] || categoryOptions.wedding

  const addItem = () => {
    if (newTitle && newDate && newTime && newCategory) {
      const dateTime = `${newDate}T${newTime}:00`
      const newItem: ScheduleItem = {
        id: Date.now().toString(),
        title: newTitle,
        date: dateTime,
        completed: false,
        category: newCategory,
      }
      setItems([...items, newItem])
      setNewTitle("")
      setNewDate("")
      setNewTime("")
      setNewCategory("")
      setShowAddForm(false)
    }
  }

  const toggleCompleted = (itemId: string) => {
    setItems(items.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item)))
  }

  const deleteItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId))
  }

  const startEditing = (item: ScheduleItem) => {
    setEditingItemId(item.id)
    setEditTitle(item.title)
    const [date, time] = item.date.split('T')
    setEditDate(date)
    setEditTime(time.substring(0, 5)) // Remove seconds
    setEditCategory(item.category)
  }

  const cancelEditing = () => {
    setEditingItemId(null)
    setEditTitle("")
    setEditDate("")
    setEditTime("")
    setEditCategory("")
  }

  const updateItem = (itemId: string) => {
    if (editTitle && editDate && editTime && editCategory) {
      const dateTime = `${editDate}T${editTime}:00`
      setItems(items.map((item) => 
        item.id === itemId 
          ? { ...item, title: editTitle, date: dateTime, category: editCategory }
          : item
      ))
      cancelEditing()
    }
  }

  const sortedItems = [...items].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  const upcomingItems = items.filter((item) => !item.completed && new Date(item.date) >= new Date()).length
  const overdueItems = items.filter((item) => !item.completed && new Date(item.date) < new Date()).length
  const completedItems = items.filter((item) => item.completed).length

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-lg mx-auto px-5">
        {/* Mobile Header */}
        <div className="pt-12 mb-6">
          <h1 className="text-3xl font-light text-gray-900 mb-1">일정 관리</h1>
          <p className="text-sm text-gray-500">이벤트 일정 추적</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-light text-gray-900">{upcomingItems}</p>
            <p className="text-xs text-gray-500 mt-1">예정</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-light text-red-600">{overdueItems}</p>
            <p className="text-xs text-gray-500 mt-1">지연</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-light text-green-600">{completedItems}</p>
            <p className="text-xs text-gray-500 mt-1">완료</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
              showAddForm ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 active:bg-gray-200"
            }`}
          >
            직접 추가
          </button>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
            <input
              placeholder="일정 제목 (예: 웨딩홀 계약)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-full h-12 bg-white border-gray-200 rounded-xl">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={addItem}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium active:bg-gray-800"
            >
              일정 추가
            </button>
          </div>
        )}

        {/* Schedule Items */}
        <div className="space-y-2">
          {sortedItems.map((item) => {
            const isOverdue = !item.completed && new Date(item.date) < new Date()
            const isToday = new Date(item.date).toDateString() === new Date().toDateString()

            return (
              <div
                key={item.id}
                className={`rounded-2xl p-4 ${
                  item.completed
                    ? "bg-gray-50"
                    : isOverdue
                      ? "bg-red-50"
                      : isToday
                        ? "bg-blue-50"
                        : "bg-gray-50"
                }`}
              >
                {editingItemId === item.id ? (
                  <div className="space-y-3">
                    <input
                      placeholder="일정 제목"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                    />
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                      />
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                      />
                    </div>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger className="w-full h-10 bg-white border-gray-200 rounded-lg">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateItem(item.id)}
                        className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleCompleted(item.id)}
                      className="mt-0.5 w-5 h-5"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${item.completed ? "line-through text-gray-400" : "text-gray-900"}`}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-500">
                          {new Date(item.date).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                        <span className="text-xs text-gray-400">{item.category}</span>
                        {isOverdue && (
                          <span className="text-xs text-red-600 font-medium">지연</span>
                        )}
                        {isToday && !item.completed && (
                          <span className="text-xs text-blue-600 font-medium">오늘</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditing(item)}
                        className="text-gray-400 hover:text-blue-600 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {items.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">일정을 추가해보세요</p>
              <p className="text-sm text-gray-400">직접 추가하거나 템플릿을 사용할 수 있어요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

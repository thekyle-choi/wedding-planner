"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Calendar, Clock } from "lucide-react"

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
  onBack: () => void
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
  const [showTemplates, setShowTemplates] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDate, setNewDate] = useState("")
  const [newCategory, setNewCategory] = useState("")

  const categories = categoryOptions[eventType as keyof typeof categoryOptions] || categoryOptions.wedding

  const addItem = () => {
    if (newTitle && newDate && newCategory) {
      const newItem: ScheduleItem = {
        id: Date.now().toString(),
        title: newTitle,
        date: newDate,
        completed: false,
        category: newCategory,
      }
      setItems([...items, newItem])
      setNewTitle("")
      setNewDate("")
      setNewCategory("")
      setShowAddForm(false)
    }
  }

  const addTemplateItems = (eventDate: string) => {
    const templates = scheduleTemplates[eventType as keyof typeof scheduleTemplates] || scheduleTemplates.wedding
    const baseDate = new Date(eventDate)

    const newItems = templates.map((template) => {
      const itemDate = new Date(baseDate)
      itemDate.setDate(itemDate.getDate() - template.daysBeforeEvent)

      return {
        id: Date.now().toString() + Math.random(),
        title: template.title,
        date: itemDate.toISOString().split("T")[0],
        completed: false,
        category: template.category,
      }
    })

    setItems([...items, ...newItems])
    setShowTemplates(false)
  }

  const toggleCompleted = (itemId: string) => {
    setItems(items.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item)))
  }

  const deleteItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId))
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto p-4">
        {/* Mobile Header */}
        <div className="flex items-center gap-4 mb-6 pt-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-light text-gray-900">일정 관리</h1>
            <p className="text-sm text-gray-600">이벤트 일정 추적</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-light text-blue-600">{upcomingItems}</p>
              <p className="text-xs text-gray-600">예정</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-light text-red-600">{overdueItems}</p>
              <p className="text-xs text-gray-600">지연</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-light text-green-600">{completedItems}</p>
              <p className="text-xs text-gray-600">완료</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? "secondary" : "default"}
            className="h-12"
          >
            <Plus className="w-5 h-5 mr-2" />
            {showAddForm ? "취소" : "직접 추가"}
          </Button>
          <Button
            onClick={() => setShowTemplates(!showTemplates)}
            variant={showTemplates ? "secondary" : "outline"}
            className="h-12"
          >
            <Clock className="w-4 h-4 mr-2" />
            {showTemplates ? "취소" : "템플릿"}
          </Button>
        </div>

        {/* Templates */}
        {showTemplates && (
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="eventDate" className="text-sm font-medium">
                  이벤트 날짜를 입력하세요
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  className="mt-1 h-12"
                  onChange={(e) => {
                    if (e.target.value) {
                      addTemplateItems(e.target.value)
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-600">이벤트 날짜를 기준으로 추천 일정이 자동으로 생성됩니다.</p>
            </CardContent>
          </Card>
        )}

        {/* Add Item Form */}
        {showAddForm && (
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  일정 제목
                </Label>
                <Input
                  id="title"
                  placeholder="예: 웨딩홀 계약"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 h-12"
                />
              </div>
              <div>
                <Label htmlFor="date" className="text-sm font-medium">
                  날짜
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mt-1 h-12"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  카테고리
                </Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="mt-1 h-12">
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addItem} className="w-full h-12">
                일정 추가
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Schedule Items */}
        <div className="space-y-3">
          {sortedItems.map((item) => {
            const isOverdue = !item.completed && new Date(item.date) < new Date()
            const isToday = new Date(item.date).toDateString() === new Date().toDateString()

            return (
              <Card
                key={item.id}
                className={`border-0 shadow-sm ${
                  item.completed
                    ? "bg-gray-50"
                    : isOverdue
                      ? "bg-red-50 border-red-200"
                      : isToday
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleCompleted(item.id)}
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm ${item.completed ? "line-through text-gray-500" : "text-gray-900"}`}
                      >
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.date).toLocaleDateString("ko-KR")}
                        </div>
                        <Badge
                          variant={item.completed ? "secondary" : isOverdue ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {item.category}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            지연
                          </Badge>
                        )}
                        {isToday && !item.completed && (
                          <Badge variant="default" className="text-xs bg-blue-600">
                            오늘
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-700 p-2 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {items.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">아직 일정이 없습니다</p>
                <p className="text-sm text-gray-400">위에서 일정을 추가하거나 템플릿을 사용해보세요</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, CheckCircle2, Wallet, Clock, Heart, Share2 } from "lucide-react"
import BudgetManager from "./components/budget-manager"
import ScheduleManager from "./components/schedule-manager"
import EventSettingsComponent from "./components/event-settings"
import MobileNav from "./components/mobile-nav"

interface BudgetGroup {
  id: string
  name: string
  categories: BudgetCategory[]
}

interface BudgetCategory {
  id: string
  name: string
  budget: number
  items: BudgetItem[]
  groupId: string
}

interface BudgetItem {
  id: string
  name: string
  amount: number
  paid: boolean
}

interface ScheduleItem {
  id: string
  title: string
  date: string
  completed: boolean
  category: string
}

interface EventSettings {
  eventType: string
  eventDate: string
  couple: {
    person1: string
    person2: string
  }
  eventTitle: string
  theme: string
}

export default function EventPlanner() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "budget" | "schedule" | "settings">("dashboard")
  const [budgetGroups, setBudgetGroups] = useState<BudgetGroup[]>([])
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [eventSettings, setEventSettings] = useState<EventSettings>({
    eventType: "wedding",
    eventDate: "",
    couple: { person1: "SJ", person2: "JK" },
    eventTitle: "SJ ♥ JK의 결혼식",
    theme: "classic",
  })
  const [loading, setLoading] = useState(true)

  // Load data from Redis
  useEffect(() => {
    const loadData = async () => {
      try {
        const [budgetRes, scheduleRes, settingsRes] = await Promise.all([
          fetch("/api/budget"),
          fetch("/api/schedule"),
          fetch("/api/settings"),
        ])

        if (budgetRes.ok) {
          const budgetData = await budgetRes.json()
          setBudgetGroups(Array.isArray(budgetData) ? budgetData : [])
        }

        if (scheduleRes.ok) {
          const scheduleData = await scheduleRes.json()
          setScheduleItems(Array.isArray(scheduleData) ? scheduleData : [])
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          if (settingsData) {
            setEventSettings(settingsData)
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        setBudgetGroups([])
        setScheduleItems([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Save functions
  const saveBudgetData = async (groups: BudgetGroup[]) => {
    try {
      await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groups),
      })
      setBudgetGroups(groups)
    } catch (error) {
      console.error("Failed to save budget data:", error)
    }
  }

  const saveScheduleData = async (items: ScheduleItem[]) => {
    try {
      await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      })
      setScheduleItems(items)
    } catch (error) {
      console.error("Failed to save schedule data:", error)
    }
  }

  const saveEventSettings = async (settings: EventSettings) => {
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      setEventSettings(settings)
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  }

  const shareProject = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventSettings.eventTitle,
          text: `${eventSettings.eventTitle} 계획을 확인해보세요!`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Share cancelled")
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("링크가 클립보드에 복사되었습니다!")
    }
  }

  const totalBudget = (budgetGroups || []).reduce(
    (sum, group) => sum + (group.categories || []).reduce((catSum, category) => catSum + (category.budget || 0), 0),
    0,
  )

  const totalSpent = (budgetGroups || []).reduce(
    (sum, group) =>
      sum +
      (group.categories || []).reduce(
        (catSum, category) =>
          catSum + (category.items || []).reduce((itemSum, item) => itemSum + (item.paid ? item.amount || 0 : 0), 0),
        0,
      ),
    0,
  )

  const remainingBudget = totalBudget - totalSpent

  const completedTasks = scheduleItems.filter((item) => item.completed).length
  const totalTasks = scheduleItems.length

  const upcomingTasks = scheduleItems
    .filter((item) => !item.completed && new Date(item.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3) // Show only top 3 upcoming tasks

  const daysUntilEvent = eventSettings.eventDate
    ? Math.ceil((new Date(eventSettings.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (activeTab === "budget") {
    return (
      <BudgetManager
        groups={budgetGroups}
        setGroups={saveBudgetData}
        eventType={eventSettings.eventType}
        onBack={() => setActiveTab("dashboard")}
      />
    )
  }

  if (activeTab === "schedule") {
    return (
      <ScheduleManager
        items={scheduleItems}
        setItems={saveScheduleData}
        eventType={eventSettings.eventType}
        onBack={() => setActiveTab("dashboard")}
      />
    )
  }

  if (activeTab === "settings") {
    return (
      <EventSettingsComponent
        settings={eventSettings}
        setSettings={saveEventSettings}
        onBack={() => setActiveTab("dashboard")}
      />
    )
  }

  const totalCategories = (budgetGroups || []).reduce((sum, group) => sum + (group.categories || []).length, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto p-4">
        {/* Mobile Header */}
        <div className="text-center mb-8 pt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-6 h-6 text-red-500" />
            <h1 className="text-2xl font-light text-gray-900">{eventSettings.eventTitle}</h1>
          </div>
          {daysUntilEvent !== null && (
            <div className="flex items-center justify-center gap-4 mb-2">
              {daysUntilEvent > 0 ? (
                <Badge variant="default" className="bg-blue-600">
                  D-{daysUntilEvent}
                </Badge>
              ) : daysUntilEvent === 0 ? (
                <Badge variant="default" className="bg-red-600">
                  오늘!
                </Badge>
              ) : (
                <Badge variant="secondary">D+{Math.abs(daysUntilEvent)}</Badge>
              )}
              <Button variant="ghost" size="sm" onClick={shareProject} className="p-2">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          )}
          <p className="text-gray-600 text-sm">
            {eventSettings.eventType === "wedding"
              ? "우리의 특별한 날을 위한 계획"
              : eventSettings.eventType === "birthday"
                ? "생일 파티 준비"
                : eventSettings.eventType === "corporate"
                  ? "회사 이벤트 기획"
                  : "이벤트 계획"}
          </p>
        </div>

        {/* Consolidated Budget Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50 mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">총 예산</p>
                <p className="text-3xl font-light text-gray-900">{totalBudget.toLocaleString()}원</p>
              </div>
              <div className="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div>
                <p className="text-lg font-light text-red-600">{totalSpent.toLocaleString()}원</p>
                <p className="text-xs text-gray-600">사용한 금액</p>
              </div>
              <div>
                <p className="text-lg font-light text-green-600">{remainingBudget.toLocaleString()}원</p>
                <p className="text-xs text-gray-600">남은 예산</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-600 mt-2">
              예산 사용률: {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks - Prominent Display */}
        {upcomingTasks.length > 0 && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-light flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                다가오는 일정
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const daysUntil = Math.ceil(
                    (new Date(task.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                  )
                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-600">{new Date(task.date).toLocaleDateString("ko-KR")}</p>
                          {daysUntil <= 3 && (
                            <Badge variant="destructive" className="text-xs">
                              {daysUntil === 0 ? "오늘" : `${daysUntil}일 후`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {task.category}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Actions - Mobile Optimized */}
        <div className="space-y-4 mb-6">
          <Card
            className="border-0 shadow-sm active:scale-95 transition-transform cursor-pointer"
            onClick={() => setActiveTab("budget")}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">예산 관리</h3>
                    <p className="text-sm text-gray-600">{totalCategories}개 카테고리</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{totalBudget.toLocaleString()}원</p>
                  <p className="text-xs text-gray-500">총 예산</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm active:scale-95 transition-transform cursor-pointer"
            onClick={() => setActiveTab("schedule")}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">일정 관리</h3>
                    <p className="text-sm text-gray-600">{totalTasks}개 일정</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {completedTasks}/{totalTasks}
                  </p>
                  <p className="text-xs text-gray-500">완료</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

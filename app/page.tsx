"use client"

import { useState, useEffect } from "react"
import { ChevronRight } from "lucide-react"
import BudgetManager from "./components/budget-manager"
import ScheduleManager from "./components/schedule-manager"
import EventSettingsComponent from "./components/event-settings"
import MobileNav from "./components/mobile-nav"
import NotesManager from "./components/notes-manager"
import RealEstateManager, { type RealEstateItem } from "./components/real-estate-manager"

interface BudgetGroup {
  id: string
  name: string
  budget?: number
  categories: BudgetCategory[]
}

interface BudgetCategory {
  id: string
  name: string
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

interface NoteItem {
  id: string
  title: string
  content: string
  images: string[]
  createdAt: number
  updatedAt: number
}

export default function EventPlanner() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "budget" | "schedule" | "notes" | "realestate" | "settings">("dashboard")
  const [budgetGroups, setBudgetGroups] = useState<BudgetGroup[]>([])
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [realEstateItems, setRealEstateItems] = useState<RealEstateItem[]>([])
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
        const [budgetRes, scheduleRes, settingsRes, notesRes, realEstateRes] = await Promise.all([
          fetch("/api/budget"),
          fetch("/api/schedule"),
          fetch("/api/settings"),
          fetch("/api/notes"),
          fetch("/api/realestate"),
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

        if (notesRes.ok) {
          const notesData = await notesRes.json()
          setNotes(Array.isArray(notesData) ? notesData : [])
        }

        if (realEstateRes.ok) {
          const data = await realEstateRes.json()
          setRealEstateItems(Array.isArray(data) ? data : [])
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


  const totalBudget = (budgetGroups || []).reduce((sum, group) => {
    // 그룹 예산 우선, 없으면 하위 카테고리의 과거 예산 합계를 fallback
    const groupBudget = typeof group.budget === "number"
      ? group.budget
      : (group.categories || []).reduce((catSum: number, category: any) => catSum + (category?.budget || 0), 0)
    return sum + (groupBudget || 0)
  }, 0)

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

  const renderContent = () => {
    switch (activeTab) {
      case "budget":
        return (
          <BudgetManager
            groups={budgetGroups}
            setGroups={saveBudgetData}
            eventType={eventSettings.eventType}
          />
        )
      case "schedule":
        return (
          <ScheduleManager
            items={scheduleItems}
            setItems={saveScheduleData}
            eventType={eventSettings.eventType}
          />
        )
      case "settings":
        return (
          <EventSettingsComponent
            settings={eventSettings}
            setSettings={saveEventSettings}
          />
        )
      case "notes":
        return (
          <NotesManager
            notes={notes}
            setNotes={setNotes}
          />
        )
      case "realestate":
        return (
          <RealEstateManager
            items={realEstateItems}
            setItems={setRealEstateItems}
          />
        )
      default:
        return null
    }
  }

  const totalCategories = (budgetGroups || []).reduce((sum, group) => sum + (group.categories || []).length, 0)

  return (
    <div className="min-h-screen bg-white">
      {activeTab === "dashboard" ? (
        <div className="max-w-lg mx-auto px-5 pb-20">
          {/* Mobile Header */}
          <div className="text-center mb-6 pt-12">
            <h1 className="text-3xl font-light text-gray-900 mb-1">{eventSettings.eventTitle}</h1>
            {daysUntilEvent !== null && (
              <div className="text-center mb-3">
                <span className={`text-sm font-medium ${
                  daysUntilEvent > 0 ? "text-gray-900" : 
                  daysUntilEvent === 0 ? "text-red-600" : "text-gray-500"
                }`}>
                  {daysUntilEvent > 0 ? `D-${daysUntilEvent}` : 
                   daysUntilEvent === 0 ? "오늘!" : `D+${Math.abs(daysUntilEvent)}`}
                </span>
              </div>
            )}
          </div>

        {/* Consolidated Budget Card */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6">
          <div className="mb-4">
            <p className="text-4xl font-light text-gray-900 mb-1">{totalBudget.toLocaleString()}<span className="text-xl font-normal text-gray-500">원</span></p>
            <p className="text-sm text-gray-500">총 예산</p>
          </div>
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-sm text-gray-500 mb-0.5">사용</p>
              <p className="text-lg font-light text-gray-900">{totalSpent.toLocaleString()}원</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-0.5">남음</p>
              <p className="text-lg font-light text-gray-900">{remainingBudget.toLocaleString()}원</p>
            </div>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 bg-gray-900 rounded-full transition-all duration-500"
                style={{ width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}% 사용
            </p>
          </div>
        </div>

        {/* Upcoming Tasks - Prominent Display */}
        {upcomingTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-medium text-gray-900 mb-3">다가오는 일정</h2>
            <div className="space-y-2">
              {upcomingTasks.map((task) => {
                const daysUntil = Math.ceil(
                  (new Date(task.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                )
                return (
                  <div key={task.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(task.date).toLocaleDateString("ko-KR")}
                        {daysUntil <= 3 && (
                          <span className="text-red-600 ml-2">
                            {daysUntil === 0 ? "오늘" : `${daysUntil}일 후`}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">{task.category}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Main Actions - Mobile Optimized */}
        <div className="space-y-3 mb-6">
          <button
            className="w-full text-left p-4 bg-gray-50 rounded-2xl active:bg-gray-100 transition-colors"
            onClick={() => setActiveTab("budget")}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-900">예산 관리</h3>
                <p className="text-sm text-gray-500 mt-0.5">{totalCategories}개 카테고리 • {totalBudget.toLocaleString()}원</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          <button
            className="w-full text-left p-4 bg-gray-50 rounded-2xl active:bg-gray-100 transition-colors"
            onClick={() => setActiveTab("schedule")}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-900">일정 관리</h3>
                <p className="text-sm text-gray-500 mt-0.5">{completedTasks}/{totalTasks}개 완료</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
          </div>
        </div>
      ) : (
        renderContent()
      )}

      {/* Mobile Navigation - Always Visible */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

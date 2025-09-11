"use client"

import { useState, useEffect } from "react"
import { Wallet, Clock, StickyNote, Building2, Settings, DollarSign, Zap, Armchair, Lock } from "lucide-react"
import BudgetManager from "./components/budget-manager"
import ScheduleManager from "./components/schedule-manager"
import EventSettingsComponent from "./components/event-settings"
import MobileNav from "./components/mobile-nav"
import NotesManager from "./components/notes-manager"
import RealEstateManager, { type RealEstateItem, type SubscriptionItem } from "./components/real-estate-manager"
import IncomeManagerUltra from "./components/income-manager-ultra"
import ApplianceManager, { type ApplianceCategory, type ApplianceItem } from "./components/appliance-manager"
import FurnitureManager, { type FurnitureCategory, type FurnitureItem } from "./components/furniture-manager"
import { type IncomeDatabase, createEmptyIncomeDatabase } from "@/lib/income-types-simple"

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
  category: string
  images: string[]
  createdAt: number
  updatedAt: number
}

export default function EventPlanner() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "budget" | "schedule" | "notes" | "realestate" | "settings" | "income" | "appliances" | "furniture">("dashboard")
  const [budgetGroups, setBudgetGroups] = useState<BudgetGroup[]>([])
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [realEstateItems, setRealEstateItems] = useState<RealEstateItem[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [applianceCategories, setApplianceCategories] = useState<ApplianceCategory[]>([])
  const [furnitureCategories, setFurnitureCategories] = useState<FurnitureCategory[]>([])
  const [incomeDatabase, setIncomeDatabase] = useState<IncomeDatabase>(createEmptyIncomeDatabase())
  const [eventSettings, setEventSettings] = useState<EventSettings>({
    eventType: "wedding",
    eventDate: "",
    couple: { person1: "SJ", person2: "JK" },
    eventTitle: "SJ ♥ JK의 결혼식",
    theme: "classic",
  })
  const [loading, setLoading] = useState(true)
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState(false)

  // Load data from Redis
  const loadData = async (isBackgroundRefresh = false) => {
    try {
      if (isBackgroundRefresh) {
        setBackgroundRefreshing(true)
      }

      const [budgetRes, scheduleRes, settingsRes, notesRes, realEstateRes, subscriptionsRes, incomeRes, appliancesRes, furnitureRes] = await Promise.all([
        fetch("/api/budget"),
        fetch("/api/schedule"),
        fetch("/api/settings"),
        fetch("/api/notes"),
        fetch("/api/realestate"),
        fetch("/api/subscriptions"),
        fetch("/api/income"),
        fetch("/api/appliances"),
        fetch("/api/furniture"),
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

      if (subscriptionsRes.ok) {
        const data = await subscriptionsRes.json()
        setSubscriptions(Array.isArray(data) ? data : [])
      }

      if (incomeRes.ok) {
        const data = await incomeRes.json()
        if (data) {
          // 기존 데이터에 personalItems가 없는 경우 빈 배열로 초기화
          const migratedData = {
            ...data,
            groups: Object.fromEntries(
              Object.entries(data.groups || {}).map(([groupId, group]: [string, any]) => [
                groupId,
                {
                  ...group,
                  jkData: {
                    ...group.jkData,
                    personalItems: group.jkData?.personalItems || []
                  },
                  sjData: {
                    ...group.sjData,
                    personalItems: group.sjData?.personalItems || []
                  }
                }
              ])
            )
          }
          setIncomeDatabase(migratedData)
        }
      }

      if (appliancesRes.ok) {
        const data = await appliancesRes.json()
        setApplianceCategories(Array.isArray(data) ? data : [])
      }

      if (furnitureRes.ok) {
        const data = await furnitureRes.json()
        setFurnitureCategories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      if (!isBackgroundRefresh) {
        setBudgetGroups([])
        setScheduleItems([])
        setApplianceCategories([])
        setFurnitureCategories([])
      }
    } finally {
      if (isBackgroundRefresh) {
        setBackgroundRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    // 로컬 스토리지에서 인증 상태 확인
    const authStatus = localStorage.getItem("wedding_planner_auth")
    if (authStatus === "authenticated") {
      setIsAuthenticated(true)
      loadData(false)
    } else {
      setLoading(false)
    }
  }, [])

  // 비밀번호 검증 함수
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "0325") {
      setIsAuthenticated(true)
      setPasswordError(false)
      localStorage.setItem("wedding_planner_auth", "authenticated")
      loadData(false)
    } else {
      setPasswordError(true)
      setPassword("")
    }
  }

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

  const saveIncomeDatabase = async (database: IncomeDatabase) => {
    try {
      await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(database),
      })
      setIncomeDatabase(database)
    } catch (error) {
      console.error("Failed to save income database:", error)
    }
  }

  const saveApplianceCategories = async (categories: ApplianceCategory[]) => {
    try {
      await fetch("/api/appliances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categories),
      })
      setApplianceCategories(categories)
    } catch (error) {
      console.error("Failed to save appliance categories:", error)
    }
  }

  const saveFurnitureCategories = async (categories: FurnitureCategory[]) => {
    try {
      await fetch("/api/furniture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categories),
      })
      setFurnitureCategories(categories)
    } catch (error) {
      console.error("Failed to save furniture categories:", error)
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


  const upcomingTasks = scheduleItems
    .filter((item) => !item.completed && new Date(item.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3) // Show only top 3 upcoming tasks

  const daysUntilEvent = eventSettings.eventDate
    ? Math.ceil((new Date(eventSettings.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  // 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 비밀번호 입력 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-gray-600" />
            </div>
            <h1 className="text-2xl font-light text-gray-900 mb-2">비밀번호를 입력하세요</h1>
            <p className="text-sm text-gray-500">웨딩 플래너에 접속하려면 비밀번호가 필요합니다</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className={`w-full px-4 py-3 bg-gray-50 rounded-xl text-center text-lg tracking-widest focus:outline-none focus:ring-2 transition-all ${
                  passwordError 
                    ? "border-2 border-red-500 focus:ring-red-200" 
                    : "border-2 border-transparent focus:ring-gray-300"
                }`}
                autoFocus
                maxLength={4}
                inputMode="numeric"
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-500 text-center">비밀번호가 올바르지 않습니다</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!password}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              확인
            </button>
          </form>
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
            subscriptions={subscriptions}
            setSubscriptions={setSubscriptions}
          />
        )
      case "income":
        return (
          <IncomeManagerUltra
            incomeDatabase={incomeDatabase}
            setIncomeDatabase={saveIncomeDatabase}
          />
        )
      case "appliances":
        return (
          <ApplianceManager
            categories={applianceCategories}
            setCategories={saveApplianceCategories}
          />
        )
      case "furniture":
        return (
          <FurnitureManager
            categories={furnitureCategories}
            setCategories={saveFurnitureCategories}
          />
        )
      default:
        return null
    }
  }


  // 소형 아이콘 메뉴 항목 (대시보드 내 표시용)
  const smallMenuItems = [
    { id: "budget" as const, label: "예산", icon: Wallet, color: "text-blue-600" },
    { id: "schedule" as const, label: "일정", icon: Clock, color: "text-green-600" },
    { id: "income" as const, label: "수입", icon: DollarSign, color: "text-emerald-600" },
    { id: "realestate" as const, label: "부동산", icon: Building2, color: "text-purple-600" },
    { id: "appliances" as const, label: "가전", icon: Zap, color: "text-yellow-600" },
    { id: "furniture" as const, label: "가구", icon: Armchair, color: "text-amber-600" },
    { id: "notes" as const, label: "메모", icon: StickyNote, color: "text-orange-600" },
    { id: "settings" as const, label: "설정", icon: Settings, color: "text-gray-600" },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Grid Menu Overlay 제거됨 */}

      {activeTab === "dashboard" ? (
        <div className="max-w-lg mx-auto px-5 pb-20">
          {/* Background refresh indicator */}
          {backgroundRefreshing && (
            <div className="fixed top-0 left-0 right-0 z-50">
              <div className="h-1 bg-gray-100">
                <div className="h-full w-full bg-blue-500 animate-pulse"></div>
              </div>
            </div>
          )}
          
          {/* Mobile Header */}
          <div className="relative mb-6 pt-12">
            <div className="flex items-center justify-between">
              {/* 왼쪽에 이벤트 타이틀 */}
              <h1 className="text-2xl font-light text-gray-900">{eventSettings.eventTitle}</h1>
              
              {/* 오른쪽에 태그 형태의 D-day */}
              {daysUntilEvent !== null && (
                <div className={`px-3 py-1.5 rounded-full ${
                  daysUntilEvent > 0 ? "bg-gray-100 text-gray-800" : 
                  daysUntilEvent === 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                }`}>
                  <span className="text-sm font-medium">
                    {daysUntilEvent > 0 ? `D-${daysUntilEvent}` : 
                     daysUntilEvent === 0 ? "오늘!" : `D+${Math.abs(daysUntilEvent)}`}
                  </span>
                </div>
              )}
            </div>
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

        {/* 소형 아이콘 메뉴 (메인 액션 대체) */}
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2">
            {smallMenuItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center py-2 rounded-xl transition-colors bg-gray-50 text-gray-700 hover:bg-gray-100"
                >
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <span className="mt-1 text-[10px] font-medium">{item.label}</span>
                </button>
              )
            })}
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

        
        </div>
      ) : (
        renderContent()
      )}

      <MobileNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onHomeClick={() => {
          // 현재 대시보드가 아닌 탭에서 홈으로 이동할 때만 백그라운드 새로고침 실행
          if (activeTab !== "dashboard") {
            loadData(true)
          }
        }}
      />
    </div>
  )
}

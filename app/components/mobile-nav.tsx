"use client"

import { Home, Wallet, Clock, Settings } from "lucide-react"

interface MobileNavProps {
  activeTab: "dashboard" | "budget" | "schedule" | "settings"
  setActiveTab: (tab: "dashboard" | "budget" | "schedule" | "settings") => void
}

export default function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const navItems = [
    { id: "dashboard" as const, label: "홈", icon: Home },
    { id: "budget" as const, label: "예산", icon: Wallet },
    { id: "schedule" as const, label: "일정", icon: Clock },
    { id: "settings" as const, label: "설정", icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? "text-blue-600" : "text-gray-600"}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

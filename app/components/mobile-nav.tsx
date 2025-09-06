"use client"

import { Home, Wallet, Clock, Settings, StickyNote, Building2, DollarSign, Zap } from "lucide-react"

interface MobileNavProps {
  activeTab: "dashboard" | "budget" | "schedule" | "notes" | "realestate" | "settings" | "income" | "appliances" | "furniture"
  setActiveTab: (tab: "dashboard" | "budget" | "schedule" | "notes" | "realestate" | "settings" | "income" | "appliances" | "furniture") => void
}

export default function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const navItems = [
    { id: "dashboard" as const, label: "홈", icon: Home },
    { id: "budget" as const, label: "예산", icon: Wallet },
    { id: "schedule" as const, label: "일정", icon: Clock },
    { id: "realestate" as const, label: "부동산", icon: Building2 },
    { id: "notes" as const, label: "메모", icon: StickyNote },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 safe-area-pb z-50">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-around px-2 py-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200 min-w-[72px] ${
                  isActive 
                    ? "text-gray-900" 
                    : "text-gray-400 hover:text-gray-600 active:scale-95"
                }`}
              >
                <Icon className={`w-6 h-6 mb-0.5 transition-all duration-200 ${
                  isActive ? "text-gray-900" : "text-gray-400"
                }`} />
                <span className={`text-[10px] font-medium transition-all duration-200 ${
                  isActive ? "text-gray-900" : "text-gray-500"
                }`}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

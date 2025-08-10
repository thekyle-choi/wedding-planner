"use client"

import { useState } from "react"
import { Heart, Users } from "lucide-react"

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

interface EventSettingsProps {
  settings: EventSettings
  setSettings: (settings: EventSettings) => void
  onBack?: () => void
}

const eventTypes = [
  { value: "wedding", label: "결혼식", icon: "💒" },
  { value: "birthday", label: "생일파티", icon: "🎂" },
  { value: "corporate", label: "회사 이벤트", icon: "🏢" },
  { value: "anniversary", label: "기념일", icon: "🎉" },
  { value: "graduation", label: "졸업식", icon: "🎓" },
  { value: "baby-shower", label: "베이비샤워", icon: "👶" },
  { value: "other", label: "기타", icon: "🎪" },
]

const themes = [
  { value: "classic", label: "클래식", color: "bg-gray-500" },
  { value: "romantic", label: "로맨틱", color: "bg-pink-500" },
  { value: "modern", label: "모던", color: "bg-blue-500" },
  { value: "vintage", label: "빈티지", color: "bg-amber-500" },
  { value: "minimalist", label: "미니멀", color: "bg-slate-500" },
  { value: "colorful", label: "컬러풀", color: "bg-rainbow" },
]

export default function EventSettingsComponent({ settings, setSettings, onBack }: EventSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings)

  const handleSave = () => {
    setSettings(localSettings)
    if (onBack) onBack()
  }


  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-lg mx-auto px-5">
        {/* Mobile Header */}
        <div className="pt-12 mb-6">
          <h1 className="text-3xl font-light text-gray-900 mb-1">이벤트 설정</h1>
          <p className="text-sm text-gray-500">이벤트 정보를 설정하세요</p>
        </div>

        <div className="space-y-6">
          {/* People */}
          <div>
            <h2 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              참여자
            </h2>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <input
                value={localSettings.couple.person1}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    couple: { ...localSettings.couple, person1: e.target.value },
                  })
                }
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                placeholder="이름/이니셜 (예: SJ)"
              />
              <input
                value={localSettings.couple.person2}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    couple: { ...localSettings.couple, person2: e.target.value },
                  })
                }
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                placeholder="이름/이니셜 (예: JK)"
              />
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h2 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-gray-600" />
              이벤트 정보
            </h2>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <input
                value={localSettings.eventTitle}
                onChange={(e) => setLocalSettings({ ...localSettings, eventTitle: e.target.value })}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                placeholder="이벤트 제목 (예: SJ ♥ JK의 결혼식)"
              />
              <input
                type="date"
                value={localSettings.eventDate}
                onChange={(e) => setLocalSettings({ ...localSettings, eventDate: e.target.value })}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl text-base font-medium active:bg-gray-800 transition-colors"
          >
            설정 저장
          </button>
        </div>
      </div>
    </div>
  )
}

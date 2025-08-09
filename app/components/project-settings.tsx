"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Heart, Calendar, Users, Palette } from "lucide-react"

interface ProjectSettings {
  eventType: string
  eventDate: string
  couple: {
    person1: string
    person2: string
  }
  eventTitle: string
  theme: string
}

interface ProjectSettingsProps {
  settings: ProjectSettings
  setSettings: (settings: ProjectSettings) => void
  onBack: () => void
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

export default function ProjectSettings({ settings, setSettings, onBack }: ProjectSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings)

  const handleSave = () => {
    setSettings(localSettings)
    onBack()
  }

  const generateEventTitle = () => {
    const { eventType, couple } = localSettings
    const eventTypeLabel = eventTypes.find((type) => type.value === eventType)?.label || "이벤트"

    if (eventType === "wedding") {
      return `${couple.person1} ♥ ${couple.person2}의 ${eventTypeLabel}`
    } else if (eventType === "birthday") {
      return `${couple.person1}의 ${eventTypeLabel}`
    } else {
      return `${couple.person1} & ${couple.person2}의 ${eventTypeLabel}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto p-4">
        {/* Mobile Header */}
        <div className="flex items-center gap-4 mb-6 pt-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-light text-gray-900">프로젝트 설정</h1>
            <p className="text-sm text-gray-600">이벤트 정보를 설정하세요</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Event Type */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-light flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                이벤트 유형
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {eventTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={localSettings.eventType === type.value ? "default" : "outline"}
                    className="h-16 flex-col gap-1"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        eventType: type.value,
                        eventTitle: generateEventTitle(),
                      })
                    }
                  >
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-xs">{type.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* People */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-light flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                {localSettings.eventType === "wedding" ? "신랑 & 신부" : "주인공"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="person1" className="text-sm font-medium">
                  {localSettings.eventType === "wedding"
                    ? "신랑 이름/이니셜"
                    : localSettings.eventType === "birthday"
                      ? "생일 주인공"
                      : "첫 번째 이름"}
                </Label>
                <Input
                  id="person1"
                  value={localSettings.couple.person1}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      couple: { ...localSettings.couple, person1: e.target.value },
                    })
                  }
                  className="mt-1 h-12"
                  placeholder="SJ"
                />
              </div>
              {localSettings.eventType !== "birthday" && (
                <div>
                  <Label htmlFor="person2" className="text-sm font-medium">
                    {localSettings.eventType === "wedding" ? "신부 이름/이니셜" : "두 번째 이름"}
                  </Label>
                  <Input
                    id="person2"
                    value={localSettings.couple.person2}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        couple: { ...localSettings.couple, person2: e.target.value },
                      })
                    }
                    className="mt-1 h-12"
                    placeholder="JK"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-light flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                이벤트 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="eventTitle" className="text-sm font-medium">
                  이벤트 제목
                </Label>
                <Input
                  id="eventTitle"
                  value={localSettings.eventTitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, eventTitle: e.target.value })}
                  className="mt-1 h-12"
                  placeholder="SJ ♥ JK의 결혼식"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocalSettings({ ...localSettings, eventTitle: generateEventTitle() })}
                  className="mt-2 text-xs"
                >
                  자동 생성
                </Button>
              </div>
              <div>
                <Label htmlFor="eventDate" className="text-sm font-medium">
                  이벤트 날짜
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={localSettings.eventDate}
                  onChange={(e) => setLocalSettings({ ...localSettings, eventDate: e.target.value })}
                  className="mt-1 h-12"
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-light flex items-center gap-2">
                <Palette className="w-5 h-5 text-green-600" />
                테마 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {themes.map((theme) => (
                  <Button
                    key={theme.value}
                    variant={localSettings.theme === theme.value ? "default" : "outline"}
                    className="h-12 flex items-center gap-3"
                    onClick={() => setLocalSettings({ ...localSettings, theme: theme.value })}
                  >
                    <div className={`w-4 h-4 rounded-full ${theme.color}`} />
                    <span className="text-sm">{theme.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full h-12 text-base">
            설정 저장
          </Button>
        </div>
      </div>
    </div>
  )
}

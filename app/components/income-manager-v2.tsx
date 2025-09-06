"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, Users, Settings, TrendingUp, DollarSign, Edit3 } from "lucide-react"
import { 
  IncomeDatabase, 
  YearlyIncomeData, 
  createEmptyIncomeDatabase, 
  createYearlyIncomeData,
  YearlyCalculatedIncome
} from "@/lib/income-types-v2"
import { 
  calculateYearlyIncome, 
  formatCurrency, 
  formatPercentage,
  createEmptyCalculation 
} from "@/lib/income-calculator-v2"

interface IncomeManagerV2Props {
  incomeDatabase: IncomeDatabase
  setIncomeDatabase: (database: IncomeDatabase) => void
}

type ViewMode = 'empty' | 'year_select' | 'template_setup' | 'input' | 'summary'

export default function IncomeManagerV2({ incomeDatabase, setIncomeDatabase }: IncomeManagerV2Props) {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<ViewMode>('empty')
  const [activeTab, setActiveTab] = useState<'summary' | 'jk' | 'sj' | 'template'>('summary')

  // 현재 년도 데이터
  const currentYearData = incomeDatabase.years[currentYear.toString()]
  
  // 계산된 소득 정보
  const calculatedIncome: YearlyCalculatedIncome = currentYearData 
    ? calculateYearlyIncome(currentYearData)
    : {
        year: currentYear,
        jk: createEmptyCalculation('jk', currentYear),
        sj: createEmptyCalculation('sj', currentYear),
        combined: {
          totalGrossIncome: 0,
          totalNetIncome: 0,
          monthlyTotalNetIncome: 0,
          averageMonthlyIncome: 0,
        },
      }

  // 초기 상태 설정
  useEffect(() => {
    if (!incomeDatabase.years || Object.keys(incomeDatabase.years).length === 0) {
      setViewMode('empty')
    } else if (currentYearData) {
      if (!currentYearData.isTemplateComplete) {
        setViewMode('template_setup')
      } else {
        setViewMode('summary')
      }
    } else {
      setViewMode('year_select')
    }
  }, [incomeDatabase, currentYear, currentYearData])

  // 새 년도 소득 데이터 생성
  const createNewYearIncome = (year: number) => {
    const newYearlyData = createYearlyIncomeData(year)
    const updatedDatabase = {
      ...incomeDatabase,
      currentYear: year,
      years: {
        ...incomeDatabase.years,
        [year.toString()]: newYearlyData,
      },
    }
    
    setIncomeDatabase(updatedDatabase)
    setCurrentYear(year)
    setViewMode('template_setup')
  }

  // 템플릿 완료 처리
  const completeTemplate = () => {
    if (!currentYearData) return
    
    const updatedYearData = {
      ...currentYearData,
      isTemplateComplete: true,
      lastUpdated: Date.now(),
    }
    
    const updatedDatabase = {
      ...incomeDatabase,
      years: {
        ...incomeDatabase.years,
        [currentYear.toString()]: updatedYearData,
      },
    }
    
    setIncomeDatabase(updatedDatabase)
    setViewMode('summary')
  }

  // 년도 목록 (현재 년도 기준 ±2년)
  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  // Empty State - 아무 데이터도 없을 때
  if (viewMode === 'empty') {
    return (
      <div className="max-w-lg mx-auto px-5 pb-20">
        <div className="text-center mb-6 pt-12">
          <h1 className="text-3xl font-light text-gray-900 mb-2">수입 관리</h1>
          <p className="text-sm text-gray-500">부부의 소득을 관리하고 세후 수입을 계산합니다</p>
        </div>

        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <DollarSign className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">소득 데이터가 없습니다</h2>
          <p className="text-gray-500 mb-8">새로운 년도의 소득 데이터를 만들어보세요</p>
          
          <button
            onClick={() => setViewMode('year_select')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            새 년도 소득 만들기
          </button>
        </div>
      </div>
    )
  }

  // Year Select State - 년도 선택
  if (viewMode === 'year_select') {
    return (
      <div className="max-w-lg mx-auto px-5 pb-20">
        <div className="text-center mb-6 pt-12">
          <h1 className="text-3xl font-light text-gray-900 mb-2">년도 선택</h1>
          <p className="text-sm text-gray-500">소득을 관리할 년도를 선택해주세요</p>
        </div>

        <div className="space-y-3">
          {availableYears.map((year) => {
            const hasData = incomeDatabase.years[year.toString()]
            return (
              <button
                key={year}
                onClick={() => {
                  if (hasData) {
                    setCurrentYear(year)
                    setViewMode(hasData.isTemplateComplete ? 'summary' : 'template_setup')
                  } else {
                    createNewYearIncome(year)
                  }
                }}
                className={`w-full text-left p-4 rounded-2xl transition-colors ${
                  hasData 
                    ? 'bg-blue-50 border-2 border-blue-200 hover:border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{year}년</h3>
                    <p className="text-sm text-gray-500">
                      {hasData ? '데이터 있음' : '새로 만들기'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    {hasData && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {Object.keys(incomeDatabase.years).length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                const currentData = incomeDatabase.years[incomeDatabase.currentYear.toString()]
                if (currentData) {
                  setCurrentYear(incomeDatabase.currentYear)
                  setViewMode(currentData.isTemplateComplete ? 'summary' : 'template_setup')
                }
              }}
              className="w-full text-center py-3 text-blue-600 hover:text-blue-700 font-medium"
            >
              기존 데이터로 돌아가기
            </button>
          </div>
        )}
      </div>
    )
  }

  // Template Setup State - 템플릿 설정 (임시 구현)
  if (viewMode === 'template_setup') {
    return (
      <div className="max-w-lg mx-auto px-5 pb-20">
        <div className="text-center mb-6 pt-12">
          <h1 className="text-3xl font-light text-gray-900 mb-1">{currentYear}년 템플릿 설정</h1>
          <p className="text-sm text-gray-500">소득 항목을 설정해주세요</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-yellow-800">
            📝 템플릿 설정 기능은 개발 중입니다. 임시로 기본 템플릿을 사용합니다.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">기본 과세 항목</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• 기본급 (연봉)</div>
              <div>• 상여금</div>
              <div>• 시간외근무수당</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">기본 비과세 항목</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• 식대 (월 최대 20만원)</div>
              <div>• 차량유지비 (월 최대 20만원)</div>
              <div>• 육아수당 (월 최대 20만원)</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">기본 공제 항목</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• 기본공제 (본인 150만원)</div>
              <div>• 배우자공제</div>
              <div>• 부양가족공제</div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode('year_select')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
          >
            이전
          </button>
          <button
            onClick={completeTemplate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
          >
            템플릿 확정
          </button>
        </div>
      </div>
    )
  }

  // Summary State - 요약 보기
  if (viewMode === 'summary' && currentYearData) {
    return (
      <div className="max-w-lg mx-auto px-5 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between pt-12 mb-6">
          <div>
            <h1 className="text-3xl font-light text-gray-900">{currentYear}년 수입</h1>
            <p className="text-sm text-gray-500">부부 합산 소득 현황</p>
          </div>
          <button
            onClick={() => setViewMode('year_select')}
            className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'summary'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            요약
          </button>
          <button
            onClick={() => setActiveTab('jk')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'jk'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            JK
          </button>
          <button
            onClick={() => setActiveTab('sj')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'sj'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            SJ
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'template'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-1" />
            설정
          </button>
        </div>

        {/* Content */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* 부부 합산 소득 카드 */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                부부 합산 소득
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-light text-gray-900">
                    {formatCurrency(calculatedIncome.combined.totalNetIncome)}
                  </p>
                  <p className="text-sm text-gray-600">연간 실수령액</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-gray-900">
                    {formatCurrency(calculatedIncome.combined.monthlyTotalNetIncome)}
                  </p>
                  <p className="text-sm text-gray-600">월 실수령액</p>
                </div>
              </div>
            </div>

            {/* 개별 소득 요약 */}
            <div className="space-y-4">
              <h3 className="text-base font-medium text-gray-900">개별 소득 현황</h3>
              
              {/* JK 소득 카드 */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-base font-semibold text-gray-900">JK</h4>
                  <button
                    onClick={() => setActiveTab('jk')}
                    className="text-blue-600 text-sm hover:text-blue-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-lg font-light text-gray-900">
                      {formatCurrency(calculatedIncome.jk.calculations.netIncome)}
                    </p>
                    <p className="text-xs text-gray-500">연간 실수령액</p>
                  </div>
                  <div>
                    <p className="text-lg font-light text-gray-900">
                      {formatCurrency(calculatedIncome.jk.calculations.monthlyNetIncome)}
                    </p>
                    <p className="text-xs text-gray-500">월 실수령액</p>
                  </div>
                </div>
                {calculatedIncome.jk.calculations.taxableStandard > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      세율: {formatPercentage(calculatedIncome.jk.calculations.taxRate)} ({calculatedIncome.jk.calculations.taxBracket})
                    </p>
                  </div>
                )}
              </div>

              {/* SJ 소득 카드 */}
              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-base font-semibold text-gray-900">SJ</h4>
                  <button
                    onClick={() => setActiveTab('sj')}
                    className="text-blue-600 text-sm hover:text-blue-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-lg font-light text-gray-900">
                      {formatCurrency(calculatedIncome.sj.calculations.netIncome)}
                    </p>
                    <p className="text-xs text-gray-500">연간 실수령액</p>
                  </div>
                  <div>
                    <p className="text-lg font-light text-gray-900">
                      {formatCurrency(calculatedIncome.sj.calculations.monthlyNetIncome)}
                    </p>
                    <p className="text-xs text-gray-500">월 실수령액</p>
                  </div>
                </div>
                {calculatedIncome.sj.calculations.taxableStandard > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      세율: {formatPercentage(calculatedIncome.sj.calculations.taxRate)} ({calculatedIncome.sj.calculations.taxBracket})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'jk' || activeTab === 'sj' || activeTab === 'template') && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">개발 중</h3>
            <p className="text-gray-500 text-sm">
              {activeTab === 'template' ? '템플릿 설정' : `${activeTab.toUpperCase()} 소득 입력`} 기능은 곧 추가될 예정입니다.
            </p>
          </div>
        )}
      </div>
    )
  }

  return null
}
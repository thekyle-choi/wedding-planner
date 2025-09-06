"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Minus, Calculator, DollarSign, TrendingUp, Users, PiggyBank } from "lucide-react"
import { PersonIncome, IncomeData, FamilyIncomeCalculation } from "@/lib/income-types"
import { calculateFamilyIncome, getTaxBracket } from "@/lib/income-calculator"

interface IncomeManagerProps {
  incomeData: IncomeData
  setIncomeData: (data: IncomeData) => void
}

const INITIAL_PERSON_INCOME: PersonIncome = {
  id: "",
  name: "",
  taxableIncome: {
    baseSalary: 0,
    bonus: 0,
    overtimePay: 0,
    otherTaxableIncome: [],
  },
  taxExemptIncome: {
    mealAllowance: 0,
    vehicleAllowance: 0,
    childcareAllowance: 0,
    researchAllowance: 0,
    otherTaxExemptIncome: [],
  },
  deductions: {
    employmentIncomeDeduction: 0,
    personalDeduction: 1500000, // 기본공제 150만원
    spouseDeduction: 0,
    dependentDeduction: 0,
    pensionDeduction: 0,
    healthInsuranceDeduction: 0,
    otherDeductions: 0,
  },
  socialInsurance: {
    nationalPension: 0,
    healthInsurance: 0,
    longTermCare: 0,
    employmentInsurance: 0,
    workersCompensation: 0,
  },
}

export default function IncomeManager({ incomeData, setIncomeData }: IncomeManagerProps) {
  const [activeTab, setActiveTab] = useState<"jk" | "sj" | "summary">("summary")
  const [isLoading, setIsLoading] = useState(false)

  // 기본값 설정
  useEffect(() => {
    if (!incomeData.jk.name) {
      setIncomeData({
        jk: { ...INITIAL_PERSON_INCOME, id: "jk", name: "JK" },
        sj: { ...INITIAL_PERSON_INCOME, id: "sj", name: "SJ" },
        lastUpdated: Date.now(),
      })
    }
  }, [incomeData, setIncomeData])

  // 계산된 소득 정보
  const calculatedData: FamilyIncomeCalculation = useMemo(() => {
    if (!incomeData.jk.name || !incomeData.sj.name) {
      return {
        jk: { person: incomeData.jk, calculations: { totalTaxableIncome: 0, totalTaxExemptIncome: 0, grossIncome: 0, employmentIncomeDeduction: 0, taxableIncomeAfterDeduction: 0, totalDeductions: 0, taxableStandard: 0, incomeTax: 0, localIncomeTax: 0, totalSocialInsurance: 0, netIncome: 0, monthlyNetIncome: 0 } },
        sj: { person: incomeData.sj, calculations: { totalTaxableIncome: 0, totalTaxExemptIncome: 0, grossIncome: 0, employmentIncomeDeduction: 0, taxableIncomeAfterDeduction: 0, totalDeductions: 0, taxableStandard: 0, incomeTax: 0, localIncomeTax: 0, totalSocialInsurance: 0, netIncome: 0, monthlyNetIncome: 0 } },
        combined: { totalGrossIncome: 0, totalNetIncome: 0, monthlyTotalNetIncome: 0, averageMonthlyIncome: 0 },
      }
    }
    return calculateFamilyIncome(incomeData.jk, incomeData.sj)
  }, [incomeData])

  const updatePersonIncome = (personId: "jk" | "sj", updates: Partial<PersonIncome>) => {
    setIncomeData({
      ...incomeData,
      [personId]: { ...incomeData[personId], ...updates },
      lastUpdated: Date.now(),
    })
  }

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString() + "원"
  }

  const formatPercentage = (rate: number): string => {
    return rate.toFixed(1) + "%"
  }

  const IncomeInputCard = ({ label, value, onChange, placeholder = "0", suffix = "원" }: {
    label: string
    value: number
    onChange: (value: number) => void
    placeholder?: string
    suffix?: string
  }) => (
    <div className="bg-gray-50 rounded-xl p-4">
      <label className="block text-sm text-gray-600 mb-2">{label}</label>
      <div className="flex items-center">
        <input
          type="number"
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          className="flex-1 bg-white border-0 rounded-lg px-3 py-2 text-right font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="ml-2 text-sm text-gray-500">{suffix}</span>
      </div>
    </div>
  )

  const PersonIncomeForm = ({ person, onUpdate }: { 
    person: PersonIncome
    onUpdate: (updates: Partial<PersonIncome>) => void 
  }) => (
    <div className="space-y-6">
      {/* 과세 소득 섹션 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          과세 소득
        </h3>
        <div className="space-y-3">
          <IncomeInputCard
            label="연봉 (기본급)"
            value={person.taxableIncome.baseSalary}
            onChange={(value) => onUpdate({
              taxableIncome: { ...person.taxableIncome, baseSalary: value }
            })}
          />
          <IncomeInputCard
            label="상여금 (연간)"
            value={person.taxableIncome.bonus}
            onChange={(value) => onUpdate({
              taxableIncome: { ...person.taxableIncome, bonus: value }
            })}
          />
          <IncomeInputCard
            label="시간외근무수당 (연간)"
            value={person.taxableIncome.overtimePay}
            onChange={(value) => onUpdate({
              taxableIncome: { ...person.taxableIncome, overtimePay: value }
            })}
          />
        </div>
      </div>

      {/* 비과세 소득 섹션 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <PiggyBank className="w-5 h-5 mr-2" />
          비과세 소득
        </h3>
        <div className="space-y-3">
          <IncomeInputCard
            label="식대 (월)"
            value={person.taxExemptIncome.mealAllowance}
            onChange={(value) => onUpdate({
              taxExemptIncome: { ...person.taxExemptIncome, mealAllowance: Math.min(value, 200000) }
            })}
            suffix="원 (최대 20만원)"
          />
          <IncomeInputCard
            label="차량유지비 (월)"
            value={person.taxExemptIncome.vehicleAllowance}
            onChange={(value) => onUpdate({
              taxExemptIncome: { ...person.taxExemptIncome, vehicleAllowance: Math.min(value, 200000) }
            })}
            suffix="원 (최대 20만원)"
          />
          <IncomeInputCard
            label="육아수당 (월)"
            value={person.taxExemptIncome.childcareAllowance}
            onChange={(value) => onUpdate({
              taxExemptIncome: { ...person.taxExemptIncome, childcareAllowance: Math.min(value, 200000) }
            })}
            suffix="원 (최대 20만원)"
          />
        </div>
      </div>

      {/* 소득공제 섹션 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">소득공제</h3>
        <div className="space-y-3">
          <IncomeInputCard
            label="배우자공제"
            value={person.deductions.spouseDeduction}
            onChange={(value) => onUpdate({
              deductions: { ...person.deductions, spouseDeduction: value }
            })}
          />
          <IncomeInputCard
            label="부양가족공제"
            value={person.deductions.dependentDeduction}
            onChange={(value) => onUpdate({
              deductions: { ...person.deductions, dependentDeduction: value }
            })}
          />
          <IncomeInputCard
            label="기타공제"
            value={person.deductions.otherDeductions}
            onChange={(value) => onUpdate({
              deductions: { ...person.deductions, otherDeductions: value }
            })}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-5 pb-20">
      {/* Header */}
      <div className="text-center mb-6 pt-12">
        <h1 className="text-3xl font-light text-gray-900 mb-2">수입 관리</h1>
        <p className="text-sm text-gray-500">부부의 소득을 관리하고 세후 수입을 계산합니다</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "summary"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          요약
        </button>
        <button
          onClick={() => setActiveTab("jk")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "jk"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          JK
        </button>
        <button
          onClick={() => setActiveTab("sj")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "sj"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          SJ
        </button>
      </div>

      {/* Content */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* 부부 합산 소득 카드 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              부부 합산 소득
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-light text-gray-900">
                  {formatCurrency(calculatedData.combined.totalNetIncome)}
                </p>
                <p className="text-sm text-gray-600">연간 실수령액</p>
              </div>
              <div>
                <p className="text-2xl font-light text-gray-900">
                  {formatCurrency(calculatedData.combined.monthlyTotalNetIncome)}
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
                  onClick={() => setActiveTab("jk")}
                  className="text-blue-600 text-sm hover:text-blue-700"
                >
                  수정
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-lg font-light text-gray-900">
                    {formatCurrency(calculatedData.jk.calculations.netIncome)}
                  </p>
                  <p className="text-xs text-gray-500">연간 실수령액</p>
                </div>
                <div>
                  <p className="text-lg font-light text-gray-900">
                    {formatCurrency(calculatedData.jk.calculations.monthlyNetIncome)}
                  </p>
                  <p className="text-xs text-gray-500">월 실수령액</p>
                </div>
              </div>
              {calculatedData.jk.calculations.taxableStandard > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    세율 구간: {formatPercentage(getTaxBracket(calculatedData.jk.calculations.taxableStandard).rate)}
                  </p>
                </div>
              )}
            </div>

            {/* SJ 소득 카드 */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-base font-semibold text-gray-900">SJ</h4>
                <button
                  onClick={() => setActiveTab("sj")}
                  className="text-blue-600 text-sm hover:text-blue-700"
                >
                  수정
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-lg font-light text-gray-900">
                    {formatCurrency(calculatedData.sj.calculations.netIncome)}
                  </p>
                  <p className="text-xs text-gray-500">연간 실수령액</p>
                </div>
                <div>
                  <p className="text-lg font-light text-gray-900">
                    {formatCurrency(calculatedData.sj.calculations.monthlyNetIncome)}
                  </p>
                  <p className="text-xs text-gray-500">월 실수령액</p>
                </div>
              </div>
              {calculatedData.sj.calculations.taxableStandard > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    세율 구간: {formatPercentage(getTaxBracket(calculatedData.sj.calculations.taxableStandard).rate)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "jk" && (
        <PersonIncomeForm
          person={incomeData.jk}
          onUpdate={(updates) => updatePersonIncome("jk", updates)}
        />
      )}

      {activeTab === "sj" && (
        <PersonIncomeForm
          person={incomeData.sj}
          onUpdate={(updates) => updatePersonIncome("sj", updates)}
        />
      )}
    </div>
  )
}
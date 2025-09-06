// 2025년 대한민국 소득세 계산을 위한 타입 정의

export interface TaxExemptItem {
  id: string
  name: string
  monthlyAmount: number
  maxMonthlyLimit: number
  description: string
}

export interface TaxableIncomeItem {
  id: string
  name: string
  annualAmount: number
  description: string
}

export interface PersonIncome {
  id: string
  name: string // "JK" 또는 "SJ"
  
  // 과세 소득
  taxableIncome: {
    baseSalary: number // 기본급 (연봉)
    bonus: number // 상여금
    overtimePay: number // 시간외근무수당
    otherTaxableIncome: TaxableIncomeItem[] // 기타 과세 소득
  }
  
  // 비과세 소득
  taxExemptIncome: {
    mealAllowance: number // 식대 (월 최대 20만원)
    vehicleAllowance: number // 차량유지비 (월 최대 20만원)
    childcareAllowance: number // 육아수당 (월 최대 20만원)
    researchAllowance: number // 연구활동비 (월 최대 20만원)
    otherTaxExemptIncome: TaxExemptItem[] // 기타 비과세 소득
  }
  
  // 소득공제 정보
  deductions: {
    employmentIncomeDeduction: number // 근로소득공제 (자동계산)
    personalDeduction: number // 기본공제 (본인 150만원)
    spouseDeduction: number // 배우자공제
    dependentDeduction: number // 부양가족공제
    pensionDeduction: number // 연금보험료공제
    healthInsuranceDeduction: number // 건강보험료공제
    otherDeductions: number // 기타공제
  }
  
  // 4대보험료 (자동계산)
  socialInsurance: {
    nationalPension: number // 국민연금 (4.5%)
    healthInsurance: number // 건강보험 (3.545%)
    longTermCare: number // 장기요양보험 (건강보험의 12.95%)
    employmentInsurance: number // 고용보험 (0.9%)
    workersCompensation: number // 산재보험 (업종별 차이)
  }
}

export interface IncomeData {
  jk: PersonIncome
  sj: PersonIncome
  lastUpdated: number
}

export interface TaxBracket {
  min: number
  max: number
  rate: number
  progressiveDeduction: number
}

// 2025년 소득세율표
export const TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 14000000, rate: 0.06, progressiveDeduction: 0 },
  { min: 14000000, max: 50000000, rate: 0.15, progressiveDeduction: 1260000 },
  { min: 50000000, max: 88000000, rate: 0.24, progressiveDeduction: 5760000 },
  { min: 88000000, max: 150000000, rate: 0.35, progressiveDeduction: 15440000 },
  { min: 150000000, max: 300000000, rate: 0.38, progressiveDeduction: 19940000 },
  { min: 300000000, max: 500000000, rate: 0.40, progressiveDeduction: 25940000 },
  { min: 500000000, max: 1000000000, rate: 0.42, progressiveDeduction: 35940000 },
  { min: 1000000000, max: Infinity, rate: 0.45, progressiveDeduction: 65940000 },
]

// 비과세 한도액 상수
export const TAX_EXEMPT_LIMITS = {
  MEAL_ALLOWANCE: 200000, // 월 20만원
  VEHICLE_ALLOWANCE: 200000, // 월 20만원
  CHILDCARE_ALLOWANCE: 200000, // 월 20만원
  RESEARCH_ALLOWANCE: 200000, // 월 20만원
} as const

// 4대보험 요율 (2025년)
export const SOCIAL_INSURANCE_RATES = {
  NATIONAL_PENSION: 0.045, // 4.5%
  HEALTH_INSURANCE: 0.03545, // 3.545%
  LONG_TERM_CARE: 0.1295, // 건강보험료의 12.95%
  EMPLOYMENT_INSURANCE: 0.009, // 0.9%
  WORKERS_COMPENSATION: 0.006, // 평균 0.6% (업종별 차이)
} as const

export interface CalculatedIncome {
  person: PersonIncome
  calculations: {
    totalTaxableIncome: number // 총 과세소득
    totalTaxExemptIncome: number // 총 비과세소득
    grossIncome: number // 총 소득 (과세+비과세)
    employmentIncomeDeduction: number // 근로소득공제
    taxableIncomeAfterDeduction: number // 근로소득금액
    totalDeductions: number // 총 소득공제
    taxableStandard: number // 과세표준
    incomeTax: number // 소득세
    localIncomeTax: number // 지방소득세 (소득세의 10%)
    totalSocialInsurance: number // 4대보험 총액
    netIncome: number // 실수령액 (연간)
    monthlyNetIncome: number // 월 실수령액
  }
}

export interface FamilyIncomeCalculation {
  jk: CalculatedIncome
  sj: CalculatedIncome
  combined: {
    totalGrossIncome: number // 부부 총소득
    totalNetIncome: number // 부부 실수령액 합계
    monthlyTotalNetIncome: number // 부부 월 실수령액 합계
    averageMonthlyIncome: number // 부부 평균 월소득
  }
}
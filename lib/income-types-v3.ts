// 그룹 기반 동적 소득 관리 시스템

export interface IncomeItem {
  id: string
  name: string
  type: 'taxable' | 'tax_exempt'
  category?: string
  monthlyLimit?: number // 비과세의 경우 월 한도 (예: 식대 20만원)
  description?: string
  order: number // 표시 순서
  isDefault: boolean // 기본 템플릿 항목인지
}

export interface DeductionItem {
  id: string
  name: string
  category: string
  description?: string
  order: number
  isDefault: boolean
  defaultValue?: number // 기본값 (예: 기본공제 150만원)
}

export interface IncomeTemplate {
  groupId: string
  groupName: string
  incomeItems: IncomeItem[]
  deductionItems: DeductionItem[]
  createdAt: number
  updatedAt: number
}

export interface PersonIncomeData {
  personId: 'jk' | 'sj'
  personName: string
  groupId: string
  incomeValues: { [itemId: string]: number } // 항목별 금액
  deductionValues: { [itemId: string]: number } // 공제별 금액
  updatedAt: number
}

export interface GroupIncomeData {
  groupId: string
  groupName: string
  template: IncomeTemplate
  jkData: PersonIncomeData
  sjData: PersonIncomeData
  isTemplateComplete: boolean // 템플릿 설정이 완료되었는지
  lastUpdated: number
  createdAt: number
}

export interface IncomeDatabase {
  currentGroupId: string | null
  groups: { [groupId: string]: GroupIncomeData }
}

// 계산 결과 타입
export interface CalculatedPersonIncome {
  person: PersonIncomeData
  calculations: {
    totalTaxableIncome: number
    totalTaxExemptIncome: number
    grossIncome: number
    employmentIncomeDeduction: number
    taxableIncomeAfterDeduction: number
    totalDeductions: number
    taxableStandard: number
    incomeTax: number
    localIncomeTax: number
    totalSocialInsurance: number
    netIncome: number
    monthlyNetIncome: number
    taxRate: number
    taxBracket: string
  }
}

export interface GroupCalculatedIncome {
  groupId: string
  groupName: string
  jk: CalculatedPersonIncome
  sj: CalculatedPersonIncome
  combined: {
    totalGrossIncome: number
    totalNetIncome: number
    monthlyTotalNetIncome: number
    averageMonthlyIncome: number
  }
}

// 기본 템플릿 데이터
export const DEFAULT_INCOME_ITEMS: IncomeItem[] = [
  {
    id: 'base_salary',
    name: '기본급 (연봉)',
    type: 'taxable',
    category: '급여',
    description: '연간 기본급여',
    order: 1,
    isDefault: true,
  },
  {
    id: 'bonus',
    name: '상여금',
    type: 'taxable',
    category: '급여',
    description: '연간 상여금',
    order: 2,
    isDefault: true,
  },
  {
    id: 'overtime_pay',
    name: '시간외근무수당',
    type: 'taxable',
    category: '수당',
    description: '연간 초과근무수당',
    order: 3,
    isDefault: true,
  },
  {
    id: 'meal_allowance',
    name: '식대',
    type: 'tax_exempt',
    category: '복리후생',
    monthlyLimit: 200000,
    description: '월 식대 (최대 20만원)',
    order: 10,
    isDefault: true,
  },
  {
    id: 'vehicle_allowance',
    name: '차량유지비',
    type: 'tax_exempt',
    category: '복리후생',
    monthlyLimit: 200000,
    description: '월 차량유지비 (최대 20만원)',
    order: 11,
    isDefault: true,
  },
  {
    id: 'childcare_allowance',
    name: '육아수당',
    type: 'tax_exempt',
    category: '복리후생',
    monthlyLimit: 200000,
    description: '월 육아수당 (최대 20만원)',
    order: 12,
    isDefault: true,
  },
]

export const DEFAULT_DEDUCTION_ITEMS: DeductionItem[] = [
  {
    id: 'personal_deduction',
    name: '기본공제 (본인)',
    category: '인적공제',
    description: '본인 기본공제',
    defaultValue: 1500000,
    order: 1,
    isDefault: true,
  },
  {
    id: 'spouse_deduction',
    name: '배우자공제',
    category: '인적공제',
    description: '배우자 공제 (소득요건 충족시)',
    order: 2,
    isDefault: true,
  },
  {
    id: 'dependent_deduction',
    name: '부양가족공제',
    category: '인적공제',
    description: '부양가족 1인당 150만원',
    order: 3,
    isDefault: true,
  },
  {
    id: 'pension_deduction',
    name: '연금보험료공제',
    category: '특별공제',
    description: '국민연금 등 연금보험료',
    order: 10,
    isDefault: true,
  },
  {
    id: 'health_insurance_deduction',
    name: '건강보험료공제',
    category: '특별공제',
    description: '건강보험료 및 장기요양보험료',
    order: 11,
    isDefault: true,
  },
]

// 2025년 소득세율표
export interface TaxBracket {
  min: number
  max: number
  rate: number
  progressiveDeduction: number
}

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

// 4대보험 요율 (2025년)
export const SOCIAL_INSURANCE_RATES = {
  NATIONAL_PENSION: 0.045, // 4.5%
  HEALTH_INSURANCE: 0.03545, // 3.545%
  LONG_TERM_CARE: 0.1295, // 건강보험료의 12.95%
  EMPLOYMENT_INSURANCE: 0.009, // 0.9%
  WORKERS_COMPENSATION: 0.006, // 평균 0.6% (업종별 차이)
} as const

// 고유 ID 생성 함수
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 템플릿 생성 헬퍼 함수
export function createDefaultTemplate(groupId: string, groupName: string): IncomeTemplate {
  return {
    groupId,
    groupName,
    incomeItems: [...DEFAULT_INCOME_ITEMS],
    deductionItems: [...DEFAULT_DEDUCTION_ITEMS],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// 그룹 데이터 생성 헬퍼 함수
export function createGroupIncomeData(groupName: string): GroupIncomeData {
  const groupId = generateId()
  const template = createDefaultTemplate(groupId, groupName)
  
  const createPersonData = (personId: 'jk' | 'sj', personName: string): PersonIncomeData => ({
    personId,
    personName,
    groupId,
    incomeValues: {},
    deductionValues: {
      personal_deduction: 1500000, // 기본공제는 기본값 설정
    },
    updatedAt: Date.now(),
  })

  return {
    groupId,
    groupName,
    template,
    jkData: createPersonData('jk', 'JK'),
    sjData: createPersonData('sj', 'SJ'),
    isTemplateComplete: false,
    lastUpdated: Date.now(),
    createdAt: Date.now(),
  }
}

// 빈 데이터베이스 생성
export function createEmptyIncomeDatabase(): IncomeDatabase {
  return {
    currentGroupId: null,
    groups: {},
  }
}

// 기본 그룹명 제안
export function getDefaultGroupName(): string {
  const currentYear = new Date().getFullYear()
  return `${currentYear}년 소득`
}

// 그룹명 유효성 검사
export function validateGroupName(name: string, existingGroups: { [key: string]: GroupIncomeData }): {
  isValid: boolean
  message?: string
} {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: '그룹명을 입력해주세요' }
  }
  
  if (name.trim().length > 30) {
    return { isValid: false, message: '그룹명은 30자 이내로 입력해주세요' }
  }
  
  const trimmedName = name.trim()
  const isDuplicate = Object.values(existingGroups).some(group => 
    group.groupName === trimmedName
  )
  
  if (isDuplicate) {
    return { isValid: false, message: '이미 존재하는 그룹명입니다' }
  }
  
  return { isValid: true }
}
import {
  GroupIncomeData,
  PersonIncomeData,
  CalculatedPersonIncome,
  GroupCalculatedIncome,
  TAX_BRACKETS,
  SOCIAL_INSURANCE_RATES,
  IncomeItem,
  DeductionItem,
} from './income-types-v3'

// 근로소득공제 계산 (2025년 기준)
export function calculateEmploymentIncomeDeduction(totalTaxableIncome: number): number {
  if (totalTaxableIncome <= 5000000) {
    return Math.min(totalTaxableIncome * 0.7, 7000000)
  } else if (totalTaxableIncome <= 15000000) {
    return Math.min(3500000 + (totalTaxableIncome - 5000000) * 0.4, 7000000)
  } else if (totalTaxableIncome <= 45000000) {
    return Math.min(7500000 + (totalTaxableIncome - 15000000) * 0.15, 12000000)
  } else if (totalTaxableIncome <= 100000000) {
    return Math.min(12000000 + (totalTaxableIncome - 45000000) * 0.05, 20000000)
  } else {
    return Math.min(14750000 + (totalTaxableIncome - 100000000) * 0.02, 20000000)
  }
}

// 소득세 계산 (누진세율 적용)
export function calculateIncomeTax(taxableStandard: number): number {
  if (taxableStandard <= 0) return 0
  
  const bracket = TAX_BRACKETS.find(b => taxableStandard > b.min && taxableStandard <= b.max)
  if (!bracket) {
    // 가장 높은 구간
    const highestBracket = TAX_BRACKETS[TAX_BRACKETS.length - 1]
    return taxableStandard * highestBracket.rate - highestBracket.progressiveDeduction
  }
  
  return Math.max(0, taxableStandard * bracket.rate - bracket.progressiveDeduction)
}

// 4대보험료 계산
export function calculateSocialInsurance(totalTaxableIncome: number): {
  nationalPension: number
  healthInsurance: number
  longTermCare: number
  employmentInsurance: number
  workersCompensation: number
  total: number
} {
  // 4대보험 기준소득월액 (과세소득 기준)
  const monthlyTaxableIncome = totalTaxableIncome / 12
  
  // 국민연금 기준소득월액 (상한: 553만원, 하한: 37만원)
  const pensionBase = Math.min(Math.max(monthlyTaxableIncome, 370000), 5530000)
  
  // 건강보험 기준소득월액 (상한: 약 1,200만원)
  const healthInsuranceBase = Math.min(monthlyTaxableIncome, 12000000)
  
  // 고용보험 기준소득월액 (상한: 약 900만원)
  const employmentInsuranceBase = Math.min(monthlyTaxableIncome, 9000000)
  
  const nationalPension = pensionBase * SOCIAL_INSURANCE_RATES.NATIONAL_PENSION * 12
  const healthInsurance = healthInsuranceBase * SOCIAL_INSURANCE_RATES.HEALTH_INSURANCE * 12
  const longTermCare = healthInsurance * SOCIAL_INSURANCE_RATES.LONG_TERM_CARE
  const employmentInsurance = employmentInsuranceBase * SOCIAL_INSURANCE_RATES.EMPLOYMENT_INSURANCE * 12
  const workersCompensation = monthlyTaxableIncome * SOCIAL_INSURANCE_RATES.WORKERS_COMPENSATION * 12
  
  return {
    nationalPension: Math.round(nationalPension),
    healthInsurance: Math.round(healthInsurance),
    longTermCare: Math.round(longTermCare),
    employmentInsurance: Math.round(employmentInsurance),
    workersCompensation: Math.round(workersCompensation),
    total: Math.round(nationalPension + healthInsurance + longTermCare + employmentInsurance + workersCompensation),
  }
}

// 과세소득 계산 (템플릿 기반)
export function calculateTotalTaxableIncome(
  incomeItems: IncomeItem[],
  incomeValues: { [itemId: string]: number }
): number {
  return incomeItems
    .filter(item => item.type === 'taxable')
    .reduce((total, item) => {
      const value = incomeValues[item.id] || 0
      return total + value
    }, 0)
}

// 비과세소득 계산 (템플릿 기반, 월 한도 적용)
export function calculateTotalTaxExemptIncome(
  incomeItems: IncomeItem[],
  incomeValues: { [itemId: string]: number }
): number {
  return incomeItems
    .filter(item => item.type === 'tax_exempt')
    .reduce((total, item) => {
      const monthlyValue = incomeValues[item.id] || 0
      const annualValue = monthlyValue * 12
      
      // 월 한도가 있는 경우 적용
      if (item.monthlyLimit) {
        const maxAnnualValue = item.monthlyLimit * 12
        return total + Math.min(annualValue, maxAnnualValue)
      }
      
      return total + annualValue
    }, 0)
}

// 소득공제 합계 계산 (템플릿 기반)
export function calculateTotalDeductions(
  deductionItems: DeductionItem[],
  deductionValues: { [itemId: string]: number }
): number {
  return deductionItems.reduce((total, item) => {
    const value = deductionValues[item.id] || item.defaultValue || 0
    return total + value
  }, 0)
}

// 소득세율 구간 조회
export function getTaxBracket(taxableStandard: number): { rate: number; bracket: string } {
  const bracket = TAX_BRACKETS.find(b => taxableStandard > b.min && taxableStandard <= b.max)
  if (!bracket) {
    const highestBracket = TAX_BRACKETS[TAX_BRACKETS.length - 1]
    return { 
      rate: highestBracket.rate * 100, 
      bracket: `${(highestBracket.min / 10000).toFixed(0)}만원 초과` 
    }
  }
  
  const minAmount = bracket.min === 0 ? 0 : bracket.min / 10000
  const maxAmount = bracket.max === Infinity ? '이상' : `${(bracket.max / 10000).toFixed(0)}만원`
  
  return {
    rate: bracket.rate * 100,
    bracket: bracket.min === 0 ? `${maxAmount} 이하` : `${minAmount.toFixed(0)}만원 ~ ${maxAmount}`
  }
}

// 개별 소득 계산 (새 구조 기반)
export function calculatePersonIncome(
  personData: PersonIncomeData,
  incomeItems: IncomeItem[],
  deductionItems: DeductionItem[]
): CalculatedPersonIncome {
  // 총 과세소득 계산
  const totalTaxableIncome = calculateTotalTaxableIncome(incomeItems, personData.incomeValues)
  
  // 총 비과세소득 계산
  const totalTaxExemptIncome = calculateTotalTaxExemptIncome(incomeItems, personData.incomeValues)
  
  // 총 소득 (과세 + 비과세)
  const grossIncome = totalTaxableIncome + totalTaxExemptIncome
  
  // 근로소득공제 계산
  const employmentIncomeDeduction = calculateEmploymentIncomeDeduction(totalTaxableIncome)
  
  // 근로소득금액 (과세소득 - 근로소득공제)
  const taxableIncomeAfterDeduction = Math.max(0, totalTaxableIncome - employmentIncomeDeduction)
  
  // 총 소득공제 계산
  const totalDeductions = calculateTotalDeductions(deductionItems, personData.deductionValues)
  
  // 과세표준 (근로소득금액 - 소득공제)
  const taxableStandard = Math.max(0, taxableIncomeAfterDeduction - totalDeductions)
  
  // 소득세 계산
  const incomeTax = calculateIncomeTax(taxableStandard)
  
  // 지방소득세 (소득세의 10%)
  const localIncomeTax = Math.round(incomeTax * 0.1)
  
  // 4대보험료 계산
  const socialInsurance = calculateSocialInsurance(totalTaxableIncome)
  
  // 세율 구간 정보
  const taxBracketInfo = getTaxBracket(taxableStandard)
  
  // 실수령액 계산 (총소득 - 소득세 - 지방소득세 - 4대보험료)
  const netIncome = Math.round(grossIncome - incomeTax - localIncomeTax - socialInsurance.total)
  
  // 월 실수령액
  const monthlyNetIncome = Math.round(netIncome / 12)
  
  return {
    person: personData,
    calculations: {
      totalTaxableIncome: Math.round(totalTaxableIncome),
      totalTaxExemptIncome: Math.round(totalTaxExemptIncome),
      grossIncome: Math.round(grossIncome),
      employmentIncomeDeduction: Math.round(employmentIncomeDeduction),
      taxableIncomeAfterDeduction: Math.round(taxableIncomeAfterDeduction),
      totalDeductions: Math.round(totalDeductions),
      taxableStandard: Math.round(taxableStandard),
      incomeTax: Math.round(incomeTax),
      localIncomeTax,
      totalSocialInsurance: socialInsurance.total,
      netIncome,
      monthlyNetIncome,
      taxRate: taxBracketInfo.rate,
      taxBracket: taxBracketInfo.bracket,
    },
  }
}

// 그룹 전체 소득 계산
export function calculateGroupIncome(groupData: GroupIncomeData): GroupCalculatedIncome {
  const jkCalculation = calculatePersonIncome(
    groupData.jkData,
    groupData.template.incomeItems,
    groupData.template.deductionItems
  )
  
  const sjCalculation = calculatePersonIncome(
    groupData.sjData,
    groupData.template.incomeItems,
    groupData.template.deductionItems
  )
  
  const totalGrossIncome = jkCalculation.calculations.grossIncome + sjCalculation.calculations.grossIncome
  const totalNetIncome = jkCalculation.calculations.netIncome + sjCalculation.calculations.netIncome
  const monthlyTotalNetIncome = Math.round(totalNetIncome / 12)
  const averageMonthlyIncome = Math.round(monthlyTotalNetIncome / 2)
  
  return {
    groupId: groupData.groupId,
    groupName: groupData.groupName,
    jk: jkCalculation,
    sj: sjCalculation,
    combined: {
      totalGrossIncome,
      totalNetIncome,
      monthlyTotalNetIncome,
      averageMonthlyIncome,
    },
  }
}

// 숫자 포맷팅 헬퍼 함수들
export function formatCurrency(amount: number): string {
  return amount.toLocaleString() + "원"
}

export function formatPercentage(rate: number): string {
  return rate.toFixed(1) + "%"
}

// 빈 계산 결과 생성 (데이터가 없을 때)
export function createEmptyCalculation(personId: 'jk' | 'sj', groupId: string): CalculatedPersonIncome {
  const emptyPersonData: PersonIncomeData = {
    personId,
    personName: personId.toUpperCase(),
    groupId,
    incomeValues: {},
    deductionValues: {},
    updatedAt: Date.now(),
  }

  return {
    person: emptyPersonData,
    calculations: {
      totalTaxableIncome: 0,
      totalTaxExemptIncome: 0,
      grossIncome: 0,
      employmentIncomeDeduction: 0,
      taxableIncomeAfterDeduction: 0,
      totalDeductions: 0,
      taxableStandard: 0,
      incomeTax: 0,
      localIncomeTax: 0,
      totalSocialInsurance: 0,
      netIncome: 0,
      monthlyNetIncome: 0,
      taxRate: 0,
      taxBracket: '해당없음',
    },
  }
}
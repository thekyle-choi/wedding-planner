import {
  PersonIncome,
  CalculatedIncome,
  FamilyIncomeCalculation,
  TAX_BRACKETS,
  TAX_EXEMPT_LIMITS,
  SOCIAL_INSURANCE_RATES,
} from './income-types'

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
export function calculateSocialInsurance(
  totalTaxableIncome: number,
  taxExemptIncome: { [key: string]: number }
): {
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

// 비과세 소득 검증 및 계산
export function calculateValidTaxExemptIncome(taxExemptIncome: PersonIncome['taxExemptIncome']): {
  validMealAllowance: number
  validVehicleAllowance: number
  validChildcareAllowance: number
  validResearchAllowance: number
  validOtherTaxExempt: number
  total: number
} {
  const validMealAllowance = Math.min(taxExemptIncome.mealAllowance * 12, TAX_EXEMPT_LIMITS.MEAL_ALLOWANCE * 12)
  const validVehicleAllowance = Math.min(taxExemptIncome.vehicleAllowance * 12, TAX_EXEMPT_LIMITS.VEHICLE_ALLOWANCE * 12)
  const validChildcareAllowance = Math.min(taxExemptIncome.childcareAllowance * 12, TAX_EXEMPT_LIMITS.CHILDCARE_ALLOWANCE * 12)
  const validResearchAllowance = Math.min(taxExemptIncome.researchAllowance * 12, TAX_EXEMPT_LIMITS.RESEARCH_ALLOWANCE * 12)
  
  const validOtherTaxExempt = taxExemptIncome.otherTaxExemptIncome.reduce((sum, item) => {
    return sum + Math.min(item.monthlyAmount * 12, item.maxMonthlyLimit * 12)
  }, 0)
  
  const total = validMealAllowance + validVehicleAllowance + validChildcareAllowance + validResearchAllowance + validOtherTaxExempt
  
  return {
    validMealAllowance,
    validVehicleAllowance,
    validChildcareAllowance,
    validResearchAllowance,
    validOtherTaxExempt,
    total,
  }
}

// 개별 소득 계산
export function calculatePersonIncome(person: PersonIncome): CalculatedIncome {
  // 총 과세소득 계산
  const totalTaxableIncome = 
    person.taxableIncome.baseSalary +
    person.taxableIncome.bonus +
    person.taxableIncome.overtimePay +
    person.taxableIncome.otherTaxableIncome.reduce((sum, item) => sum + item.annualAmount, 0)
  
  // 유효한 비과세소득 계산
  const validTaxExempt = calculateValidTaxExemptIncome(person.taxExemptIncome)
  const totalTaxExemptIncome = validTaxExempt.total
  
  // 총 소득 (과세 + 비과세)
  const grossIncome = totalTaxableIncome + totalTaxExemptIncome
  
  // 근로소득공제 계산
  const employmentIncomeDeduction = calculateEmploymentIncomeDeduction(totalTaxableIncome)
  
  // 근로소득금액 (과세소득 - 근로소득공제)
  const taxableIncomeAfterDeduction = Math.max(0, totalTaxableIncome - employmentIncomeDeduction)
  
  // 총 소득공제 계산
  const totalDeductions = 
    person.deductions.personalDeduction +
    person.deductions.spouseDeduction +
    person.deductions.dependentDeduction +
    person.deductions.pensionDeduction +
    person.deductions.healthInsuranceDeduction +
    person.deductions.otherDeductions
  
  // 과세표준 (근로소득금액 - 소득공제)
  const taxableStandard = Math.max(0, taxableIncomeAfterDeduction - totalDeductions)
  
  // 소득세 계산
  const incomeTax = calculateIncomeTax(taxableStandard)
  
  // 지방소득세 (소득세의 10%)
  const localIncomeTax = Math.round(incomeTax * 0.1)
  
  // 4대보험료 계산
  const socialInsurance = calculateSocialInsurance(
    totalTaxableIncome,
    person.taxExemptIncome
  )
  
  // 실수령액 계산 (총소득 - 소득세 - 지방소득세 - 4대보험료)
  const netIncome = Math.round(grossIncome - incomeTax - localIncomeTax - socialInsurance.total)
  
  // 월 실수령액
  const monthlyNetIncome = Math.round(netIncome / 12)
  
  return {
    person,
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
    },
  }
}

// 부부 합산 소득 계산
export function calculateFamilyIncome(jk: PersonIncome, sj: PersonIncome): FamilyIncomeCalculation {
  const jkCalculation = calculatePersonIncome(jk)
  const sjCalculation = calculatePersonIncome(sj)
  
  const totalGrossIncome = jkCalculation.calculations.grossIncome + sjCalculation.calculations.grossIncome
  const totalNetIncome = jkCalculation.calculations.netIncome + sjCalculation.calculations.netIncome
  const monthlyTotalNetIncome = Math.round(totalNetIncome / 12)
  const averageMonthlyIncome = Math.round(monthlyTotalNetIncome / 2)
  
  return {
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

// 소득세율 구간 조회
export function getTaxBracket(taxableStandard: number): { rate: number; bracket: string } {
  const bracket = TAX_BRACKETS.find(b => taxableStandard > b.min && taxableStandard <= b.max)
  if (!bracket) {
    const highestBracket = TAX_BRACKETS[TAX_BRACKETS.length - 1]
    return { rate: highestBracket.rate * 100, bracket: `${(highestBracket.min / 10000).toFixed(0)}만원 초과` }
  }
  
  const minAmount = bracket.min === 0 ? 0 : bracket.min / 10000
  const maxAmount = bracket.max === Infinity ? '이상' : `${(bracket.max / 10000).toFixed(0)}만원`
  
  return {
    rate: bracket.rate * 100,
    bracket: bracket.min === 0 ? `${maxAmount} 이하` : `${minAmount.toFixed(0)}만원 ~ ${maxAmount}`
  }
}
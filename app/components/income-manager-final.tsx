"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, Users, Settings, TrendingUp, DollarSign, Edit3, ArrowLeft, Check, X, Trash2, PiggyBank, User } from "lucide-react"
import { 
  IncomeDatabase, 
  GroupIncomeData, 
  createEmptyIncomeDatabase, 
  createGroupIncomeData,
  GroupCalculatedIncome,
  getDefaultGroupName,
  validateGroupName,
  IncomeItem,
  DeductionItem,
  DEFAULT_INCOME_ITEMS,
  DEFAULT_DEDUCTION_ITEMS,
  generateId,
  PersonIncomeData,
  IncomeTemplate
} from "@/lib/income-types-v3"
import { 
  calculateGroupIncome, 
  formatCurrency, 
  formatPercentage,
  createEmptyCalculation 
} from "@/lib/income-calculator-v3"

interface IncomeManagerFinalProps {
  incomeDatabase: IncomeDatabase
  setIncomeDatabase: (database: IncomeDatabase) => void
}

type ViewMode = 'empty' | 'group_select' | 'template_setup' | 'input' | 'summary'

export default function IncomeManagerFinal({ incomeDatabase, setIncomeDatabase }: IncomeManagerFinalProps) {
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(incomeDatabase.currentGroupId)
  const [viewMode, setViewMode] = useState<ViewMode>('empty')
  const [activeTab, setActiveTab] = useState<'summary' | 'jk' | 'sj' | 'template'>('summary')
  
  // 새 그룹 생성 상태
  const [newGroupName, setNewGroupName] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [createGroupError, setCreateGroupError] = useState('')

  // 현재 그룹 데이터
  const currentGroup = currentGroupId ? incomeDatabase.groups[currentGroupId] : null
  
  // 계산된 소득 정보
  const calculatedIncome: GroupCalculatedIncome = currentGroup 
    ? calculateGroupIncome(currentGroup)
    : {
        groupId: '',
        groupName: '',
        jk: createEmptyCalculation('jk', ''),
        sj: createEmptyCalculation('sj', ''),
        combined: {
          totalGrossIncome: 0,
          totalNetIncome: 0,
          monthlyTotalNetIncome: 0,
          averageMonthlyIncome: 0,
        },
      }

  // 초기 상태 설정
  useEffect(() => {
    if (!incomeDatabase.groups || Object.keys(incomeDatabase.groups).length === 0) {
      setViewMode('empty')
    } else if (currentGroup) {
      if (!currentGroup.isTemplateComplete) {
        setViewMode('template_setup')
      } else {
        setViewMode('summary')
      }
    } else {
      setViewMode('group_select')
    }
  }, [incomeDatabase, currentGroupId, currentGroup])

  // 새 그룹 생성
  const createNewGroup = () => {
    if (!newGroupName.trim()) {
      setCreateGroupError('그룹명을 입력해주세요')
      return
    }

    const validation = validateGroupName(newGroupName, incomeDatabase.groups)
    if (!validation.isValid) {
      setCreateGroupError(validation.message || '유효하지 않은 그룹명입니다')
      return
    }

    const newGroup = createGroupIncomeData(newGroupName.trim())
    const updatedDatabase = {
      ...incomeDatabase,
      currentGroupId: newGroup.groupId,
      groups: {
        ...incomeDatabase.groups,
        [newGroup.groupId]: newGroup,
      },
    }
    
    setIncomeDatabase(updatedDatabase)
    setCurrentGroupId(newGroup.groupId)
    setViewMode('template_setup')
    setShowCreateGroup(false)
    setNewGroupName('')
    setCreateGroupError('')
  }

  // 그룹 선택
  const selectGroup = (groupId: string) => {
    const group = incomeDatabase.groups[groupId]
    if (!group) return

    const updatedDatabase = {
      ...incomeDatabase,
      currentGroupId: groupId,
    }
    
    setIncomeDatabase(updatedDatabase)
    setCurrentGroupId(groupId)
    setViewMode(group.isTemplateComplete ? 'summary' : 'template_setup')
  }

  // 템플릿 완료 처리
  const completeTemplate = () => {
    if (!currentGroup) return
    
    const updatedGroup = {
      ...currentGroup,
      isTemplateComplete: true,
      lastUpdated: Date.now(),
    }
    
    const updatedDatabase = {
      ...incomeDatabase,
      groups: {
        ...incomeDatabase.groups,
        [currentGroup.groupId]: updatedGroup,
      },
    }
    
    setIncomeDatabase(updatedDatabase)
    setViewMode('summary')
  }

  // 그룹 목록 (최신순)
  const groupList = Object.values(incomeDatabase.groups).sort((a, b) => b.createdAt - a.createdAt)

  // Empty State - 아무 데이터도 없을 때
  if (viewMode === 'empty') {
    return (
      <div className="max-w-lg mx-auto px-5 pb-20">
        <div className="text-center mb-6 pt-12">
          <h1 className="text-3xl font-light text-gray-900 mb-2">수입 관리</h1>
          <p className="text-sm text-gray-500">부부의 소득을 그룹별로 관리하고 세후 수입을 계산합니다</p>
        </div>

        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <DollarSign className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">소득 그룹이 없습니다</h2>
          <p className="text-gray-500 mb-8">새로운 소득 그룹을 만들어보세요</p>
          
          <button
            onClick={() => {
              setNewGroupName(getDefaultGroupName())
              setShowCreateGroup(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            새 그룹 만들기
          </button>
        </div>

        <CreateGroupModal 
          show={showCreateGroup}
          groupName={newGroupName}
          error={createGroupError}
          onGroupNameChange={(name) => {
            setNewGroupName(name)
            setCreateGroupError('')
          }}
          onCancel={() => {
            setShowCreateGroup(false)
            setNewGroupName('')
            setCreateGroupError('')
          }}
          onCreate={createNewGroup}
        />
      </div>
    )
  }

  // Group Select State - 그룹 선택
  if (viewMode === 'group_select') {
    return (
      <div className="max-w-lg mx-auto px-5 pb-20">
        <div className="text-center mb-6 pt-12">
          <h1 className="text-3xl font-light text-gray-900 mb-2">그룹 선택</h1>
          <p className="text-sm text-gray-500">관리할 소득 그룹을 선택해주세요</p>
        </div>

        {/* 새 그룹 만들기 버튼 */}
        <button
          onClick={() => {
            setNewGroupName(getDefaultGroupName())
            setShowCreateGroup(true)
          }}
          className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          <Plus className="w-6 h-6 mx-auto mb-2" />
          <span className="text-sm font-medium">새 그룹 만들기</span>
        </button>

        {/* 기존 그룹 목록 */}
        <div className="space-y-3">
          {groupList.map((group) => (
            <button
              key={group.groupId}
              onClick={() => selectGroup(group.groupId)}
              className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{group.groupName}</h3>
                  <p className="text-sm text-gray-500">
                    {group.isTemplateComplete ? '설정 완료' : '템플릿 설정 필요'} • 
                    {new Date(group.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!group.isTemplateComplete && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                  {group.isTemplateComplete && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <CreateGroupModal 
          show={showCreateGroup}
          groupName={newGroupName}
          error={createGroupError}
          onGroupNameChange={(name) => {
            setNewGroupName(name)
            setCreateGroupError('')
          }}
          onCancel={() => {
            setShowCreateGroup(false)
            setNewGroupName('')
            setCreateGroupError('')
          }}
          onCreate={createNewGroup}
        />
      </div>
    )
  }

  // Template Setup State - 템플릿 설정
  if (viewMode === 'template_setup' && currentGroup) {
    return (
      <TemplateSetupEnhanced 
        group={currentGroup}
        onComplete={completeTemplate}
        onBack={() => setViewMode('group_select')}
        onUpdateGroup={(updatedGroup) => {
          const updatedDatabase = {
            ...incomeDatabase,
            groups: {
              ...incomeDatabase.groups,
              [updatedGroup.groupId]: updatedGroup,
            },
          }
          setIncomeDatabase(updatedDatabase)
        }}
      />
    )
  }

  // Summary State - 요약 보기
  if (viewMode === 'summary' && currentGroup) {
    return (
      <div className="max-w-lg mx-auto px-5 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between pt-12 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-light text-gray-900">{currentGroup.groupName}</h1>
            <p className="text-sm text-gray-500">부부 합산 소득 현황</p>
          </div>
          <button
            onClick={() => setViewMode('group_select')}
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

        {activeTab === 'jk' && (
          <PersonInputScreen 
            person={currentGroup.jkData}
            template={currentGroup.template}
            onUpdate={(updatedPerson) => {
              const updatedGroup = {
                ...currentGroup,
                jkData: updatedPerson,
                lastUpdated: Date.now(),
              }
              const updatedDatabase = {
                ...incomeDatabase,
                groups: {
                  ...incomeDatabase.groups,
                  [currentGroup.groupId]: updatedGroup,
                },
              }
              setIncomeDatabase(updatedDatabase)
            }}
          />
        )}

        {activeTab === 'sj' && (
          <PersonInputScreen 
            person={currentGroup.sjData}
            template={currentGroup.template}
            onUpdate={(updatedPerson) => {
              const updatedGroup = {
                ...currentGroup,
                sjData: updatedPerson,
                lastUpdated: Date.now(),
              }
              const updatedDatabase = {
                ...incomeDatabase,
                groups: {
                  ...incomeDatabase.groups,
                  [currentGroup.groupId]: updatedGroup,
                },
              }
              setIncomeDatabase(updatedDatabase)
            }}
          />
        )}

        {activeTab === 'template' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">다시 설정하기</h3>
            <p className="text-gray-500 text-sm mb-6">
              템플릿을 수정하려면 그룹을 새로 만드세요.
            </p>
            <button
              onClick={() => setViewMode('group_select')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              그룹 보기
            </button>
          </div>
        )}
      </div>
    )
  }

  return null
}

// 그룹 생성 모달 컴포넌트
function CreateGroupModal({
  show,
  groupName,
  error,
  onGroupNameChange,
  onCancel,
  onCreate
}: {
  show: boolean
  groupName: string
  error: string
  onGroupNameChange: (name: string) => void
  onCancel: () => void
  onCreate: () => void
}) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">새 소득 그룹 만들기</h3>
        
        <div className="mb-4">
          <input
            type="text"
            value={groupName}
            onChange={(e) => onGroupNameChange(e.target.value)}
            placeholder="그룹명을 입력하세요"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={30}
            autoFocus
          />
          <div className="flex justify-between mt-2">
            {error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : (
              <div />
            )}
            <p className="text-gray-400 text-sm">{groupName.length}/30</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={onCreate}
            className="flex-1 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  )
}

// 개인별 입력 화면 컴포넌트
function PersonInputScreen({
  person,
  template,
  onUpdate
}: {
  person: PersonIncomeData
  template: IncomeTemplate
  onUpdate: (person: PersonIncomeData) => void
}) {
  const [incomeValues, setIncomeValues] = useState(person.incomeValues)
  const [deductionValues, setDeductionValues] = useState(person.deductionValues)

  // 값 변경 시 자동 저장
  const updateIncomeValue = (itemId: string, value: number) => {
    const newIncomeValues = { ...incomeValues, [itemId]: value }
    setIncomeValues(newIncomeValues)
    
    const updatedPerson: PersonIncomeData = {
      ...person,
      incomeValues: newIncomeValues,
      updatedAt: Date.now(),
    }
    onUpdate(updatedPerson)
  }

  const updateDeductionValue = (itemId: string, value: number) => {
    const newDeductionValues = { ...deductionValues, [itemId]: value }
    setDeductionValues(newDeductionValues)
    
    const updatedPerson: PersonIncomeData = {
      ...person,
      deductionValues: newDeductionValues,
      updatedAt: Date.now(),
    }
    onUpdate(updatedPerson)
  }

  // 카테고리별로 소득 항목 그룹화
  const groupedIncomeItems = template.incomeItems
    .sort((a, b) => a.order - b.order)
    .reduce((acc, item) => {
      const category = item.category || '기타'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {} as { [category: string]: IncomeItem[] })

  // 카테고리별로 공제 항목 그룹화
  const groupedDeductionItems = template.deductionItems
    .sort((a, b) => a.order - b.order)
    .reduce((acc, item) => {
      const category = item.category || '기타'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {} as { [category: string]: DeductionItem[] })

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{person.personName} 소득 입력</h2>
        <p className="text-sm text-gray-500">금액을 입력하면 자동으로 저장됩니다</p>
      </div>

      {/* 소득 항목 */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          소득 항목
        </h3>

        {Object.entries(groupedIncomeItems).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h4 className="text-base font-medium text-gray-700">{category}</h4>
            {items.map((item) => (
              <IncomeInputCard
                key={item.id}
                item={item}
                value={incomeValues[item.id] || 0}
                onChange={(value) => updateIncomeValue(item.id, value)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 공제 항목 */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <PiggyBank className="w-5 h-5 mr-2" />
          공제 항목
        </h3>

        {Object.entries(groupedDeductionItems).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h4 className="text-base font-medium text-gray-700">{category}</h4>
            {items.map((item) => (
              <DeductionInputCard
                key={item.id}
                item={item}
                value={deductionValues[item.id] || item.defaultValue || 0}
                onChange={(value) => updateDeductionValue(item.id, value)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// 소득 항목 입력 카드
function IncomeInputCard({
  item,
  value,
  onChange
}: {
  item: IncomeItem
  value: number
  onChange: (value: number) => void
}) {
  const isMonthly = item.type === 'tax_exempt'
  const displayValue = isMonthly && value > 0 ? value : value === 0 ? '' : value

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <h5 className="font-medium text-gray-900">{item.name}</h5>
          <span className={`text-xs px-2 py-1 rounded-full ${
            item.type === 'taxable' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {item.type === 'taxable' ? '과세' : '비과세'}
          </span>
        </div>
      </div>

      {item.description && (
        <p className="text-sm text-gray-500 mb-3">{item.description}</p>
      )}

      <div className="flex items-center space-x-3">
        <input
          type="number"
          value={displayValue}
          onChange={(e) => {
            const inputValue = e.target.value
            onChange(inputValue === '' ? 0 : parseInt(inputValue) || 0)
          }}
          placeholder="0"
          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500 min-w-0">
          {isMonthly ? '원/월' : '원/년'}
        </span>
      </div>

      {item.monthlyLimit && (
        <p className="text-xs text-gray-500 mt-2">
          월 최대 {item.monthlyLimit.toLocaleString()}원
          {value > item.monthlyLimit && (
            <span className="text-orange-600"> (한도 초과)</span>
          )}
        </p>
      )}
    </div>
  )
}

// 공제 항목 입력 카드
function DeductionInputCard({
  item,
  value,
  onChange
}: {
  item: DeductionItem
  value: number
  onChange: (value: number) => void
}) {
  const displayValue = value === 0 ? '' : value

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium text-gray-900">{item.name}</h5>
        {item.defaultValue && item.defaultValue > 0 && (
          <button
            onClick={() => onChange(item.defaultValue!)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            기본값 적용
          </button>
        )}
      </div>

      {item.description && (
        <p className="text-sm text-gray-500 mb-3">{item.description}</p>
      )}

      <div className="flex items-center space-x-3">
        <input
          type="number"
          value={displayValue}
          onChange={(e) => {
            const inputValue = e.target.value
            onChange(inputValue === '' ? 0 : parseInt(inputValue) || 0)
          }}
          placeholder={item.defaultValue ? item.defaultValue.toLocaleString() : '0'}
          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500 min-w-0">원/년</span>
      </div>

      {item.defaultValue && (
        <p className="text-xs text-gray-500 mt-2">
          기본값: {item.defaultValue.toLocaleString()}원
        </p>
      )}
    </div>
  )
}

import TemplateSetupEnhanced from './template-setup-enhanced'
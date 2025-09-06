"use client"

import { useState, useEffect } from "react"
import { Plus, ArrowLeft, Users, User, DollarSign, Edit3, Trash2, RotateCcw, X } from "lucide-react"
import { 
  IncomeDatabase, 
  GroupIncomeData, 
  createEmptyIncomeDatabase, 
  createGroupIncomeData,
  GroupCalculatedIncome,
  getDefaultGroupName,
  validateGroupName,
  IncomeItem,
  generateId,
  PersonIncomeData,
  IncomeTemplate,
  hasGroupIncomeInput,
  hasIncomeInput,
  DEFAULT_INCOME_ITEMS
} from "@/lib/income-types-simple"
import { 
  calculateGroupIncome, 
  calculatePersonIncome,
  formatCurrency, 
  formatPercentage,
  createEmptyCalculation 
} from "@/lib/income-calculator-simple"

interface IncomeManagerUltraProps {
  incomeDatabase: IncomeDatabase
  setIncomeDatabase: (database: IncomeDatabase) => void
}

type ViewMode = 'empty' | 'group_select' | 'summary'

export default function IncomeManagerUltra({ incomeDatabase, setIncomeDatabase }: IncomeManagerUltraProps) {
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(incomeDatabase.currentGroupId)
  const [viewMode, setViewMode] = useState<ViewMode>('empty')
  const [activeTab, setActiveTab] = useState<'summary' | 'jk' | 'sj'>('summary')
  
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
      setViewMode('summary')
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
    setViewMode('summary')
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
    setViewMode('summary')
  }

  // 그룹 삭제
  const deleteGroup = (groupId: string) => {
    const { [groupId]: _, ...remainingGroups } = incomeDatabase.groups
    
    const updatedDatabase = {
      ...incomeDatabase,
      currentGroupId: currentGroupId === groupId ? null : currentGroupId,
      groups: remainingGroups,
    }
    
    setIncomeDatabase(updatedDatabase)
    if (currentGroupId === groupId) {
      setCurrentGroupId(null)
      if (Object.keys(remainingGroups).length === 0) {
        setViewMode('empty')
      } else {
        setViewMode('group_select')
      }
    }
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
      <div className="min-h-screen bg-white pb-20">
        <div className="max-w-lg mx-auto px-5">
          <div className="pt-12 mb-6">
            <h1 className="text-3xl font-light text-gray-900 mb-1">수입 관리</h1>
            <p className="text-sm text-gray-500">소득 계산 및 관리</p>
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
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium active:bg-gray-800"
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
      </div>
    )
  }

  // Group Select State - 그룹 선택
  if (viewMode === 'group_select') {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="max-w-lg mx-auto px-5">
          <div className="pt-12 mb-6">
            <h1 className="text-3xl font-light text-gray-900 mb-1">그룹 선택</h1>
            <p className="text-sm text-gray-500">관리할 소득 그룹을 선택해주세요</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setNewGroupName(getDefaultGroupName())
                setShowCreateGroup(true)
              }}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 active:bg-gray-200"
            >
              새 그룹 만들기
            </button>
          </div>

          {/* 기존 그룹 목록 */}
          <div className="space-y-2">
            {groupList.map((group) => (
              <div
                key={group.groupId}
                className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectGroup(group.groupId)}
                    className="flex-1 text-left"
                  >
                    <h3 className="text-base font-medium text-gray-900 mb-1">{group.groupName}</h3>
                    <p className="text-sm text-gray-500">
                      {group.isTemplateComplete ? '설정 완료' : '템플릿 설정 필요'} • 
                      {new Date(group.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      group.isTemplateComplete ? 'bg-green-500' : 'bg-orange-500'
                    }`}></div>
                    <button
                      onClick={() => {
                        if (confirm(`"${group.groupName}"을(를) 삭제하시겠습니까?`)) {
                          deleteGroup(group.groupId)
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
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
      </div>
    )
  }

  // Template Setup State - 템플릿 설정
  if (viewMode === 'template_setup' && currentGroup) {
    return (
      <TemplateSetup 
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
    // 소득 입력이 있는지 확인
    const hasAnyInput = hasGroupIncomeInput(currentGroup)
    const hasJKInput = hasIncomeInput(currentGroup.jkData)
    const hasSJInput = hasIncomeInput(currentGroup.sjData)

    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="max-w-lg mx-auto px-5">
          {/* Header */}
          <div className="flex items-center gap-2 pt-12 mb-6">
            <button
              onClick={() => setViewMode('group_select')}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-light text-gray-900">{currentGroup.groupName}</h1>
              <p className="text-sm text-gray-500">소득 현황</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-xl gap-1 p-1 mb-6">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              요약
            </button>
            <button
              onClick={() => setActiveTab('jk')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'jk'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              JK
            </button>
            <button
              onClick={() => setActiveTab('sj')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'sj'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              SJ
            </button>
          </div>

          {/* Content */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {!hasAnyInput ? (
                /* 소득 입력이 없을 때 */
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">소득을 입력해보세요</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    JK 또는 SJ 탭에서 소득을 입력하면 실수령액을 확인할 수 있습니다
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('jk')}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium active:bg-gray-800"
                    >
                      JK 소득 입력
                    </button>
                    <button
                      onClick={() => setActiveTab('sj')}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium active:bg-gray-800"
                    >
                      SJ 소득 입력
                    </button>
                  </div>
                </div>
              ) : (
                /* 소득 입력이 있을 때 */
                <>
                  {/* 부부 합산 소득 카드 - 둘 다 입력이 있을 때만 */}
                  {hasJKInput && hasSJInput && (
                    <div className="bg-gray-50 rounded-2xl p-5">
                      <h2 className="text-base font-medium text-gray-900 mb-4">부부 합산 소득</h2>
                      
                      {/* 주요 금액 - 연간 기준으로 통일 */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500">연간 세전 소득</span>
                          <div className="text-right">
                            <span className="text-2xl font-light text-gray-900">
                              {formatCurrency(calculatedIncome.combined.totalGrossIncome)}
                            </span>
                            <p className="text-sm text-gray-500">
                              ({formatCurrency(Math.round(calculatedIncome.combined.totalGrossIncome / 12))}/월)
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">연간 실수령액</span>
                          <div className="text-right">
                            <span className="text-2xl font-semibold text-gray-900">
                              {formatCurrency(calculatedIncome.combined.totalNetIncome)}
                            </span>
                            <p className="text-sm text-gray-500">
                              ({formatCurrency(calculatedIncome.combined.monthlyTotalNetIncome)}/월)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 개별 소득 요약 - 입력이 있는 것만 표시 */}
                  <div className="space-y-3">
                    <h3 className="text-base font-medium text-gray-900">
                      {hasJKInput && hasSJInput ? '개별 소득 현황' : '소득 현황'}
                    </h3>
                    
                    {/* JK 소득 카드 - 입력이 있을 때만 */}
                    {hasJKInput && (
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-base font-medium text-gray-900">JK</h4>
                          <button
                            onClick={() => setActiveTab('jk')}
                            className="text-gray-600 text-sm hover:text-gray-900"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* 주요 금액 - 연간 기준으로 통일 */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500">연간 세전 소득</span>
                            <div className="text-right">
                              <span className="text-lg font-light text-gray-900">
                                {formatCurrency(calculatedIncome.jk.calculations.grossIncome)}
                              </span>
                              <p className="text-xs text-gray-500">
                                ({formatCurrency(Math.round(calculatedIncome.jk.calculations.grossIncome / 12))}/월)
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">연간 실수령액</span>
                            <div className="text-right">
                              <span className="text-lg font-semibold text-gray-900">
                                {formatCurrency(calculatedIncome.jk.calculations.netIncome)}
                              </span>
                              <p className="text-xs text-gray-500">
                                ({formatCurrency(calculatedIncome.jk.calculations.monthlyNetIncome)}/월)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SJ 소득 카드 - 입력이 있을 때만 */}
                    {hasSJInput && (
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-base font-medium text-gray-900">SJ</h4>
                          <button
                            onClick={() => setActiveTab('sj')}
                            className="text-gray-600 text-sm hover:text-gray-900"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* 주요 금액 - 연간 기준으로 통일 */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-500">연간 세전 소득</span>
                            <div className="text-right">
                              <span className="text-lg font-light text-gray-900">
                                {formatCurrency(calculatedIncome.sj.calculations.grossIncome)}
                              </span>
                              <p className="text-xs text-gray-500">
                                ({formatCurrency(Math.round(calculatedIncome.sj.calculations.grossIncome / 12))}/월)
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">연간 실수령액</span>
                            <div className="text-right">
                              <span className="text-lg font-semibold text-gray-900">
                                {formatCurrency(calculatedIncome.sj.calculations.netIncome)}
                              </span>
                              <p className="text-xs text-gray-500">
                                ({formatCurrency(calculatedIncome.sj.calculations.monthlyNetIncome)}/월)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 입력 안내 - 한 명만 입력했을 때 */}
                    {(hasJKInput && !hasSJInput) || (!hasJKInput && hasSJInput) ? (
                      <div className="bg-blue-50 rounded-2xl p-4">
                        <p className="text-sm text-blue-800">
                          💡 <strong>{hasJKInput ? 'SJ' : 'JK'}</strong>의 소득도 입력하면 부부 합산 소득을 확인할 수 있어요
                        </p>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
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
        </div>
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
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
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

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium active:bg-gray-200"
          >
            취소
          </button>
          <button
            onClick={onCreate}
            className="flex-1 px-4 py-3 text-white bg-gray-900 hover:bg-gray-800 rounded-xl font-medium active:bg-gray-800"
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
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ 
    name: '', 
    type: 'taxable' as const, 
    unit: 'yearly' as const,
    category: '', 
    monthlyLimit: '' 
  })

  // 값 변경 시 자동 저장 (만원 단위로 변환)
  const updateIncomeValue = (itemId: string, manwonValue: number) => {
    const actualValue = manwonValue * 10000 // 만원을 실제 금액으로 변환
    const newIncomeValues = { ...incomeValues, [itemId]: actualValue }
    setIncomeValues(newIncomeValues)
    
    const updatedPerson: PersonIncomeData = {
      ...person,
      incomeValues: newIncomeValues,
      updatedAt: Date.now(),
    }
    onUpdate(updatedPerson)
  }

  // 개인 항목 추가
  const addPersonalItem = () => {
    if (!newItem.name.trim()) return

    const item: IncomeItem = {
      id: generateId(),
      name: newItem.name.trim(),
      type: newItem.type,
      unit: newItem.unit,
      category: newItem.category.trim() || '기타',
      monthlyLimit: newItem.type === 'tax_exempt' && newItem.monthlyLimit 
        ? parseInt(newItem.monthlyLimit) * 10000 // 만원을 실제 금액으로 변환
        : undefined,
      description: '',
      order: 999, // 개인 항목은 마지막에 표시
      isDefault: false,
    }

    const currentPersonalItems = person.personalItems || []
    const updatedPerson: PersonIncomeData = {
      ...person,
      personalItems: [...currentPersonalItems, item],
      updatedAt: Date.now(),
    }
    onUpdate(updatedPerson)
    setNewItem({ name: '', type: 'taxable', unit: 'yearly', category: '', monthlyLimit: '' })
    setShowAddItem(false)
  }

  // 개인 항목 삭제
  const removePersonalItem = (itemId: string) => {
    const currentPersonalItems = person.personalItems || []
    const updatedPerson: PersonIncomeData = {
      ...person,
      personalItems: currentPersonalItems.filter(item => item.id !== itemId),
      incomeValues: { ...person.incomeValues, [itemId]: undefined } as any,
      updatedAt: Date.now(),
    }
    onUpdate(updatedPerson)
  }

  // 단순 리스트로 소득 항목 정렬 (카테고리 구분 없음)
  const personalItems = person.personalItems || []
  const allItems = [...template.incomeItems, ...personalItems].sort((a, b) => a.order - b.order)

  // 개인 소득 계산
  const personalCalculation = calculatePersonIncome(person, template.incomeItems)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">{person.personName}</h2>
        <button
          onClick={() => setShowAddItem(true)}
          className="text-gray-900 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          항목 추가
        </button>
      </div>

      {/* 세전/세후 총계 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">세전 소득</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(personalCalculation.calculations.grossIncome)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">세후 소득</p>
            <p className="text-lg font-medium text-gray-900">
              {formatCurrency(personalCalculation.calculations.netIncome)}
            </p>
          </div>
        </div>
      </div>

      {allItems.map((item) => {
        const actualValue = incomeValues[item.id] || 0
        const manwonValue = Math.round(actualValue / 10000)
        const isPersonalItem = (person.personalItems || []).some(pi => pi.id === item.id)

        return (
          <IncomeInputCard
            key={item.id}
            item={item}
            value={manwonValue}
            onChange={(value) => updateIncomeValue(item.id, value)}
            onRemove={isPersonalItem ? () => removePersonalItem(item.id) : undefined}
          />
        )
      })}

      {/* 항목 추가 모달 */}
      {showAddItem && (
        <AddItemModal
          item={newItem}
          onItemChange={setNewItem}
          onCancel={() => {
            setShowAddItem(false)
            setNewItem({ name: '', type: 'taxable', unit: 'yearly', category: '', monthlyLimit: '' })
          }}
          onAdd={addPersonalItem}
        />
      )}
    </div>
  )
}

// 소득 항목 입력 카드
function IncomeInputCard({
  item,
  value,
  onChange,
  onRemove
}: {
  item: IncomeItem
  value: number
  onChange: (value: number) => void
  onRemove?: () => void
}) {
  const isMonthly = item.unit === 'monthly'
  const displayValue = value === 0 ? '' : value

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h5 className="font-medium text-gray-900">{item.name}</h5>
          <span className={`text-xs px-2 py-1 rounded-full ${
            item.type === 'taxable' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {item.type === 'taxable' ? '과세' : '비과세'}
          </span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {item.description && (
        <p className="text-sm text-gray-500 mb-3">{item.description}</p>
      )}

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={displayValue}
          onChange={(e) => {
            const inputValue = e.target.value
            onChange(inputValue === '' ? 0 : parseInt(inputValue) || 0)
          }}
          placeholder="0"
          className="flex-1 bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm text-right focus:outline-none focus:border-gray-400"
        />
        <span className="text-sm text-gray-500 min-w-0">
          {isMonthly ? '만원/월' : '만원/년'}
        </span>
      </div>

      {item.monthlyLimit && (
        <p className="text-xs text-gray-500 mt-2">
          월 최대 {Math.round(item.monthlyLimit / 10000)}만원
          {value > (item.monthlyLimit / 10000) && (
            <span className="text-orange-600"> (한도 초과)</span>
          )}
        </p>
      )}
    </div>
  )
}

// 템플릿 설정 컴포넌트
function TemplateSetup({ 
  group, 
  onComplete, 
  onBack, 
  onUpdateGroup 
}: {
  group: GroupIncomeData
  onComplete: () => void
  onBack: () => void
  onUpdateGroup: (group: GroupIncomeData) => void
}) {
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>(group.template.incomeItems)
  
  // 모달 상태
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [showRestoreDefaults, setShowRestoreDefaults] = useState(false)
  
  // 새 항목 상태
  const [newIncomeItem, setNewIncomeItem] = useState({ 
    name: '', 
    type: 'taxable' as const, 
    category: '', 
    monthlyLimit: '' 
  })

  // 삭제된 기본 항목들 찾기
  const missingDefaultIncomeItems = DEFAULT_INCOME_ITEMS.filter(defaultItem => 
    !incomeItems.some(item => item.id === defaultItem.id)
  )

  const addIncomeItem = () => {
    if (!newIncomeItem.name.trim()) return

    const item: IncomeItem = {
      id: generateId(),
      name: newIncomeItem.name.trim(),
      type: newIncomeItem.type,
      category: newIncomeItem.category.trim() || '기타',
      monthlyLimit: newIncomeItem.type === 'tax_exempt' && newIncomeItem.monthlyLimit 
        ? parseInt(newIncomeItem.monthlyLimit) * 10000 // 만원을 실제 금액으로 변환
        : undefined,
      description: '',
      order: Math.max(...incomeItems.map(i => i.order), 0) + 1,
      isDefault: false,
    }

    setIncomeItems([...incomeItems, item])
    setNewIncomeItem({ name: '', type: 'taxable', category: '', monthlyLimit: '' })
    setShowAddIncome(false)
  }

  const removeIncomeItem = (id: string) => {
    setIncomeItems(incomeItems.filter(item => item.id !== id))
  }

  const restoreDefaultItem = (item: IncomeItem) => {
    setIncomeItems([...incomeItems, item])
  }

  const saveTemplate = () => {
    const updatedGroup: GroupIncomeData = {
      ...group,
      template: {
        ...group.template,
        incomeItems,
        updatedAt: Date.now(),
      },
      lastUpdated: Date.now(),
    }
    onUpdateGroup(updatedGroup)
    onComplete()
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-lg mx-auto px-5">
        {/* Header */}
        <div className="flex items-center gap-2 pt-12 mb-6">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-light text-gray-900">{group.groupName}</h1>
            <p className="text-sm text-gray-500">필요한 소득 항목을 설정하세요</p>
          </div>
        </div>

        {/* 소득 항목 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">소득 항목</h2>
            <div className="flex gap-2">
              {missingDefaultIncomeItems.length > 0 && (
                <button
                  onClick={() => setShowRestoreDefaults(true)}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  기본 항목
                </button>
              )}
              <button
                onClick={() => setShowAddIncome(true)}
                className="text-gray-900 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                항목 추가
              </button>
            </div>
          </div>

          {incomeItems.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm mb-3">소득 항목이 없습니다</p>
              <button
                onClick={() => setShowAddIncome(true)}
                className="text-gray-900 hover:text-gray-700 text-sm font-medium"
              >
                첫 번째 항목 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {incomeItems.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.type === 'taxable' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.type === 'taxable' ? '과세' : '비과세'}
                        </span>
                        {item.isDefault && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                            기본
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {item.category}
                        {item.monthlyLimit && ` • 월 최대 ${Math.round(item.monthlyLimit / 10000)}만원`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeIncomeItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="항목 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 완료 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium active:bg-gray-200"
          >
            이전
          </button>
          <button
            onClick={saveTemplate}
            className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium active:bg-gray-800"
          >
            설정 완료
          </button>
        </div>

        {/* 소득 항목 추가 모달 */}
        {showAddIncome && (
          <AddItemModal
            item={newIncomeItem}
            onItemChange={setNewIncomeItem}
            onCancel={() => {
              setShowAddIncome(false)
              setNewIncomeItem({ name: '', type: 'taxable', category: '', monthlyLimit: '' })
            }}
            onAdd={addIncomeItem}
          />
        )}

        {/* 기본 항목 복원 모달 */}
        {showRestoreDefaults && (
          <RestoreDefaultsModal
            missingIncomeItems={missingDefaultIncomeItems}
            onRestore={restoreDefaultItem}
            onClose={() => setShowRestoreDefaults(false)}
          />
        )}
      </div>
    </div>
  )
}

// 소득 항목 추가 모달
function AddItemModal({
  item,
  onItemChange,
  onCancel,
  onAdd
}: {
  item: any
  onItemChange: (item: any) => void
  onCancel: () => void
  onAdd: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">새 소득 항목 추가</h3>
        
        <div className="space-y-4 mb-6">
          <input
            type="text"
            value={item.name}
            onChange={(e) => onItemChange({...item, name: e.target.value})}
            placeholder="항목명 (예: 성과급, 교통비)"
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            autoFocus
          />
          
          <select
            value={item.type}
            onChange={(e) => onItemChange({...item, type: e.target.value as 'taxable' | 'tax_exempt'})}
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="taxable">과세 소득</option>
            <option value="tax_exempt">비과세 소득</option>
          </select>

          <select
            value={item.unit}
            onChange={(e) => onItemChange({...item, unit: e.target.value as 'yearly' | 'monthly'})}
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="yearly">연 기준 입력</option>
            <option value="monthly">월 기준 입력</option>
          </select>
          
          <input
            type="text"
            value={item.category}
            onChange={(e) => onItemChange({...item, category: e.target.value})}
            placeholder="카테고리 (예: 급여, 수당, 복리후생)"
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
          />
          
          {item.type === 'tax_exempt' && (
            <input
              type="number"
              value={item.monthlyLimit}
              onChange={(e) => onItemChange({...item, monthlyLimit: e.target.value})}
              placeholder="월 한도액 (만원, 선택사항)"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium active:bg-gray-200"
          >
            취소
          </button>
          <button
            onClick={onAdd}
            disabled={!item.name.trim()}
            className="flex-1 px-4 py-3 text-white bg-gray-900 hover:bg-gray-800 rounded-xl font-medium active:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  )
}

// 기본 항목 복원 모달
function RestoreDefaultsModal({
  missingIncomeItems,
  onRestore,
  onClose
}: {
  missingIncomeItems: IncomeItem[]
  onRestore: (item: IncomeItem) => void
  onClose: () => void
}) {
  if (missingIncomeItems.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">삭제된 기본 항목 복원</h3>
        
        <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
          {missingIncomeItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.category}
                  {item.monthlyLimit && ` • 월 최대 ${Math.round(item.monthlyLimit / 10000)}만원`}
                </p>
              </div>
              <button
                onClick={() => onRestore(item)}
                className="text-gray-900 hover:text-gray-700 text-sm font-medium"
              >
                복원
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium active:bg-gray-200"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
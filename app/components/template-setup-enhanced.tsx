"use client"

import { useState } from "react"
import { Plus, ArrowLeft, Check, Trash2, RotateCcw } from "lucide-react"
import { 
  GroupIncomeData,
  IncomeItem,
  DeductionItem,
  DEFAULT_INCOME_ITEMS,
  DEFAULT_DEDUCTION_ITEMS,
  generateId
} from "@/lib/income-types-v3"

interface TemplateSetupEnhancedProps {
  group: GroupIncomeData
  onComplete: () => void
  onBack: () => void
  onUpdateGroup: (group: GroupIncomeData) => void
}

export default function TemplateSetupEnhanced({ 
  group, 
  onComplete, 
  onBack, 
  onUpdateGroup 
}: TemplateSetupEnhancedProps) {
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>(group.template.incomeItems)
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>(group.template.deductionItems)
  
  // 모달 상태
  const [showAddIncome, setShowAddIncome] = useState(false)
  const [showAddDeduction, setShowAddDeduction] = useState(false)
  const [showRestoreDefaults, setShowRestoreDefaults] = useState(false)
  
  // 새 항목 상태
  const [newIncomeItem, setNewIncomeItem] = useState({ 
    name: '', 
    type: 'taxable' as const, 
    category: '', 
    monthlyLimit: '' 
  })
  const [newDeductionItem, setNewDeductionItem] = useState({ 
    name: '', 
    category: '', 
    defaultValue: '' 
  })

  // 삭제된 기본 항목들 찾기
  const missingDefaultIncomeItems = DEFAULT_INCOME_ITEMS.filter(defaultItem => 
    !incomeItems.some(item => item.id === defaultItem.id)
  )
  const missingDefaultDeductionItems = DEFAULT_DEDUCTION_ITEMS.filter(defaultItem => 
    !deductionItems.some(item => item.id === defaultItem.id)
  )

  const addIncomeItem = () => {
    if (!newIncomeItem.name.trim()) return

    const item: IncomeItem = {
      id: generateId(),
      name: newIncomeItem.name.trim(),
      type: newIncomeItem.type,
      category: newIncomeItem.category.trim() || '기타',
      monthlyLimit: newIncomeItem.type === 'tax_exempt' && newIncomeItem.monthlyLimit 
        ? parseInt(newIncomeItem.monthlyLimit) 
        : undefined,
      description: '',
      order: Math.max(...incomeItems.map(i => i.order), 0) + 1,
      isDefault: false,
    }

    setIncomeItems([...incomeItems, item])
    setNewIncomeItem({ name: '', type: 'taxable', category: '', monthlyLimit: '' })
    setShowAddIncome(false)
  }

  const addDeductionItem = () => {
    if (!newDeductionItem.name.trim()) return

    const item: DeductionItem = {
      id: generateId(),
      name: newDeductionItem.name.trim(),
      category: newDeductionItem.category.trim() || '기타',
      description: '',
      order: Math.max(...deductionItems.map(i => i.order), 0) + 1,
      isDefault: false,
      defaultValue: newDeductionItem.defaultValue ? parseInt(newDeductionItem.defaultValue) : undefined,
    }

    setDeductionItems([...deductionItems, item])
    setNewDeductionItem({ name: '', category: '', defaultValue: '' })
    setShowAddDeduction(false)
  }

  const removeIncomeItem = (id: string) => {
    setIncomeItems(incomeItems.filter(item => item.id !== id))
  }

  const removeDeductionItem = (id: string) => {
    setDeductionItems(deductionItems.filter(item => item.id !== id))
  }

  const restoreDefaultItem = (item: IncomeItem | DeductionItem, type: 'income' | 'deduction') => {
    if (type === 'income') {
      setIncomeItems([...incomeItems, item as IncomeItem])
    } else {
      setDeductionItems([...deductionItems, item as DeductionItem])
    }
  }

  const saveTemplate = () => {
    const updatedGroup: GroupIncomeData = {
      ...group,
      template: {
        ...group.template,
        incomeItems,
        deductionItems,
        updatedAt: Date.now(),
      },
      lastUpdated: Date.now(),
    }
    onUpdateGroup(updatedGroup)
    onComplete()
  }

  return (
    <div className="max-w-lg mx-auto px-5 pb-20">
      {/* Header */}
      <div className="flex items-center pt-12 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors mr-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-light text-gray-900">{group.groupName}</h1>
          <p className="text-sm text-gray-500">원하는 소득·공제 항목을 설정하세요</p>
        </div>
      </div>

      {/* 소득 항목 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">소득 항목</h2>
          <div className="flex space-x-2">
            {missingDefaultIncomeItems.length > 0 && (
              <button
                onClick={() => setShowRestoreDefaults(true)}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                기본 항목
              </button>
            )}
            <button
              onClick={() => setShowAddIncome(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              항목 추가
            </button>
          </div>
        </div>

        {incomeItems.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-sm mb-3">소득 항목이 없습니다</p>
            <button
              onClick={() => setShowAddIncome(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              첫 번째 항목 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {incomeItems.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
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
                      {item.monthlyLimit && ` • 월 최대 ${item.monthlyLimit.toLocaleString()}원`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeIncomeItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title={item.isDefault ? "기본 항목도 삭제 가능합니다" : "항목 삭제"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 공제 항목 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">공제 항목</h2>
          <div className="flex space-x-2">
            {missingDefaultDeductionItems.length > 0 && (
              <button
                onClick={() => setShowRestoreDefaults(true)}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                기본 항목
              </button>
            )}
            <button
              onClick={() => setShowAddDeduction(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              항목 추가
            </button>
          </div>
        </div>

        {deductionItems.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-sm mb-3">공제 항목이 없습니다</p>
            <button
              onClick={() => setShowAddDeduction(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              첫 번째 항목 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {deductionItems.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      {item.isDefault && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                          기본
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {item.category}
                      {item.defaultValue && ` • 기본값 ${item.defaultValue.toLocaleString()}원`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeDeductionItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title={item.isDefault ? "기본 항목도 삭제 가능합니다" : "항목 삭제"}
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
      <div className="flex space-x-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
        >
          이전
        </button>
        <button
          onClick={saveTemplate}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
        >
          <Check className="w-5 h-5 inline mr-2" />
          설정 완료
        </button>
      </div>

      {/* 소득 항목 추가 모달 */}
      {showAddIncome && (
        <AddItemModal
          title="새 소득 항목 추가"
          type="income"
          item={newIncomeItem}
          onItemChange={setNewIncomeItem}
          onCancel={() => {
            setShowAddIncome(false)
            setNewIncomeItem({ name: '', type: 'taxable', category: '', monthlyLimit: '' })
          }}
          onAdd={addIncomeItem}
        />
      )}

      {/* 공제 항목 추가 모달 */}
      {showAddDeduction && (
        <AddDeductionModal
          item={newDeductionItem}
          onItemChange={setNewDeductionItem}
          onCancel={() => {
            setShowAddDeduction(false)
            setNewDeductionItem({ name: '', category: '', defaultValue: '' })
          }}
          onAdd={addDeductionItem}
        />
      )}

      {/* 기본 항목 복원 모달 */}
      {showRestoreDefaults && (
        <RestoreDefaultsModal
          missingIncomeItems={missingDefaultIncomeItems}
          missingDeductionItems={missingDefaultDeductionItems}
          onRestore={restoreDefaultItem}
          onClose={() => setShowRestoreDefaults(false)}
        />
      )}
    </div>
  )
}

// 소득 항목 추가 모달
function AddItemModal({
  title,
  type,
  item,
  onItemChange,
  onCancel,
  onAdd
}: {
  title: string
  type: 'income'
  item: any
  onItemChange: (item: any) => void
  onCancel: () => void
  onAdd: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        
        <div className="space-y-4 mb-6">
          <input
            type="text"
            value={item.name}
            onChange={(e) => onItemChange({...item, name: e.target.value})}
            placeholder="항목명 (예: 성과급, 교통비)"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          
          <select
            value={item.type}
            onChange={(e) => onItemChange({...item, type: e.target.value as 'taxable' | 'tax_exempt'})}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="taxable">과세 소득</option>
            <option value="tax_exempt">비과세 소득</option>
          </select>
          
          <input
            type="text"
            value={item.category}
            onChange={(e) => onItemChange({...item, category: e.target.value})}
            placeholder="카테고리 (예: 급여, 수당, 복리후생)"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {item.type === 'tax_exempt' && (
            <input
              type="number"
              value={item.monthlyLimit}
              onChange={(e) => onItemChange({...item, monthlyLimit: e.target.value})}
              placeholder="월 한도액 (원, 선택사항)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={onAdd}
            disabled={!item.name.trim()}
            className="flex-1 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  )
}

// 공제 항목 추가 모달
function AddDeductionModal({
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">새 공제 항목 추가</h3>
        
        <div className="space-y-4 mb-6">
          <input
            type="text"
            value={item.name}
            onChange={(e) => onItemChange({...item, name: e.target.value})}
            placeholder="항목명 (예: 신용카드공제, 의료비공제)"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          
          <input
            type="text"
            value={item.category}
            onChange={(e) => onItemChange({...item, category: e.target.value})}
            placeholder="카테고리 (예: 인적공제, 특별공제, 기타공제)"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <input
            type="number"
            value={item.defaultValue}
            onChange={(e) => onItemChange({...item, defaultValue: e.target.value})}
            placeholder="기본값 (원, 선택사항)"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={onAdd}
            disabled={!item.name.trim()}
            className="flex-1 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors"
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
  missingDeductionItems,
  onRestore,
  onClose
}: {
  missingIncomeItems: IncomeItem[]
  missingDeductionItems: DeductionItem[]
  onRestore: (item: IncomeItem | DeductionItem, type: 'income' | 'deduction') => void
  onClose: () => void
}) {
  const hasItems = missingIncomeItems.length > 0 || missingDeductionItems.length > 0

  if (!hasItems) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">삭제된 기본 항목 복원</h3>
        
        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
          {missingIncomeItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">소득 항목</h4>
              <div className="space-y-2">
                {missingIncomeItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <button
                      onClick={() => onRestore(item, 'income')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      복원
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missingDeductionItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">공제 항목</h4>
              <div className="space-y-2">
                {missingDeductionItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.category}
                        {item.defaultValue && ` • 기본값 ${item.defaultValue.toLocaleString()}원`}
                      </p>
                    </div>
                    <button
                      onClick={() => onRestore(item, 'deduction')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      복원
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
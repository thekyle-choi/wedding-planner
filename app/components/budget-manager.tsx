"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, X } from "lucide-react"

interface BudgetGroup {
  id: string
  name: string
  budget?: number
  categories: BudgetCategory[]
}

interface BudgetCategory {
  id: string
  name: string
  items: BudgetItem[]
  groupId: string
}

interface BudgetItem {
  id: string
  name: string
  amount: number
  paid: boolean
}

interface BudgetManagerProps {
  groups: BudgetGroup[]
  setGroups: (groups: BudgetGroup[]) => void
  eventType: string
}

export default function BudgetManager({ groups = [], setGroups, eventType }: BudgetManagerProps) {
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupBudget, setNewGroupBudget] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [newItemName, setNewItemName] = useState("")
  const [newItemAmount, setNewItemAmount] = useState("")

  // Inline editing states
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editedGroupName, setEditedGroupName] = useState("")
  const [editedGroupBudget, setEditedGroupBudget] = useState("")
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editedCategoryName, setEditedCategoryName] = useState("")
  // Quick add category per group
  const [quickCategoryNameByGroup, setQuickCategoryNameByGroup] = useState<Record<string, string>>({})
  const setQuickCategoryName = (groupId: string, name: string) =>
    setQuickCategoryNameByGroup((prev) => ({ ...prev, [groupId]: name }))

  const addGroup = () => {
    if (newGroupName) {
      const newGroup: BudgetGroup = {
        id: Date.now().toString(),
        name: newGroupName,
        budget: newGroupBudget ? Number.parseInt(newGroupBudget) : 0,
        categories: [],
      }
      setGroups([...groups, newGroup])
      setNewGroupName("")
      setNewGroupBudget("")
      setShowAddGroup(false)
    }
  }

  const addCategory = () => {
    if (newCategoryName && selectedGroupId) {
      const newCategory: BudgetCategory = {
        id: Date.now().toString(),
        name: newCategoryName,
        items: [],
        groupId: selectedGroupId,
      }

      setGroups(
        groups.map((group) =>
          group.id === selectedGroupId ? { ...group, categories: [...(group.categories || []), newCategory] } : group,
        ),
      )
      setNewCategoryName("")
      setSelectedGroupId("")
      setShowAddCategory(false)
    }
  }

  const deleteGroup = (groupId: string) => {
    setGroups(groups.filter((group) => group.id !== groupId))
  }

  const deleteCategory = (groupId: string, categoryId: string) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId
          ? { ...group, categories: (group.categories || []).filter((cat) => cat.id !== categoryId) }
          : group,
      ),
    )
  }

  const addItem = (groupId: string, categoryId: string) => {
    if (newItemName && newItemAmount) {
      const newItem: BudgetItem = {
        id: Date.now().toString(),
        name: newItemName,
        amount: Number.parseInt(newItemAmount),
        paid: false,
      }

      setGroups(
        groups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                categories: (group.categories || []).map((cat) =>
                  cat.id === categoryId ? { ...cat, items: [...(cat.items || []), newItem] } : cat,
                ),
              }
            : group,
        ),
      )
      setNewItemName("")
      setNewItemAmount("")
    }
  }

  const toggleItemPaid = (groupId: string, categoryId: string, itemId: string) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              categories: (group.categories || []).map((cat) =>
                cat.id === categoryId
                  ? {
                      ...cat,
                      items: (cat.items || []).map((item) =>
                        item.id === itemId ? { ...item, paid: !item.paid } : item,
                      ),
                    }
                  : cat,
              ),
            }
          : group,
      ),
    )
  }

  const deleteItem = (groupId: string, categoryId: string, itemId: string) => {
    setGroups(
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              categories: (group.categories || []).map((cat) =>
                cat.id === categoryId ? { ...cat, items: (cat.items || []).filter((item) => item.id !== itemId) } : cat,
              ),
            }
          : group,
      ),
    )
  }

  const getGroupSpent = (group: BudgetGroup) => {
    return (group.categories || []).reduce(
      (sum, category) =>
        sum + (category.items || []).reduce((itemSum, item) => itemSum + (item.paid ? item.amount || 0 : 0), 0),
      0,
    )
  }

  const getGroupBudget = (group: BudgetGroup) => {
    // Prefer group-level budget; fallback to legacy sum of category budgets if present
    if (typeof group.budget === "number") return group.budget
    return (group.categories || []).reduce((sum, category: any) => sum + (category?.budget || 0), 0)
  }

  const getCategorySpent = (category: BudgetCategory) => {
    return (category.items || []).reduce((sum, item) => sum + (item.paid ? item.amount || 0 : 0), 0)
  }

  const getCategoryTotal = (category: BudgetCategory) => {
    return (category.items || []).reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  const startEditGroup = (group: BudgetGroup) => {
    setEditingGroupId(group.id)
    setEditedGroupName(group.name)
    setEditedGroupBudget(String(group.budget ?? getGroupBudget(group)))
  }

  const cancelEditGroup = () => {
    setEditingGroupId(null)
    setEditedGroupName("")
    setEditedGroupBudget("")
  }

  const saveEditGroup = (groupId: string) => {
    const next = groups.map((g) =>
      g.id === groupId
        ? { ...g, name: editedGroupName.trim() || g.name, budget: Number.parseInt(editedGroupBudget || "0") }
        : g,
    )
    setGroups(next)
    cancelEditGroup()
  }

  const startEditCategory = (category: BudgetCategory) => {
    setEditingCategoryId(category.id)
    setEditedCategoryName(category.name)
  }

  const cancelEditCategory = () => {
    setEditingCategoryId(null)
    setEditedCategoryName("")
  }

  const saveEditCategory = (groupId: string, categoryId: string) => {
    const next = groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            categories: (group.categories || []).map((cat) =>
              cat.id === categoryId ? { ...cat, name: editedCategoryName.trim() || cat.name } : cat,
            ),
          }
        : group,
    )
    setGroups(next)
    cancelEditCategory()
  }

  const addCategoryInline = (groupId: string) => {
    const name = (quickCategoryNameByGroup[groupId] || "").trim()
    if (!name) return
    const newCategory: BudgetCategory = {
      id: Date.now().toString(),
      name,
      items: [],
      groupId,
    }
    setGroups(
      groups.map((group) =>
        group.id === groupId ? { ...group, categories: [...(group.categories || []), newCategory] } : group,
      ),
    )
    setQuickCategoryName(groupId, "")
  }

  const toggleGroupExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleCategoryExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-lg mx-auto px-5">
        {/* Mobile Header */}
        <div className="pt-12 mb-6">
          <h1 className="text-3xl font-light text-gray-900 mb-1">예산 관리</h1>
          <p className="text-sm text-gray-500">그룹별 예산 추적</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6 mt-1">
          <button
            onClick={() => setShowAddGroup(!showAddGroup)}
            className={`flex-1 pt-3.5 pb-3 px-4 rounded-xl text-sm font-medium transition-colors ${
              showAddGroup ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 active:bg-gray-200"
            }`}
          >
            그룹 추가
          </button>
          <button
            onClick={() => setShowAddCategory(!showAddCategory)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
              showAddCategory ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 active:bg-gray-200"
            }`}
          >
            카테고리 추가
          </button>
        </div>

        {/* Add Group Form */}
        {showAddGroup && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="space-y-3">
              <input
                placeholder="그룹 이름 (예: 핵심 비용)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              />
              <input
                type="number"
                placeholder="그룹 예산 (원)"
                value={newGroupBudget}
                onChange={(e) => setNewGroupBudget(e.target.value)}
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <button
              onClick={addGroup}
              className="w-full mt-3 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium active:bg-gray-800"
            >
              그룹 추가
            </button>
          </div>
        )}

        {/* Add Category Form */}
        {showAddCategory && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="w-full h-12 bg-white border-gray-200 rounded-xl">
                <SelectValue placeholder="그룹을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              placeholder="카테고리 이름 (예: 본식 예약금)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
            <button
              onClick={addCategory}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium active:bg-gray-800"
            >
              카테고리 추가
            </button>
          </div>
        )}

        {/* Budget Groups */}
        <div className="space-y-3">
          {groups.map((group) => {
            const groupBudget = getGroupBudget(group)
            const groupSpent = getGroupSpent(group)
            const groupRemaining = groupBudget - groupSpent
            const isGroupExpanded = expandedGroups.has(group.id)

            return (
              <div key={group.id} className="bg-gray-50 rounded-2xl overflow-hidden">
                <div className="p-4 cursor-pointer" onClick={() => toggleGroupExpanded(group.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isGroupExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            value={editedGroupName}
                            onChange={(e) => setEditedGroupName(e.target.value)}
                            className="px-2 py-1 rounded-lg border border-gray-200 text-sm bg-white"
                          />
                          <input
                            type="number"
                            value={editedGroupBudget}
                            onChange={(e) => setEditedGroupBudget(e.target.value)}
                            className="w-28 px-2 py-1 rounded-lg border border-gray-200 text-sm bg-white"
                          />
                        </div>
                      ) : (
                        <h3 className="text-base font-medium text-gray-900">{group.name}</h3>
                      )}
                      <span className="text-xs text-gray-500">{(group.categories || []).length}개</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (editingGroupId === group.id) {
                          cancelEditGroup()
                        } else {
                          deleteGroup(group.id)
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => saveEditGroup(group.id)}
                            className="p-1 rounded-md bg-gray-900 text-white"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEditGroup} className="p-1 rounded-md bg-gray-200">
                            <X className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditGroup(group)
                          }}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <div className="ml-auto flex items-center gap-4">
                        <span className="text-gray-600">예산 {groupBudget.toLocaleString()}원</span>
                        <span className="text-gray-900 font-medium">{groupSpent.toLocaleString()}원 사용</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-gray-900 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${groupBudget > 0 ? Math.min((groupSpent / groupBudget) * 100, 100) : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        남은 예산: {groupRemaining.toLocaleString()}원
                      </span>
                      <span className="text-xs text-gray-600">
                        {groupBudget > 0 ? ((groupSpent / groupBudget) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {isGroupExpanded && (
                  <div className="px-4 pb-4">
                    {/* Quick Add Category */}
                    <div className="flex gap-2 mb-3">
                      <input
                        placeholder="카테고리 이름 추가"
                        value={quickCategoryNameByGroup[group.id] || ""}
                        onChange={(e) => setQuickCategoryName(group.id, e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 bg-white rounded-lg text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
                      />
                      <button
                        onClick={() => addCategoryInline(group.id)}
                        disabled={!((quickCategoryNameByGroup[group.id] || "").trim())}
                        className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(group.categories || []).map((category) => {
                        const categorySpent = getCategorySpent(category)
                        const categoryTotal = getCategoryTotal(category)
                        const isCategoryExpanded = expandedCategories.has(category.id)

                        return (
                          <div key={category.id} className="bg-white rounded-xl p-3">
                            <div
                              className="cursor-pointer"
                              onClick={() => toggleCategoryExpanded(category.id)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {isCategoryExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                  )}
                                  {editingCategoryId === category.id ? (
                                    <input
                                      value={editedCategoryName}
                                      onChange={(e) => setEditedCategoryName(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white"
                                    />
                                  ) : (
                                    <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                                  )}
                                </div>
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  {editingCategoryId === category.id ? (
                                    <>
                                      <button
                                        onClick={() => saveEditCategory(group.id, category.id)}
                                        className="p-0.5 rounded-md bg-gray-900 text-white"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button onClick={cancelEditCategory} className="p-0.5 rounded-md bg-gray-200">
                                        <X className="w-3 h-3 text-gray-700" />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => startEditCategory(category)}
                                      className="text-gray-400 hover:text-gray-600 p-0.5"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteCategory(group.id, category.id)}
                                    className="text-gray-400 hover:text-red-600 p-0.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">합계 {categoryTotal.toLocaleString()}원</span>
                                  <span className="text-gray-700">결제됨 {categorySpent.toLocaleString()}원</span>
                                </div>
                              </div>
                            </div>

                            {isCategoryExpanded && (
                              <div className="mt-3 space-y-2">
                                {/* Add Item Form */}
                                <div className="flex flex-wrap gap-2">
                                  <input
                                    placeholder="항목명"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="flex-1 min-w-0 px-3 py-2 bg-gray-50 rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300"
                                  />
                                  <input
                                    type="number"
                                    placeholder="금액"
                                    value={newItemAmount}
                                    onChange={(e) => setNewItemAmount(e.target.value)}
                                    className="w-24 px-3 py-2 bg-gray-50 rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300"
                                  />
                                  <button
                                    onClick={() => addItem(group.id, category.id)}
                                    disabled={!newItemName || !newItemAmount}
                                    className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs disabled:opacity-50"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Items */}
                                <div className="space-y-1.5">
                                  {(category.items || []).map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 py-1.5">
                                      <Checkbox
                                        checked={item.paid}
                                        onCheckedChange={() => toggleItemPaid(group.id, category.id, item.id)}
                                        className="w-4 h-4"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs ${item.paid ? "line-through text-gray-400" : "text-gray-900"}`}>
                                          {item.name}
                                        </p>
                                      </div>
                                      <p className={`text-xs ${item.paid ? "text-gray-400" : "text-gray-600"}`}>
                                        {(item.amount || 0).toLocaleString()}원
                                      </p>
                                      <button
                                        onClick={() => deleteItem(group.id, category.id, item.id)}
                                        className="text-gray-400 hover:text-red-600 p-0.5"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                  {(category.items || []).length === 0 && (
                                    <p className="text-gray-400 text-center py-3 text-xs">항목을 추가해보세요</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {(group.categories || []).length === 0 && (
                        <p className="text-gray-400 text-center py-6 text-sm">카테고리를 추가해보세요</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">예산 그룹을 만들어보세요</p>
            <p className="text-sm text-gray-400">그룹으로 예산을 체계적으로 관리할 수 있어요</p>
          </div>
        )}
      </div>
    </div>
  )
}

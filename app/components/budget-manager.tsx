"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, FolderPlus, ChevronDown, ChevronRight } from "lucide-react"

interface BudgetGroup {
  id: string
  name: string
  categories: BudgetCategory[]
}

interface BudgetCategory {
  id: string
  name: string
  budget: number
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
  onBack: () => void
}

export default function BudgetManager({ groups = [], setGroups, eventType, onBack }: BudgetManagerProps) {
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryBudget, setNewCategoryBudget] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [newItemName, setNewItemName] = useState("")
  const [newItemAmount, setNewItemAmount] = useState("")

  const addGroup = () => {
    if (newGroupName) {
      const newGroup: BudgetGroup = {
        id: Date.now().toString(),
        name: newGroupName,
        categories: [],
      }
      setGroups([...groups, newGroup])
      setNewGroupName("")
      setShowAddGroup(false)
    }
  }

  const addCategory = () => {
    if (newCategoryName && newCategoryBudget && selectedGroupId) {
      const newCategory: BudgetCategory = {
        id: Date.now().toString(),
        name: newCategoryName,
        budget: Number.parseInt(newCategoryBudget),
        items: [],
        groupId: selectedGroupId,
      }

      setGroups(
        groups.map((group) =>
          group.id === selectedGroupId ? { ...group, categories: [...(group.categories || []), newCategory] } : group,
        ),
      )
      setNewCategoryName("")
      setNewCategoryBudget("")
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
    return (group.categories || []).reduce((sum, category) => sum + (category.budget || 0), 0)
  }

  const getCategorySpent = (category: BudgetCategory) => {
    return (category.items || []).reduce((sum, item) => sum + (item.paid ? item.amount || 0 : 0), 0)
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto p-4">
        {/* Mobile Header */}
        <div className="flex items-center gap-4 mb-6 pt-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-light text-gray-900">예산 관리</h1>
            <p className="text-sm text-gray-600">그룹별 예산 추적</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            onClick={() => setShowAddGroup(!showAddGroup)}
            variant={showAddGroup ? "secondary" : "default"}
            className="h-12 text-sm"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            그룹 추가
          </Button>
          <Button
            onClick={() => setShowAddCategory(!showAddCategory)}
            variant={showAddCategory ? "secondary" : "outline"}
            className="h-12 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            카테고리 추가
          </Button>
        </div>

        {/* Add Group Form */}
        {showAddGroup && (
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="groupName" className="text-sm font-medium">
                  그룹 이름
                </Label>
                <Input
                  id="groupName"
                  placeholder="예: 핵심 비용"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="mt-1 h-12"
                />
              </div>
              <Button onClick={addGroup} className="w-full h-12">
                그룹 추가
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Category Form */}
        {showAddCategory && (
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="groupSelect" className="text-sm font-medium">
                  그룹 선택
                </Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger className="mt-1 h-12">
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
              </div>
              <div>
                <Label htmlFor="categoryName" className="text-sm font-medium">
                  카테고리 이름
                </Label>
                <Input
                  id="categoryName"
                  placeholder="예: 본식 예약금"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="mt-1 h-12"
                />
              </div>
              <div>
                <Label htmlFor="categoryBudget" className="text-sm font-medium">
                  예산 (원)
                </Label>
                <Input
                  id="categoryBudget"
                  type="number"
                  placeholder="1000000"
                  value={newCategoryBudget}
                  onChange={(e) => setNewCategoryBudget(e.target.value)}
                  className="mt-1 h-12"
                />
              </div>
              <Button onClick={addCategory} className="w-full h-12">
                카테고리 추가
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Budget Groups */}
        <div className="space-y-4">
          {groups.map((group) => {
            const groupBudget = getGroupBudget(group)
            const groupSpent = getGroupSpent(group)
            const groupRemaining = groupBudget - groupSpent
            const isGroupExpanded = expandedGroups.has(group.id)

            return (
              <Card key={group.id} className="border-0 shadow-sm">
                <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleGroupExpanded(group.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isGroupExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <CardTitle className="text-lg font-medium">{group.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {(group.categories || []).length}개
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteGroup(group.id)
                      }}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">그룹 예산: {groupBudget.toLocaleString()}원</span>
                      <span className="text-gray-600">사용: {groupSpent.toLocaleString()}원</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${groupBudget > 0 ? Math.min((groupSpent / groupBudget) * 100, 100) : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-sm font-medium ${groupRemaining >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        남은 예산: {groupRemaining.toLocaleString()}원
                      </span>
                      <Badge variant={groupRemaining >= 0 ? "default" : "destructive"} className="text-xs">
                        {groupBudget > 0 ? ((groupSpent / groupBudget) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {isGroupExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {(group.categories || []).map((category) => {
                        const categorySpent = getCategorySpent(category)
                        const categoryRemaining = category.budget - categorySpent
                        const isCategoryExpanded = expandedCategories.has(category.id)

                        return (
                          <Card key={category.id} className="border border-gray-200">
                            <CardHeader
                              className="pb-2 cursor-pointer"
                              onClick={() => toggleCategoryExpanded(category.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isCategoryExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                  )}
                                  <h4 className="font-medium text-sm">{category.name}</h4>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteCategory(group.id, category.id)
                                  }}
                                  className="text-red-600 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">{category.budget.toLocaleString()}원</span>
                                  <span className="text-gray-600">사용: {categorySpent.toLocaleString()}원</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div
                                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-1 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((categorySpent / category.budget) * 100, 100)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span
                                    className={`text-xs ${categoryRemaining >= 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {categoryRemaining.toLocaleString()}원
                                  </span>
                                  <Badge variant="outline" className="text-xs h-4">
                                    {((categorySpent / category.budget) * 100).toFixed(0)}%
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>

                            {isCategoryExpanded && (
                              <CardContent className="pt-0">
                                {/* Add Item Form */}
                                <div className="mb-3 p-2 bg-gray-50 rounded space-y-2">
                                  <Input
                                    placeholder="항목명"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      placeholder="금액"
                                      value={newItemAmount}
                                      onChange={(e) => setNewItemAmount(e.target.value)}
                                      className="flex-1 h-8 text-sm"
                                    />
                                    <Button
                                      onClick={() => addItem(group.id, category.id)}
                                      disabled={!newItemName || !newItemAmount}
                                      size="sm"
                                      className="px-3"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Items */}
                                <div className="space-y-2">
                                  {(category.items || []).map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 p-2 border rounded text-sm">
                                      <Checkbox
                                        checked={item.paid}
                                        onCheckedChange={() => toggleItemPaid(group.id, category.id, item.id)}
                                        className="flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={`font-medium text-xs ${item.paid ? "line-through text-gray-500" : "text-gray-900"}`}
                                        >
                                          {item.name}
                                        </p>
                                        <p className="text-xs text-gray-600">{(item.amount || 0).toLocaleString()}원</p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteItem(group.id, category.id, item.id)}
                                        className="text-red-600 hover:text-red-700 p-1 flex-shrink-0"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                  {(category.items || []).length === 0 && (
                                    <p className="text-gray-500 text-center py-4 text-xs">아직 항목이 없습니다</p>
                                  )}
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        )
                      })}

                      {(group.categories || []).length === 0 && (
                        <p className="text-gray-500 text-center py-6 text-sm">아직 카테고리가 없습니다</p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        {groups.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-2">아직 예산 그룹이 없습니다</p>
              <p className="text-sm text-gray-400">위에서 그룹을 추가해보세요</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

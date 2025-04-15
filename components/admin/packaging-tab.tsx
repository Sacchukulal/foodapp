"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash, Save, Package, Percent, DollarSign } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { getMenuItems, getMenuItemsByCategory } from "@/lib/services/menuService"
import {
  getPackagingCharges,
  addPackagingCharge,
  updatePackagingCharge,
  deletePackagingCharge,
  applyPackagingChargeToMenuItem,
  applyBulkPackagingCharges,
} from "@/lib/services/packagingService"
import type { MenuItem, PackagingCharge } from "@/lib/models"

export function PackagingTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [packagingCharges, setPackagingCharges] = useState<PackagingCharge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkPackagingCharge, setBulkPackagingCharge] = useState(0)

  // For individual item editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingPackagingCharge, setEditingPackagingCharge] = useState(0)

  // For rule-based packaging charges
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false)
  const [isEditRuleDialogOpen, setIsEditRuleDialogOpen] = useState(false)
  const [currentRule, setCurrentRule] = useState<Partial<PackagingCharge>>({
    name: "",
    applicableType: "all",
    applicableTo: "all",
    chargeType: "fixed",
    chargeValue: 0,
    active: true,
  })
  const [viewMode, setViewMode] = useState<"items" | "rules">("items")

  // Categories for filtering
  const categories = [
    { id: "all", name: "All Categories" },
    { id: "starters", name: "Starters" },
    { id: "main", name: "Main Course" },
    { id: "desserts", name: "Desserts" },
    { id: "beverages", name: "Beverages" },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch menu items based on category filter
        let items: MenuItem[]
        if (categoryFilter === "all") {
          items = await getMenuItems()
        } else {
          items = await getMenuItemsByCategory(categoryFilter)
        }

        // Fetch packaging charges
        const charges = await getPackagingCharges()

        setMenuItems(items)
        setPackagingCharges(charges)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categoryFilter])

  const filteredItems = menuItems.filter((item) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    }
    return true
  })

  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId))
    } else {
      setSelectedItems([...selectedItems, itemId])
    }
  }

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredItems.map((item) => item.id!))
    }
  }

  const handleApplyBulkPackagingCharge = async () => {
    try {
      await applyBulkPackagingCharges(selectedItems, bulkPackagingCharge)

      // Update local state
      setMenuItems(
        menuItems.map((item) =>
          selectedItems.includes(item.id!) ? { ...item, packagingCharge: bulkPackagingCharge } : item,
        ),
      )

      setBulkEditMode(false)
      setSelectedItems([])
      setBulkPackagingCharge(0)
    } catch (error) {
      console.error("Error applying bulk packaging charges:", error)
      setError("Failed to apply packaging charges. Please try again.")
    }
  }

  const handleEditItemPackagingCharge = (item: MenuItem) => {
    setEditingItemId(item.id!)
    setEditingPackagingCharge(item.packagingCharge || 0)
  }

  const handleSaveItemPackagingCharge = async () => {
    if (!editingItemId) return

    try {
      await applyPackagingChargeToMenuItem(editingItemId, editingPackagingCharge)

      // Update local state
      setMenuItems(
        menuItems.map((item) =>
          item.id === editingItemId ? { ...item, packagingCharge: editingPackagingCharge } : item,
        ),
      )

      setEditingItemId(null)
    } catch (error) {
      console.error("Error updating packaging charge:", error)
      setError("Failed to update packaging charge. Please try again.")
    }
  }

  const handleAddRule = async () => {
    try {
      if (!validateRuleForm()) {
        return
      }

      const newRule = { ...currentRule } as Omit<PackagingCharge, "id" | "createdAt">
      const ruleId = await addPackagingCharge(newRule)

      // Add to local state with the new ID
      const ruleWithId = {
        ...newRule,
        id: ruleId,
        createdAt: new Date(),
      }

      setPackagingCharges([ruleWithId, ...packagingCharges])

      // Refresh menu items to reflect the new packaging charges
      const updatedItems = await getMenuItems()
      setMenuItems(updatedItems)

      resetRuleForm()
      setIsAddRuleDialogOpen(false)
    } catch (error) {
      console.error("Error adding packaging rule:", error)
      setError("Failed to add packaging rule. Please try again.")
    }
  }

  const handleEditRule = (rule: PackagingCharge) => {
    setCurrentRule({
      ...rule,
    })
    setIsEditRuleDialogOpen(true)
  }

  const handleUpdateRule = async () => {
    try {
      if (!validateRuleForm() || !currentRule.id) {
        return
      }

      await updatePackagingCharge(currentRule.id, currentRule)

      // Update local state
      setPackagingCharges(
        packagingCharges.map((rule) => (rule.id === currentRule.id ? { ...rule, ...currentRule } : rule)),
      )

      // Refresh menu items to reflect the updated packaging charges
      const updatedItems = await getMenuItems()
      setMenuItems(updatedItems)

      resetRuleForm()
      setIsEditRuleDialogOpen(false)
    } catch (error) {
      console.error("Error updating packaging rule:", error)
      setError("Failed to update packaging rule. Please try again.")
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (confirm("Are you sure you want to delete this packaging rule?")) {
      try {
        await deletePackagingCharge(id)

        // Update local state
        setPackagingCharges(packagingCharges.filter((rule) => rule.id !== id))

        // Refresh menu items to reflect the removed packaging charges
        const updatedItems = await getMenuItems()
        setMenuItems(updatedItems)
      } catch (error) {
        console.error("Error deleting packaging rule:", error)
        setError("Failed to delete packaging rule. Please try again.")
      }
    }
  }

  const resetRuleForm = () => {
    setCurrentRule({
      name: "",
      applicableType: "all",
      applicableTo: "all",
      chargeType: "fixed",
      chargeValue: 0,
      active: true,
    })
  }

  const validateRuleForm = () => {
    if (!currentRule.name) {
      alert("Please enter a rule name")
      return false
    }

    if (currentRule.chargeValue < 0) {
      alert("Charge value cannot be negative")
      return false
    }

    if (currentRule.chargeType === "percentage" && currentRule.chargeValue > 100) {
      alert("Percentage charge cannot exceed 100%")
      return false
    }

    return true
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Packaging Charges</h1>
          <p className="text-gray-500">Apply packaging charges to menu items</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "items" | "rules")}>
            <TabsList>
              <TabsTrigger value="items">Menu Items</TabsTrigger>
              <TabsTrigger value="rules">Packaging Rules</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

      {viewMode === "items" ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={categoryFilter === category.id ? "default" : "outline"}
                  onClick={() => setCategoryFilter(category.id)}
                  className="whitespace-nowrap"
                >
                  {category.name}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              {bulkEditMode ? (
                <>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="bulk-charge" className="whitespace-nowrap">
                      Packaging Charge (₹)
                    </Label>
                    <Input
                      id="bulk-charge"
                      type="number"
                      className="w-20"
                      value={bulkPackagingCharge}
                      onChange={(e) => setBulkPackagingCharge(Number(e.target.value))}
                    />
                  </div>
                  <Button onClick={handleApplyBulkPackagingCharge} disabled={selectedItems.length === 0}>
                    Apply to {selectedItems.length} items
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBulkEditMode(false)
                      setSelectedItems([])
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setBulkEditMode(true)}>
                  <Package className="mr-2 h-4 w-4" /> Bulk Edit
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search menu items..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-8">
                  <p>Loading menu items...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {bulkEditMode && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Packaging Charge</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        {bulkEditMode && (
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.includes(item.id!)}
                              onCheckedChange={() => handleSelectItem(item.id!)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-10 h-10 rounded-md object-cover"
                            />
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>₹{item.price}</TableCell>
                        <TableCell>
                          {editingItemId === item.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                className="w-20"
                                value={editingPackagingCharge}
                                onChange={(e) => setEditingPackagingCharge(Number(e.target.value))}
                              />
                              <Button size="sm" variant="ghost" onClick={handleSaveItemPackagingCharge}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingItemId(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              {item.packagingCharge ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                  ₹{item.packagingCharge}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">
                                  No charge
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!bulkEditMode && (
                            <Button variant="ghost" size="sm" onClick={() => handleEditItemPackagingCharge(item)}>
                              Edit Charge
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={bulkEditMode ? 6 : 5} className="text-center py-8 text-gray-500">
                          No menu items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        // Rules View
        <>
          <div className="flex justify-between items-center">
            <Button onClick={() => setIsAddRuleDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Packaging Rule
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-8">
                  <p>Loading packaging rules...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Applies To</TableHead>
                      <TableHead>Charge</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packagingCharges.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          {rule.applicableType === "all" ? (
                            <Badge variant="outline">All Items</Badge>
                          ) : rule.applicableType === "category" ? (
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(rule.applicableTo) ? (
                                rule.applicableTo.map((category, index) => (
                                  <Badge key={index} variant="outline">
                                    {category}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline">All Categories</Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline">
                              {Array.isArray(rule.applicableTo) ? `${rule.applicableTo.length} items` : "All Items"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {rule.chargeType === "fixed" ? (
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              <span>₹{rule.chargeValue}</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Percent className="h-3 w-3 mr-1" />
                              <span>{rule.chargeValue}% of item price</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={rule.active ? "bg-green-500" : "bg-gray-500"}>
                            {rule.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditRule(rule)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteRule(rule.id!)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {packagingCharges.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No packaging rules found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Add Rule Dialog */}
          <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Packaging Rule</DialogTitle>
                <DialogDescription>Create a new rule for applying packaging charges</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="Standard Packaging"
                    value={currentRule.name}
                    onChange={(e) => setCurrentRule({ ...currentRule, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicable-type">Applies To</Label>
                  <Select
                    value={currentRule.applicableType}
                    onValueChange={(value) =>
                      setCurrentRule({
                        ...currentRule,
                        applicableType: value as "all" | "category" | "item",
                        applicableTo: "all",
                      })
                    }
                  >
                    <SelectTrigger id="applicable-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="category">Specific Categories</SelectItem>
                      <SelectItem value="item">Specific Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {currentRule.applicableType === "category" && (
                  <div className="space-y-2">
                    <Label htmlFor="applicable-categories">Select Categories</Label>
                    <Select
                      value={Array.isArray(currentRule.applicableTo) ? currentRule.applicableTo[0] : "all"}
                      onValueChange={(value) => setCurrentRule({ ...currentRule, applicableTo: [value] })}
                    >
                      <SelectTrigger id="applicable-categories">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => c.id !== "all")
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="charge-type">Charge Type</Label>
                    <Select
                      value={currentRule.chargeType}
                      onValueChange={(value) =>
                        setCurrentRule({ ...currentRule, chargeType: value as "fixed" | "percentage" })
                      }
                    >
                      <SelectTrigger id="charge-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="charge-value">
                      {currentRule.chargeType === "fixed" ? "Amount (₹)" : "Percentage (%)"}
                    </Label>
                    <Input
                      id="charge-value"
                      type="number"
                      placeholder={currentRule.chargeType === "fixed" ? "20" : "5"}
                      value={currentRule.chargeValue}
                      onChange={(e) => setCurrentRule({ ...currentRule, chargeValue: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="rule-active"
                    checked={currentRule.active}
                    onCheckedChange={(checked) => setCurrentRule({ ...currentRule, active: checked })}
                  />
                  <Label htmlFor="rule-active">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddRuleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRule}>
                  <Plus className="mr-2 h-4 w-4" /> Add Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Rule Dialog */}
          <Dialog open={isEditRuleDialogOpen} onOpenChange={setIsEditRuleDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Packaging Rule</DialogTitle>
                <DialogDescription>Update the packaging charge rule</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-rule-name">Rule Name</Label>
                  <Input
                    id="edit-rule-name"
                    value={currentRule.name}
                    onChange={(e) => setCurrentRule({ ...currentRule, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-applicable-type">Applies To</Label>
                  <Select
                    value={currentRule.applicableType}
                    onValueChange={(value) =>
                      setCurrentRule({
                        ...currentRule,
                        applicableType: value as "all" | "category" | "item",
                        applicableTo: "all",
                      })
                    }
                  >
                    <SelectTrigger id="edit-applicable-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="category">Specific Categories</SelectItem>
                      <SelectItem value="item">Specific Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {currentRule.applicableType === "category" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-applicable-categories">Select Categories</Label>
                    <Select
                      value={Array.isArray(currentRule.applicableTo) ? currentRule.applicableTo[0] : "all"}
                      onValueChange={(value) => setCurrentRule({ ...currentRule, applicableTo: [value] })}
                    >
                      <SelectTrigger id="edit-applicable-categories">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => c.id !== "all")
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-charge-type">Charge Type</Label>
                    <Select
                      value={currentRule.chargeType}
                      onValueChange={(value) =>
                        setCurrentRule({ ...currentRule, chargeType: value as "fixed" | "percentage" })
                      }
                    >
                      <SelectTrigger id="edit-charge-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-charge-value">
                      {currentRule.chargeType === "fixed" ? "Amount (₹)" : "Percentage (%)"}
                    </Label>
                    <Input
                      id="edit-charge-value"
                      type="number"
                      value={currentRule.chargeValue}
                      onChange={(e) => setCurrentRule({ ...currentRule, chargeValue: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-rule-active"
                    checked={currentRule.active}
                    onCheckedChange={(checked) => setCurrentRule({ ...currentRule, active: checked })}
                  />
                  <Label htmlFor="edit-rule-active">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditRuleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRule}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}

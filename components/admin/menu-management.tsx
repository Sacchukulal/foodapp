"use client"

import { useState, useEffect } from "react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash, Search, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { SupabaseConnectionTest } from "@/components/supabase-connection-test"

// Define the MenuItem type based on our database schema
interface MenuItem {
  id?: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  veg: boolean
  available: boolean
  rating?: number
  order_count?: number
  packaging_charge?: number
}

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null)
  const [newItem, setNewItem] = useState<MenuItem>({
    name: "",
    description: "",
    price: 0,
    image_url: "/placeholder.svg?height=100&width=100&text=Food",
    category: "starters",
    veg: true,
    available: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [showConnectionTest, setShowConnectionTest] = useState(false)

  // Categories for filtering
  const categories = [
    { id: "all", name: "All Categories" },
    { id: "starters", name: "Starters" },
    { id: "main", name: "Main Course" },
    { id: "desserts", name: "Desserts" },
    { id: "beverages", name: "Beverages" },
  ]

  // Fetch menu items on component mount
  useEffect(() => {
    fetchMenuItems()
  }, [categoryFilter])

  // Function to fetch menu items from the database
  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setError("Supabase is not properly configured. Check your environment variables.")
        setMenuItems([])
        return
      }

      let query = supabase.from("menu_items").select("*")

      // Apply category filter if not "all"
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter)
      }

      const { data, error: fetchError } = await query.order("created_at", { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      console.log("Fetched menu items:", data)
      setMenuItems(data || [])
    } catch (error) {
      console.error("Error fetching menu items:", error)
      setError(`Failed to fetch menu items: ${error.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to fetch menu items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to add a new menu item
  const handleAddItem = async () => {
    try {
      if (!newItem.name || !newItem.description || newItem.price <= 0) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setError("Supabase is not properly configured. Check your environment variables.")
        return
      }

      console.log("Adding new item:", newItem)
      const { data, error: insertError } = await supabase.from("menu_items").insert([newItem]).select()

      if (insertError) {
        throw insertError
      }

      console.log("Added item response:", data)

      if (data && data.length > 0) {
        setMenuItems([data[0], ...menuItems])
        setIsAddDialogOpen(false)
        resetNewItem()

        toast({
          title: "Success",
          description: "Menu item added successfully",
        })
      } else {
        throw new Error("No data returned from insert operation")
      }
    } catch (error) {
      console.error("Error adding menu item:", error)
      setError(`Failed to add menu item: ${error.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: `Failed to add menu item: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // Function to update a menu item
  const handleUpdateItem = async () => {
    try {
      if (!currentItem || !currentItem.id) return

      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setError("Supabase is not properly configured. Check your environment variables.")
        return
      }

      console.log("Updating item:", currentItem)
      const { error: updateError } = await supabase
        .from("menu_items")
        .update({
          name: currentItem.name,
          description: currentItem.description,
          price: currentItem.price,
          image_url: currentItem.image_url,
          category: currentItem.category,
          veg: currentItem.veg,
          available: currentItem.available,
          packaging_charge: currentItem.packaging_charge || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentItem.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setMenuItems(menuItems.map((item) => (item.id === currentItem.id ? currentItem : item)))

      setIsEditDialogOpen(false)
      setCurrentItem(null)

      toast({
        title: "Success",
        description: "Menu item updated successfully",
      })
    } catch (error) {
      console.error("Error updating menu item:", error)
      setError(`Failed to update menu item: ${error.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: `Failed to update menu item: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // Function to delete a menu item
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setError("Supabase is not properly configured. Check your environment variables.")
        return
      }

      console.log("Deleting item with ID:", id)
      const { error: deleteError } = await supabase.from("menu_items").delete().eq("id", id)

      if (deleteError) {
        throw deleteError
      }

      // Update local state
      setMenuItems(menuItems.filter((item) => item.id !== id))

      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting menu item:", error)
      setError(`Failed to delete menu item: ${error.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: `Failed to delete menu item: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  // Reset new item form
  const resetNewItem = () => {
    setNewItem({
      name: "",
      description: "",
      price: 0,
      image_url: "/placeholder.svg?height=100&width=100&text=Food",
      category: "starters",
      veg: true,
      available: true,
    })
  }

  // Filter menu items based on search query
  const filteredItems = menuItems.filter((item) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-gray-500">Manage your restaurant menu items</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowConnectionTest(!showConnectionTest)} variant="outline">
            {showConnectionTest ? "Hide Connection Test" : "Test Connection"}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>
      </div>

      {showConnectionTest && (
        <div className="mb-6">
          <SupabaseConnectionTest />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isSupabaseConfigured() && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Warning</AlertTitle>
          <AlertDescription>
            Supabase environment variables are missing or incorrect. Data will not be persisted.
            <br />
            Make sure you have set <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment.
          </AlertDescription>
        </Alert>
      )}

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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search menu items..."
            className="pl-9 w-full md:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <p>Loading menu items...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <Card key={item.id} className={!item.available ? "opacity-70" : ""}>
                <CardContent className="p-4">
                  <div className="flex">
                    <img
                      src={item.image_url || "/placeholder.svg?height=100&width=100&text=Food"}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md mr-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge className={`h-3 w-3 p-0 mr-2 ${item.veg ? "bg-green-500" : "bg-red-500"}`}>
                            <span className="sr-only">{item.veg ? "Vegetarian" : "Non-vegetarian"}</span>
                          </Badge>
                          <h3 className="font-bold">{item.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold">₹{item.price}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setCurrentItem(item)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteItem(item.id!)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {!item.available && (
                    <Badge variant="outline" className="mt-2 bg-red-100 text-red-800 border-red-200">
                      Currently Unavailable
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center h-40 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No menu items found</p>
            </div>
          )}
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
            <DialogDescription>Enter the details for the new menu item</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-2">
              <Label htmlFor="new-item-name">Item Name</Label>
              <Input
                id="new-item-name"
                placeholder="Enter item name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-item-description">Description</Label>
              <Textarea
                id="new-item-description"
                placeholder="Enter item description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-item-price">Price (₹)</Label>
                <Input
                  id="new-item-price"
                  type="number"
                  placeholder="0"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-item-category">Category</Label>
                <Select
                  defaultValue="starters"
                  value={newItem.category}
                  onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                >
                  <SelectTrigger id="new-item-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starters">Starters</SelectItem>
                    <SelectItem value="main">Main Course</SelectItem>
                    <SelectItem value="desserts">Desserts</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-item-image">Image URL</Label>
              <Input
                id="new-item-image"
                placeholder="Enter image URL"
                value={newItem.image_url}
                onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="new-item-veg"
                checked={newItem.veg}
                onCheckedChange={(checked) => setNewItem({ ...newItem, veg: checked })}
              />
              <Label htmlFor="new-item-veg">Vegetarian</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="new-item-available"
                checked={newItem.available}
                onCheckedChange={(checked) => setNewItem({ ...newItem, available: checked })}
              />
              <Label htmlFor="new-item-available">Available</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          {currentItem && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Menu Item</DialogTitle>
                <DialogDescription>Make changes to the menu item details</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-item-name">Item Name</Label>
                  <Input
                    id="edit-item-name"
                    value={currentItem.name}
                    onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-item-description">Description</Label>
                  <Textarea
                    id="edit-item-description"
                    value={currentItem.description}
                    onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-item-price">Price (₹)</Label>
                    <Input
                      id="edit-item-price"
                      type="number"
                      value={currentItem.price}
                      onChange={(e) => setCurrentItem({ ...currentItem, price: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-item-category">Category</Label>
                    <Select
                      value={currentItem.category}
                      onValueChange={(value) => setCurrentItem({ ...currentItem, category: value })}
                    >
                      <SelectTrigger id="edit-item-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starters">Starters</SelectItem>
                        <SelectItem value="main">Main Course</SelectItem>
                        <SelectItem value="desserts">Desserts</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-item-image">Image URL</Label>
                  <Input
                    id="edit-item-image"
                    value={currentItem.image_url}
                    onChange={(e) => setCurrentItem({ ...currentItem, image_url: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-item-veg"
                    checked={currentItem.veg}
                    onCheckedChange={(checked) => setCurrentItem({ ...currentItem, veg: checked })}
                  />
                  <Label htmlFor="edit-item-veg">Vegetarian</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-item-available"
                    checked={currentItem.available}
                    onCheckedChange={(checked) => setCurrentItem({ ...currentItem, available: checked })}
                  />
                  <Label htmlFor="edit-item-available">Available</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-item-packaging">Packaging Charge (₹)</Label>
                  <Input
                    id="edit-item-packaging"
                    type="number"
                    value={currentItem.packaging_charge || 0}
                    onChange={(e) => setCurrentItem({ ...currentItem, packaging_charge: Number(e.target.value) })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateItem}>Save Changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

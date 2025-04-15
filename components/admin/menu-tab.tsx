"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash, Plus, ImageIcon, Save, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getMenuItems,
  getMenuItemsByCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/lib/services/menuService"
import type { MenuItem } from "@/lib/models"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function MenuTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    category: "starters",
    veg: true,
    available: true,
    image: "/placeholder.svg?height=80&width=80&text=New%20Item",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    { id: "all", name: "All Categories" },
    { id: "starters", name: "Starters" },
    { id: "main", name: "Main Course" },
    { id: "desserts", name: "Desserts" },
    { id: "beverages", name: "Beverages" },
  ]

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true)
        let items: MenuItem[]

        if (categoryFilter === "all") {
          items = await getMenuItems()
        } else {
          items = await getMenuItemsByCategory(categoryFilter)
        }

        setMenuItems(items)
      } catch (error) {
        console.error("Error fetching menu items:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMenuItems()
  }, [categoryFilter])

  const filteredItems = menuItems.filter((item) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    }
    return true
  })

  const handleEditItem = (item: MenuItem) => {
    setEditItem({ ...item })
    setEditImagePreview(null)
    setEditImageFile(null)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteMenuItem(itemId)
        setMenuItems(menuItems.filter((item) => item.id !== itemId))
      } catch (error) {
        console.error(`Error deleting item ${itemId}:`, error)
      }
    }
  }

  const handleSaveItem = async (item: MenuItem) => {
    try {
      setIsUploading(true)

      // Create a local copy of the updated image
      const tempImage = editImagePreview || item.image

      try {
        await updateMenuItem(item.id!, item, editImageFile || undefined)
      } catch (error) {
        console.error("Error saving item:", error)
        setUploadError("Failed to save to database. Using local version instead.")
      }

      // Update the local state regardless of server success
      setMenuItems(
        menuItems.map((menuItem) =>
          menuItem.id === item.id
            ? {
                ...item,
                image: tempImage,
              }
            : menuItem,
        ),
      )

      setEditItem(null)
      setEditImageFile(null)
      setEditImagePreview(null)
    } catch (error) {
      console.error("Error saving item:", error)
      setUploadError("Failed to save item. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddItem = async () => {
    try {
      if (!newItem.name || !newItem.description || newItem.price <= 0) {
        alert("Please fill in all required fields")
        return
      }

      setIsUploading(true)

      // Create a local copy of the item with a temporary image
      const tempImage = imagePreview || newItem.image

      // Add the item to the database
      let itemId
      try {
        itemId = await addMenuItem(newItem as MenuItem, imageFile || undefined)
      } catch (error) {
        console.error("Error adding new item:", error)
        setUploadError("Failed to add item to database. Using local version instead.")
        // Generate a temporary ID for local display
        itemId = crypto.randomUUID()
      }

      // Create a new item with the image preview or the default image
      const addedItem = {
        ...newItem,
        id: itemId,
        image: tempImage,
      } as MenuItem

      setMenuItems([addedItem, ...menuItems])
      setIsAddDialogOpen(false)
      setNewItem({
        name: "",
        description: "",
        price: 0,
        category: "starters",
        veg: true,
        available: true,
        image: "/placeholder.svg?height=80&width=80&text=New%20Item",
      })
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      console.error("Error adding new item:", error)
      setUploadError("Failed to add item. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]

      // Check file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file")
        return
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image size should be less than 5MB")
        return
      }

      // Create a preview immediately
      const previewUrl = URL.createObjectURL(file)

      if (isEdit) {
        setEditImageFile(file)
        setEditImagePreview(previewUrl)
      } else {
        setImageFile(file)
        setImagePreview(previewUrl)
      }
      setUploadError(null)
    }
  }

  const triggerFileInput = (isEdit = false) => {
    if (isEdit) {
      editFileInputRef.current?.click()
    } else {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-gray-500">Manage your restaurant menu items</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Item
        </Button>
      </div>

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
          {filteredItems.map((item) => (
            <Card key={item.id} className={!item.available ? "opacity-70" : ""}>
              <CardContent className="p-4">
                <div className="flex">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md mr-4"
                    onError={(e) => {
                      // If image fails to load, replace with placeholder
                      ;(e.target as HTMLImageElement).src =
                        `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(item.name)}`
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge className={`h-3 w-3 p-0 mr-2 ${item.veg ? "bg-green-500" : "bg-red-500"}`}>
                          <span className="sr-only">{item.veg ? "Vegetarian" : "Non-vegetarian"}</span>
                        </Badge>
                        <h3 className="font-bold">{item.name}</h3>
                      </div>
                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                        <span>{item.rating || "N/A"}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold">₹{item.price}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditItem(item)}>
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
          ))}
          {filteredItems.length === 0 && (
            <div className="col-span-full flex items-center justify-center h-40 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No menu items found</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Item Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md">
          {editItem && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Menu Item</DialogTitle>
                <DialogDescription>Make changes to the menu item details</DialogDescription>
              </DialogHeader>

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 my-2">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-description">Description</Label>
                  <Textarea
                    id="item-description"
                    value={editItem.description}
                    onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-price">Price (₹)</Label>
                    <Input
                      id="item-price"
                      type="number"
                      value={editItem.price}
                      onChange={(e) => setEditItem({ ...editItem, price: Number.parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item-category">Category</Label>
                    <Select
                      value={editItem.category}
                      onValueChange={(value) => setEditItem({ ...editItem, category: value })}
                    >
                      <SelectTrigger id="item-category">
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

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="item-veg"
                    checked={editItem.veg}
                    onChange={(e) => setEditItem({ ...editItem, veg: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="item-veg">Vegetarian</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="item-available"
                    checked={editItem.available}
                    onChange={(e) => setEditItem({ ...editItem, available: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="item-available">Available</Label>
                </div>

                <div className="space-y-2">
                  <Label>Item Image</Label>
                  <div className="flex items-center gap-4">
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={editFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(e, true)}
                    />

                    {/* Clickable image */}
                    <div
                      className="w-16 h-16 rounded-md overflow-hidden cursor-pointer border border-gray-200 hover:border-primary"
                      onClick={() => triggerFileInput(true)}
                    >
                      <img
                        src={editImagePreview || editItem.image || "/placeholder.svg?height=80&width=80&text=Food"}
                        alt={editItem.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If image fails to load, replace with placeholder
                          ;(e.target as HTMLImageElement).src =
                            `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(editItem.name)}`
                        }}
                      />
                    </div>

                    <Button variant="outline" onClick={() => triggerFileInput(true)}>
                      <ImageIcon className="mr-2 h-4 w-4" /> Change Image
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Click on the image or button to upload. Max size: 5MB.</p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditItem(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSaveItem(editItem)} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
            <DialogDescription>Enter the details for the new menu item</DialogDescription>
          </DialogHeader>

          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

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
                  onChange={(e) => setNewItem({ ...newItem, price: Number.parseInt(e.target.value) })}
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="new-item-veg"
                checked={newItem.veg}
                onChange={(e) => setNewItem({ ...newItem, veg: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="new-item-veg">Vegetarian</Label>
            </div>

            <div className="space-y-2">
              <Label>Item Image</Label>
              <div className="flex items-center gap-4">
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />

                {/* Clickable image */}
                <div
                  className="w-16 h-16 rounded-md overflow-hidden cursor-pointer border border-gray-200 hover:border-primary"
                  onClick={() => triggerFileInput()}
                >
                  <img
                    src={imagePreview || newItem.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, replace with placeholder
                      ;(e.target as HTMLImageElement).src = `/placeholder.svg?height=80&width=80&text=New%20Item`
                    }}
                  />
                </div>

                <Button variant="outline" onClick={() => triggerFileInput()}>
                  <ImageIcon className="mr-2 h-4 w-4" /> Upload Image
                </Button>
              </div>
              <p className="text-xs text-gray-500">Click on the image or button to upload. Max size: 5MB.</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setImageFile(null)
                setImagePreview(null)
                setUploadError(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={isUploading}>
              {isUploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Star({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

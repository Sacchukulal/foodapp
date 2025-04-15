"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash, Calendar, Percent, DollarSign } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { getOffers, addOffer, updateOffer, deleteOffer } from "@/lib/services/offerService"
import { getMenuItems } from "@/lib/services/menuService"
import type { Offer, MenuItem } from "@/lib/models"
import { ScrollArea } from "@/components/ui/scroll-area"

export function OffersTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [offers, setOffers] = useState<Offer[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentOffer, setCurrentOffer] = useState<Partial<Offer>>({
    name: "",
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 10,
    minOrderValue: 0,
    maxDiscount: 0,
    applicableItems: "all",
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    active: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [fetchedOffers, fetchedMenuItems] = await Promise.all([getOffers(), getMenuItems()])

        setOffers(fetchedOffers)
        setMenuItems(fetchedMenuItems)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load offers. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredOffers = offers.filter((offer) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        offer.name.toLowerCase().includes(query) ||
        offer.code.toLowerCase().includes(query) ||
        offer.description.toLowerCase().includes(query)
      )
    }
    return true
  })

  const handleAddOffer = async () => {
    try {
      if (!validateOfferForm()) {
        return
      }

      const newOffer = {
        ...currentOffer,
        startDate: new Date(currentOffer.startDate!),
        endDate: new Date(currentOffer.endDate!),
      } as Omit<Offer, "id" | "createdAt">

      const offerId = await addOffer(newOffer)

      // Add to local state with the new ID
      const offerWithId = {
        ...newOffer,
        id: offerId,
        createdAt: new Date(),
        usageCount: 0,
      }

      setOffers([offerWithId, ...offers])
      resetForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding offer:", error)
      alert("Failed to add offer. Please try again.")
    }
  }

  const handleEditOffer = async () => {
    try {
      if (!validateOfferForm() || !currentOffer.id) {
        return
      }

      const updatedOffer = {
        ...currentOffer,
        startDate: new Date(currentOffer.startDate!),
        endDate: new Date(currentOffer.endDate!),
      }

      await updateOffer(currentOffer.id, updatedOffer)

      // Update local state
      setOffers(offers.map((offer) => (offer.id === currentOffer.id ? { ...offer, ...updatedOffer } : offer)))

      resetForm()
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating offer:", error)
      alert("Failed to update offer. Please try again.")
    }
  }

  const handleDeleteOffer = async (id: string) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      try {
        await deleteOffer(id)
        setOffers(offers.filter((offer) => offer.id !== id))
      } catch (error) {
        console.error("Error deleting offer:", error)
        alert("Failed to delete offer. Please try again.")
      }
    }
  }

  const openEditDialog = (offer: Offer) => {
    setCurrentOffer({
      ...offer,
      startDate: new Date(offer.startDate),
      endDate: new Date(offer.endDate),
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setCurrentOffer({
      name: "",
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 0,
      maxDiscount: 0,
      applicableItems: "all",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      active: true,
    })
  }

  const validateOfferForm = () => {
    if (!currentOffer.name || !currentOffer.code || !currentOffer.description) {
      alert("Please fill in all required fields")
      return false
    }

    if (currentOffer.discountValue <= 0) {
      alert("Discount value must be greater than 0")
      return false
    }

    if (currentOffer.discountType === "percentage" && currentOffer.discountValue > 100) {
      alert("Percentage discount cannot exceed 100%")
      return false
    }

    if (new Date(currentOffer.startDate!) > new Date(currentOffer.endDate!)) {
      alert("End date must be after start date")
      return false
    }

    return true
  }

  const formatDate = (date: Date) => {
    return format(date, "MMM dd, yyyy")
  }

  const isOfferActive = (offer: Offer) => {
    const now = new Date()
    return offer.active && offer.startDate <= now && offer.endDate >= now
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Offers Management</h1>
          <p className="text-gray-500">Create and manage discount offers</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Offer
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search offers..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <p>Loading offers...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offer Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{offer.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{offer.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono uppercase">
                        {offer.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {offer.discountType === "percentage" ? (
                        <div className="flex items-center">
                          <Percent className="h-3 w-3 mr-1" />
                          <span>{offer.discountValue}%</span>
                          {offer.maxDiscount > 0 && (
                            <span className="text-xs text-gray-500 ml-1">(max ₹{offer.maxDiscount})</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          <span>₹{offer.discountValue}</span>
                        </div>
                      )}
                      {offer.minOrderValue > 0 && (
                        <div className="text-xs text-gray-500 mt-1">Min order: ₹{offer.minOrderValue}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          isOfferActive(offer)
                            ? "bg-green-500"
                            : !offer.active
                              ? "bg-gray-500"
                              : new Date() < offer.startDate
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }
                      >
                        {isOfferActive(offer)
                          ? "Active"
                          : !offer.active
                            ? "Disabled"
                            : new Date() < offer.startDate
                              ? "Upcoming"
                              : "Expired"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(offer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteOffer(offer.id!)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOffers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No offers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Offer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add New Offer</DialogTitle>
            <DialogDescription>Create a new discount offer for your customers</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4 my-2">
              <div className="space-y-2">
                <Label htmlFor="offer-name">Offer Name</Label>
                <Input
                  id="offer-name"
                  placeholder="Summer Sale"
                  value={currentOffer.name}
                  onChange={(e) => setCurrentOffer({ ...currentOffer, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer-code">Offer Code</Label>
                <Input
                  id="offer-code"
                  placeholder="SUMMER20"
                  value={currentOffer.code}
                  onChange={(e) => setCurrentOffer({ ...currentOffer, code: e.target.value.toUpperCase() })}
                />
                <p className="text-xs text-gray-500">Customers will use this code at checkout</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="offer-description">Description</Label>
                <Textarea
                  id="offer-description"
                  placeholder="Get 20% off on all orders above ₹500"
                  value={currentOffer.description}
                  onChange={(e) => setCurrentOffer({ ...currentOffer, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-type">Discount Type</Label>
                  <Select
                    value={currentOffer.discountType}
                    onValueChange={(value) =>
                      setCurrentOffer({ ...currentOffer, discountType: value as "percentage" | "fixed" })
                    }
                  >
                    <SelectTrigger id="discount-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-value">
                    {currentOffer.discountType === "percentage" ? "Percentage" : "Amount"}
                  </Label>
                  <Input
                    id="discount-value"
                    type="number"
                    placeholder={currentOffer.discountType === "percentage" ? "20" : "100"}
                    value={currentOffer.discountValue}
                    onChange={(e) => setCurrentOffer({ ...currentOffer, discountValue: Number(e.target.value) })}
                  />
                </div>
              </div>

              {currentOffer.discountType === "percentage" && (
                <div className="space-y-2">
                  <Label htmlFor="max-discount">Maximum Discount (₹)</Label>
                  <Input
                    id="max-discount"
                    type="number"
                    placeholder="200"
                    value={currentOffer.maxDiscount}
                    onChange={(e) => setCurrentOffer({ ...currentOffer, maxDiscount: Number(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500">Leave 0 for no maximum limit</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="min-order-value">Minimum Order Value (₹)</Label>
                <Input
                  id="min-order-value"
                  type="number"
                  placeholder="500"
                  value={currentOffer.minOrderValue}
                  onChange={(e) => setCurrentOffer({ ...currentOffer, minOrderValue: Number(e.target.value) })}
                />
                <p className="text-xs text-gray-500">Minimum order amount required to apply this offer</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicable-items">Applicable Items</Label>
                <Select
                  value={currentOffer.applicableItems as string}
                  onValueChange={(value) => setCurrentOffer({ ...currentOffer, applicableItems: value })}
                >
                  <SelectTrigger id="applicable-items">
                    <SelectValue placeholder="Select items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="starters">Starters</SelectItem>
                    <SelectItem value="main">Main Course</SelectItem>
                    <SelectItem value="desserts">Desserts</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={format(new Date(currentOffer.startDate!), "yyyy-MM-dd")}
                    onChange={(e) => setCurrentOffer({ ...currentOffer, startDate: new Date(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={format(new Date(currentOffer.endDate!), "yyyy-MM-dd")}
                    onChange={(e) => setCurrentOffer({ ...currentOffer, endDate: new Date(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={currentOffer.active}
                  onCheckedChange={(checked) => setCurrentOffer({ ...currentOffer, active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOffer}>
              <Plus className="mr-2 h-4 w-4" /> Add Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Offer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
            <DialogDescription>Update the details of this offer</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4 my-2">
              <div className="space-y-2">
                <Label htmlFor="edit-offer-name">Offer Name</Label>
                <Input
                  id="edit-offer-name"
                  value={currentOffer.name}
                  onChange={(e) => setCurrentOffer({ ...currentOffer, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-offer-code">Offer Code</Label>
                <Input
                  id="edit-offer-code"
                  value={currentOffer.code}
                  onChange={(e) => setCurrentOffer({ ...currentOffer, code: e.target.value.toUpperCase() })}
                />
                <p className="text-xs text-gray-500">Customers will use this code at checkout</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-offer-description">Description</Label>
                <Textarea
                  id="edit-offer-description"
                  value={currentOffer.description}
                  onChange={(e) => setCurrentOffer({ ...currentOffer, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-discount-type">Discount Type</Label>
                  <Select
                    value={currentOffer.discountType}
                    onValueChange={(value) =>
                      setCurrentOffer({ ...currentOffer, discountType: value as "percentage" | "fixed" })
                    }
                  >
                    <SelectTrigger id="edit-discount-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-discount-value">
                    {currentOffer.discountType === "percentage" ? "Percentage" : "Amount"}
                  </Label>
                  <Input
                    id="edit-discount-value"
                    type="number"
                    value={currentOffer.discountValue}
                    onChange={(e) => setCurrentOffer({ ...currentOffer, discountValue: Number(e.target.value) })}
                  />
                </div>
              </div>

              {currentOffer.discountType === "percentage" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-max-discount">Maximum Discount (₹)</Label>
                  <Input
                    id="edit-max-discount"
                    type="number"
                    value={currentOffer.maxDiscount}
                    onChange={(e) => setCurrentOffer({ ...currentOffer, maxDiscount: Number(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500">Leave 0 for no maximum limit</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-min-order-value">Minimum Order Value (₹)</Label>
                <Input
                  id="edit-min-order-value"
                  type="number"
                  value={currentOffer.minOrderValue}
                  onChange={(e) => setCurrentOffer({ ...currentOffer, minOrderValue: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-applicable-items">Applicable Items</Label>
                <Select
                  value={currentOffer.applicableItems as string}
                  onValueChange={(value) => setCurrentOffer({ ...currentOffer, applicableItems: value })}
                >
                  <SelectTrigger id="edit-applicable-items">
                    <SelectValue placeholder="Select items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="starters">Starters</SelectItem>
                    <SelectItem value="main">Main Course</SelectItem>
                    <SelectItem value="desserts">Desserts</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-date">Start Date</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={format(new Date(currentOffer.startDate!), "yyyy-MM-dd")}
                    onChange={(e) => setCurrentOffer({ ...currentOffer, startDate: new Date(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-end-date">End Date</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={format(new Date(currentOffer.endDate!), "yyyy-MM-dd")}
                    onChange={(e) => setCurrentOffer({ ...currentOffer, endDate: new Date(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={currentOffer.active}
                  onCheckedChange={(checked) => setCurrentOffer({ ...currentOffer, active: checked })}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditOffer}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

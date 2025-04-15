"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  ShoppingBag,
  Users,
  Utensils,
  Star,
  CheckCircle2,
  XCircle,
  TruckIcon,
  Search,
  Edit,
  Trash,
  Plus,
  ImageIcon,
  Save,
  Package,
  Tag,
} from "lucide-react"
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
import { formatDistanceToNow } from "date-fns"

// Import Firestore services
import {
  getTotalOrders,
  getRecentOrders,
  updateOrderStatus,
  getOrders,
  getOrdersByStatus,
} from "@/lib/services/orderService"
import { getActiveCustomers, getCustomers } from "@/lib/services/customerService"
import {
  getMenuItems,
  getPopularMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemsByCategory,
} from "@/lib/services/menuService"
import { getReviews, replyToReview, getReviewsByRating, getPendingReviews } from "@/lib/services/reviewService"
import type { MenuItem, Order, Customer, Review } from "@/lib/models"

// Import new tabs
import { OffersTab } from "./offers-tab"
import { PackagingTab } from "./packaging-tab"
import { uploadImage } from "@/lib/imageUpload"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white shadow-sm">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Hotel Admin</h1>
          <p className="text-sm text-gray-500">Management Dashboard</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <NavItem
              icon={<BarChart className="h-5 w-5" />}
              label="Dashboard"
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <NavItem
              icon={<ShoppingBag className="h-5 w-5" />}
              label="Orders"
              active={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
            />
            <NavItem
              icon={<Utensils className="h-5 w-5" />}
              label="Menu Items"
              active={activeTab === "menu"}
              onClick={() => setActiveTab("menu")}
            />
            <NavItem
              icon={<Tag className="h-5 w-5" />}
              label="Offers"
              active={activeTab === "offers"}
              onClick={() => setActiveTab("offers")}
            />
            <NavItem
              icon={<Package className="h-5 w-5" />}
              label="Packaging"
              active={activeTab === "packaging"}
              onClick={() => setActiveTab("packaging")}
            />
            <NavItem
              icon={<Users className="h-5 w-5" />}
              label="Customers"
              active={activeTab === "customers"}
              onClick={() => setActiveTab("customers")}
            />
            <NavItem
              icon={<Star className="h-5 w-5" />}
              label="Reviews"
              active={activeTab === "reviews"}
              onClick={() => setActiveTab("reviews")}
            />
          </ul>
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-10">
        <div className="flex justify-around p-2">
          <MobileNavItem
            icon={<BarChart className="h-5 w-5" />}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <MobileNavItem
            icon={<ShoppingBag className="h-5 w-5" />}
            label="Orders"
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          />
          <MobileNavItem
            icon={<Utensils className="h-5 w-5" />}
            label="Menu"
            active={activeTab === "menu"}
            onClick={() => setActiveTab("menu")}
          />
          <MobileNavItem
            icon={<Tag className="h-5 w-5" />}
            label="Offers"
            active={activeTab === "offers"}
            onClick={() => setActiveTab("offers")}
          />
          <MobileNavItem
            icon={<Package className="h-5 w-5" />}
            label="Packaging"
            active={activeTab === "packaging"}
            onClick={() => setActiveTab("packaging")}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="dashboard" className="mt-0">
            <DashboardTab setActiveTab={setActiveTab} />
          </TabsContent>
          <TabsContent value="orders" className="mt-0">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="menu" className="mt-0">
            <MenuTab />
          </TabsContent>
          <TabsContent value="offers" className="mt-0">
            <OffersTab />
          </TabsContent>
          <TabsContent value="packaging" className="mt-0">
            <PackagingTab />
          </TabsContent>
          <TabsContent value="customers" className="mt-0">
            <CustomersTab />
          </TabsContent>
          <TabsContent value="reviews" className="mt-0">
            <ReviewsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <li>
      <button
        className={`flex items-center w-full p-2 rounded-md text-left ${
          active ? "bg-gray-100 text-primary" : "text-gray-700 hover:bg-gray-50"
        }`}
        onClick={onClick}
      >
        <span className="mr-3">{icon}</span>
        <span>{label}</span>
      </button>
    </li>
  )
}

function MobileNavItem({ icon, label, active, onClick }) {
  return (
    <button
      className={`flex flex-col items-center justify-center p-1 ${active ? "text-primary" : "text-gray-700"}`}
      onClick={onClick}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  )
}

function DashboardTab({ setActiveTab }) {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    menuItems: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [popularItems, setPopularItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch stats
        const totalOrders = await getTotalOrders()

        // Calculate total revenue from orders
        const orders = await getOrders()
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)

        const activeCustomers = await getActiveCustomers()
        const menuItems = (await getMenuItems()).length

        setStats({
          totalOrders,
          totalRevenue,
          activeCustomers,
          menuItems,
        })

        // Fetch recent orders
        const recent = await getRecentOrders(4)
        setRecentOrders(recent)

        // Fetch popular items
        const popular = await getPopularMenuItems(4)
        setPopularItems(popular)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome back to your admin dashboard</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <BarChart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Customers</p>
              <p className="text-2xl font-bold">{stats.activeCustomers}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Menu Items</p>
              <p className="text-2xl font-bold">{stats.menuItems}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Utensils className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <p>Loading recent orders...</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.customer.name}</TableCell>
                        <TableCell>₹{order.total}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              order.status === "Delivered"
                                ? "bg-green-500"
                                : order.status === "On the way"
                                  ? "bg-blue-500"
                                  : order.status === "Preparing"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-gray-500 text-sm">
                          {formatTimeAgo(order.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {recentOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No recent orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("orders")}>
                    View All Orders
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Items</CardTitle>
            <CardDescription>Most ordered menu items</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <p>Loading popular items...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {popularItems.map((item) => (
                  <div key={item.id} className="flex items-center">
                    <img
                      src={item.image || "/placeholder.svg?height=40&width=40&text=Food"}
                      alt={item.name}
                      className="w-10 h-10 rounded-md object-cover mr-3"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">{item.orderCount || 0} orders</p>
                    </div>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${
                            popularItems.length > 0
                              ? ((item.orderCount || 0) / (popularItems[0].orderCount || 1)) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {popularItems.length === 0 && (
                  <div className="text-center py-4 text-gray-500">No popular items found</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function OrdersTab() {
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        let fetchedOrders: Order[]

        if (filter === "all") {
          fetchedOrders = await getOrders()
        } else {
          fetchedOrders = await getOrdersByStatus(filter as Order["status"])
        }

        setOrders(fetchedOrders)
      } catch (error) {
        console.error("Error fetching orders:", error)
        setError("Failed to load orders. Please try again.")
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [filter])

  const filteredOrders = orders.filter((order) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.id?.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.customer.phone.includes(query) ||
        order.customer.address.toLowerCase().includes(query)
      )
    }
    return true
  })

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setOrderDetailsOpen(true)
  }

  const handleUpdateStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await updateOrderStatus(orderId, newStatus)

      // Update the local state
      setOrders(
        orders.map((order) => (order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date() } : order)),
      )

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, updatedAt: new Date() })
      }

      setOrderDetailsOpen(false)
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error)
    }
  }

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <p className="text-gray-500">View and manage customer orders</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            All Orders
          </Button>
          <Button variant={filter === "Preparing" ? "default" : "outline"} onClick={() => setFilter("Preparing")}>
            Preparing
          </Button>
          <Button variant={filter === "On the way" ? "default" : "outline"} onClick={() => setFilter("On the way")}>
            On the way
          </Button>
          <Button variant={filter === "Delivered" ? "default" : "outline"} onClick={() => setFilter("Delivered")}>
            Delivered
          </Button>
          <Button variant={filter === "Cancelled" ? "default" : "outline"} onClick={() => setFilter("Cancelled")}>
            Cancelled
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search orders..."
            className="pl-9 w-full md:w-64"
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
              <p>Loading orders...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div>{order.customer.name}</div>
                        <div className="text-sm text-gray-500">{order.customer.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>₹{order.total}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.status === "Delivered"
                            ? "bg-green-500"
                            : order.status === "On the way"
                              ? "bg-blue-500"
                              : order.status === "Preparing"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatTimeAgo(order.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewOrder(order)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="max-w-md">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details - {selectedOrder.id}</DialogTitle>
                <DialogDescription>{formatTimeAgo(selectedOrder.createdAt)}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Customer Information</h4>
                  <p className="font-medium">{selectedOrder.customer.name}</p>
                  <p>{selectedOrder.customer.phone}</p>
                  <p className="text-sm text-gray-700">{selectedOrder.customer.address}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity} x {item.name}
                        </span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{selectedOrder.total}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Current Status</h4>
                  <Badge
                    className={
                      selectedOrder.status === "Delivered"
                        ? "bg-green-500"
                        : selectedOrder.status === "On the way"
                          ? "bg-blue-500"
                          : selectedOrder.status === "Preparing"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                    }
                  >
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedOrder.status === "Preparing" && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.id!, "On the way")}
                    className="w-full sm:w-auto"
                  >
                    <TruckIcon className="mr-2 h-4 w-4" />
                    Mark as On the way
                  </Button>
                )}

                {selectedOrder.status === "On the way" && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder.id!, "Delivered")}
                    className="w-full sm:w-auto"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Delivered
                  </Button>
                )}

                {(selectedOrder.status === "Preparing" || selectedOrder.status === "On the way") && (
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateStatus(selectedOrder.id!, "Cancelled")}
                    className="w-full sm:w-auto"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Order
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MenuTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    description: "",
    price: 0,
    category: "starters",
    veg: true,
    available: true,
    image: "/placeholder.svg?height=80&width=80&text=New%20Item",
  })

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
      await updateMenuItem(item.id!, item)

      // Update the local state
      setMenuItems(menuItems.map((menuItem) => (menuItem.id === item.id ? item : menuItem)))

      setEditItem(null)
    } catch (error) {
      console.error("Error saving item:", error)
    }
  }

  const handleAddItem = async () => {
    try {
      if (!newItem.name || !newItem.description || newItem.price <= 0) {
        alert("Please fill in all required fields")
        return
      }

      const itemId = await addMenuItem(newItem as MenuItem)
      const addedItem = { ...newItem, id: itemId } as MenuItem

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
    } catch (error) {
      console.error("Error adding new item:", error)
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
                    <img
                      src={editItem.image || "/placeholder.svg"}
                      alt={editItem.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <Button variant="outline">
                      <ImageIcon className="mr-2 h-4 w-4" /> Change Image
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditItem(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSaveItem(editItem)}>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
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
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    try {
                      setIsUploading(true)
                      // Upload the image and get the URL
                      const imageUrl = await uploadImage(file)
                      // Update the new item with the image URL
                      setNewItem({ ...newItem, image: imageUrl })
                      setIsUploading(false)
                    } catch (error) {
                      console.error("Error uploading image:", error)
                      setIsUploading(false)
                      alert("Failed to upload image: " + (error.message || "Unknown error"))
                    }
                  }
                }}
                ref={fileInputRef}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
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
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" /> Upload Image
                  </>
                )}
              </Button>
              {newItem.image && newItem.image !== "/placeholder.svg?height=80&width=80&text=New%20Item" && (
                <div className="mt-2">
                  <p className="text-xs text-green-600">Image uploaded successfully!</p>
                  <div className="mt-1 w-full h-32 rounded-md overflow-hidden">
                    <img
                      src={newItem.image || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
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
    </div>
  )
}

function CustomersTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        const fetchedCustomers = await getCustomers()
        setCustomers(fetchedCustomers)
      } catch (error) {
        console.error("Error fetching customers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter((customer) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(query)) ||
        customer.address.toLowerCase().includes(query)
      )
    }
    return true
  })

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerDetailsOpen(true)
  }

  const formatTimeAgo = (date?: Date) => {
    if (!date) return "Never"
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <p className="text-gray-500">View and manage your customer information</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search customers..."
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
              <p>Loading customers...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div>
                        <div>{customer.phone}</div>
                        <div className="text-sm text-gray-500">{customer.email || "No email"}</div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.orders || 0}</TableCell>
                    <TableCell>₹{customer.totalSpent || 0}</TableCell>
                    <TableCell>{formatTimeAgo(customer.lastOrder)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewCustomer(customer)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={customerDetailsOpen} onOpenChange={setCustomerDetailsOpen}>
        <DialogContent className="max-w-md">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>Customer Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Personal Information</h4>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p>{selectedCustomer.phone}</p>
                  <p>{selectedCustomer.email || "No email"}</p>
                  <p className="text-sm text-gray-700">{selectedCustomer.address}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Order History</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="font-bold text-lg">{selectedCustomer.orders || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Total Spent</p>
                      <p className="font-bold text-lg">₹{selectedCustomer.totalSpent || 0}</p>
                    </div>
                  </div>
                  <p className="text-sm mt-2">
                    Last order: <span className="font-medium">{formatTimeAgo(selectedCustomer.lastOrder)}</span>
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCustomerDetailsOpen(false)}>
                  Close
                </Button>
                <Button>View All Orders</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReviewsTab() {
  const [filter, setFilter] = useState("all")
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [replyText, setReplyText] = useState("")

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        let fetchedReviews: Review[]

        if (filter === "all") {
          fetchedReviews = await getReviews()
        } else if (filter === "positive") {
          fetchedReviews = await getReviewsByRating(4)
        } else if (filter === "negative") {
          // Get all reviews and filter for ratings < 4
          const allReviews = await getReviews()
          fetchedReviews = allReviews.filter((review) => review.rating < 4)
        } else if (filter === "pending") {
          fetchedReviews = await getPendingReviews()
        }

        setReviews(fetchedReviews)
      } catch (error) {
        console.error("Error fetching reviews:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [filter])

  const handleReplyToReview = (review: Review) => {
    setSelectedReview(review)
    setReplyText("")
    setReplyDialogOpen(true)
  }

  const handleSubmitReply = async () => {
    if (!selectedReview || !replyText.trim()) return

    try {
      await replyToReview(selectedReview.id!, replyText)

      // Update the local state
      setReviews(
        reviews.map((review) =>
          review.id === selectedReview.id
            ? {
                ...review,
                replied: true,
                reply: replyText,
                replyDate: new Date(),
              }
            : review,
        ),
      )

      setReplyDialogOpen(false)
    } catch (error) {
      console.error(`Error replying to review ${selectedReview.id}:`, error)
    }
  }

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Reviews</h1>
        <p className="text-gray-500">View and respond to customer feedback</p>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          All Reviews
        </Button>
        <Button variant={filter === "positive" ? "default" : "outline"} onClick={() => setFilter("positive")}>
          Positive
        </Button>
        <Button variant={filter === "negative" ? "default" : "outline"} onClick={() => setFilter("negative")}>
          Negative
        </Button>
        <Button variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>
          Pending Reply
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <p>Loading reviews...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{review.customerName}</h3>
                      <span className="text-sm text-gray-500">{formatTimeAgo(review.createdAt)}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-700">for {review.menuItemName}</span>
                    </div>
                  </div>
                  {!review.replied && (
                    <Button size="sm" variant="outline" onClick={() => handleReplyToReview(review)}>
                      Reply
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-gray-700">{review.comment}</p>
                {review.replied && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200">
                    <p className="text-sm font-medium">Your Reply:</p>
                    <p className="text-sm text-gray-600">{review.reply}</p>
                    {review.replyDate && (
                      <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(review.replyDate)}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {reviews.length === 0 && (
            <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No reviews found</p>
            </div>
          )}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedReview && (
            <>
              <DialogHeader>
                <DialogTitle>Reply to Review</DialogTitle>
                <DialogDescription>Respond to {selectedReview.customerName}'s review</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{selectedReview.customerName}</h3>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < selectedReview.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm mt-1">{selectedReview.comment}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reply">Your Reply</Label>
                  <Textarea
                    id="reply"
                    placeholder="Type your response here..."
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitReply} disabled={!replyText.trim()}>
                  Send Reply
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

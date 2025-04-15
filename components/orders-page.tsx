"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Clock, MapPin, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOrdersByCustomer } from "@/lib/services/orderService"
import { formatDistanceToNow } from "date-fns"
import type { Order } from "@/lib/models"

export function OrdersPage({ onBack, customerPhone }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)

        // Only fetch orders if we have a customer phone
        if (customerPhone) {
          const fetchedOrders = await getOrdersByCustomer(customerPhone)
          setOrders(fetchedOrders)
        } else {
          setOrders([])
        }
      } catch (error) {
        console.error("Error fetching orders:", error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [customerPhone])

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold ml-2">Your Orders</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <p>Loading your orders...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold">Order #{order.id?.substring(0, 8)}</h3>
                      <p className="text-sm text-gray-500">{formatTimeAgo(order.createdAt)}</p>
                    </div>
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
                  </div>

                  <div className="space-y-2 mb-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity} x {item.name}
                        </span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{order.total}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">
                        {order.status === "Delivered"
                          ? "Delivered"
                          : order.status === "On the way"
                            ? "Arriving soon"
                            : "Preparing your food"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">{order.customer.address}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium mb-1">No orders yet</h3>
            <p className="text-sm text-gray-500">Your order history will appear here</p>
            <Button className="mt-4" onClick={onBack}>
              Browse Menu
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

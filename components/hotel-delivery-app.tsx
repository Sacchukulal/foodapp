"use client"

import { useState, useEffect } from "react"
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  MapPin,
  Clock,
  Home,
  ShoppingBag,
  User,
  Tag,
  X,
  Heart,
  ChevronRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getMenuItems, getMenuItemsByCategory } from "@/lib/services/menuService"
import { addOrder } from "@/lib/services/orderService"
import { addCustomer, getCustomerByPhone } from "@/lib/services/customerService"
import { validateOfferCode, getActiveOffers } from "@/lib/services/offerService"
import { OrdersPage } from "./orders-page"
import type { MenuItem, Offer } from "@/lib/models"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function HotelDeliveryApp() {
  const [activeTab, setActiveTab] = useState("all")
  const [cartItems, setCartItems] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [currentView, setCurrentView] = useState("menu") // menu, itemDetail, checkout, orderConfirmation, orders, offers
  const [selectedItem, setSelectedItem] = useState(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [offerCode, setOfferCode] = useState("")
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null)
  const [offerError, setOfferError] = useState("")
  const [packagingTotal, setPackagingTotal] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([])
  const [showCartBar, setShowCartBar] = useState(false)
  const [allOffers, setAllOffers] = useState<Offer[]>([])
  const [offersLoading, setOffersLoading] = useState(true)

  const foodCategories = [
    { id: "healthy", name: "Healthy", image: "/placeholder.svg?height=60&width=60&text=Healthy" },
    { id: "homestyle", name: "Home Style", image: "/placeholder.svg?height=60&width=60&text=Home" },
    { id: "pizza", name: "Pizza", image: "/placeholder.svg?height=60&width=60&text=Pizza" },
    { id: "chicken", name: "Chicken", image: "/placeholder.svg?height=60&width=60&text=Chicken" },
    { id: "burger", name: "Burger", image: "/placeholder.svg?height=60&width=60&text=Burger" },
    { id: "paneer", name: "Paneer", image: "/placeholder.svg?height=60&width=60&text=Paneer" },
    { id: "rolls", name: "Rolls", image: "/placeholder.svg?height=60&width=60&text=Rolls" },
    { id: "momos", name: "Momos", image: "/placeholder.svg?height=60&width=60&text=Momos" },
  ]

  const menuCategories = [
    { id: "all", name: "All" },
    { id: "starters", name: "Starters" },
    { id: "main", name: "Main Course" },
    { id: "desserts", name: "Desserts" },
    { id: "beverages", name: "Beverages" },
  ]

  // Load customer phone from localStorage on initial render
  useEffect(() => {
    const savedPhone = localStorage.getItem("customerPhone")
    if (savedPhone) {
      setCustomerPhone(savedPhone)
    }
  }, [])

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true)
        let items: MenuItem[]

        if (activeTab === "all") {
          items = await getMenuItems()
        } else {
          items = await getMenuItemsByCategory(activeTab)
        }

        // Filter out unavailable items
        items = items.filter((item) => item.available !== false)
        setMenuItems(items)
      } catch (error) {
        console.error("Error fetching menu items:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMenuItems()
  }, [activeTab])

  // Calculate packaging total whenever cart items change
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => {
      const packagingCharge = item.packagingCharge || 0
      return sum + packagingCharge * item.quantity
    }, 0)
    setPackagingTotal(total)

    // Show cart bar if there are items in the cart
    setShowCartBar(cartItems.length > 0)
  }, [cartItems])

  // Fetch available offers when cart items change
  useEffect(() => {
    const fetchAvailableOffers = async () => {
      if (cartItems.length === 0) {
        setAvailableOffers([])
        return
      }

      try {
        const offers = await getActiveOffers()
        const subtotal = getSubtotal()

        // Filter offers that are applicable to the current order
        const eligibleOffers = offers.filter((offer) => {
          // Check minimum order value
          if (offer.minOrderValue > subtotal) {
            return false
          }

          // Check if offer is applicable to items in cart
          if (offer.applicableItems === "all") {
            return true
          }

          // For category-specific offers
          if (typeof offer.applicableItems === "string") {
            return cartItems.some((item) => item.category === offer.applicableItems)
          }

          // For specific item offers
          if (Array.isArray(offer.applicableItems)) {
            return cartItems.some((item) => offer.applicableItems.includes(item.id))
          }

          return false
        })

        setAvailableOffers(eligibleOffers)
      } catch (error) {
        console.error("Error fetching available offers:", error)
        setAvailableOffers([])
      }
    }

    fetchAvailableOffers()
  }, [cartItems])

  useEffect(() => {
    const fetchAllOffers = async () => {
      try {
        setOffersLoading(true)
        const offers = await getActiveOffers()
        setAllOffers(offers)
      } catch (error) {
        console.error("Error fetching offers:", error)
        setAllOffers([])
      } finally {
        setOffersLoading(false)
      }
    }

    fetchAllOffers()
  }, [])

  const filteredItems = menuItems.filter((item) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    }
    return true
  })

  const addToCart = (item, quantity = 1) => {
    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id)

    if (existingItem) {
      setCartItems(
        cartItems.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + quantity } : cartItem,
        ),
      )
    } else {
      setCartItems([...cartItems, { ...item, quantity }])
    }

    // Reset applied offer when cart changes
    setAppliedOffer(null)
    setDiscountAmount(0)
    setOfferCode("")
  }

  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId))

    // Reset applied offer when cart changes
    setAppliedOffer(null)
    setDiscountAmount(0)
    setOfferCode("")
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCartItems(cartItems.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))

    // Reset applied offer when cart changes
    setAppliedOffer(null)
    setDiscountAmount(0)
    setOfferCode("")
  }

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalAmount = () => {
    const subtotal = getSubtotal()
    return subtotal + packagingTotal - discountAmount
  }

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const handleItemClick = (item) => {
    setSelectedItem(item)
    setCurrentView("itemDetail")
  }

  const handleBackToMenu = () => {
    setCurrentView("menu")
    setSelectedItem(null)
  }

  const handleCheckout = () => {
    setCartOpen(false)
    setCurrentView("checkout")
  }

  const handleApplyOffer = async () => {
    if (!offerCode.trim()) {
      setOfferError("Please enter an offer code")
      return
    }

    try {
      const subtotal = getSubtotal()
      const validOffer = await validateOfferCode(offerCode, subtotal)

      if (!validOffer) {
        setOfferError("Invalid offer code or minimum order value not met")
        return
      }

      setAppliedOffer(validOffer)

      // Calculate discount
      let discount = 0
      if (validOffer.discountType === "percentage") {
        discount = (subtotal * validOffer.discountValue) / 100
        // Apply maximum discount if specified
        if (validOffer.maxDiscount > 0 && discount > validOffer.maxDiscount) {
          discount = validOffer.maxDiscount
        }
      } else {
        discount = validOffer.discountValue
      }

      setDiscountAmount(discount)
      setOfferError("")
    } catch (error) {
      console.error("Error validating offer:", error)
      setOfferError("Error applying offer. Please try again.")
    }
  }

  const handleRemoveOffer = () => {
    setAppliedOffer(null)
    setDiscountAmount(0)
    setOfferCode("")
    setOfferError("")
  }

  const handleApplyOfferFromCart = (offer: Offer) => {
    setOfferCode(offer.code)
    setAppliedOffer(offer)

    // Calculate discount
    let discount = 0
    const subtotal = getSubtotal()

    if (offer.discountType === "percentage") {
      discount = (subtotal * offer.discountValue) / 100
      // Apply maximum discount if specified
      if (offer.maxDiscount > 0 && discount > offer.maxDiscount) {
        discount = offer.maxDiscount
      }
    } else {
      discount = offer.discountValue
    }

    setDiscountAmount(discount)
    setOfferError("")
  }

  const handlePlaceOrder = async (customerData) => {
    try {
      // Check if customer exists or create new one
      let customerId = ""
      const existingCustomer = await getCustomerByPhone(customerData.phone)

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        // Create new customer
        const newCustomer = {
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          orders: 0,
          totalSpent: 0,
          lastOrder: new Date(),
        }
        customerId = await addCustomer(newCustomer)
      }

      // Save customer phone for orders view
      setCustomerPhone(customerData.phone)
      // Save to localStorage for persistence
      localStorage.setItem("customerPhone", customerData.phone)

      // Create order
      const orderItems = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        packagingCharge: item.packagingCharge || 0,
      }))

      const totalAmount = getTotalAmount()

      const order = {
        customer: {
          id: customerId,
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
        },
        items: orderItems,
        total: totalAmount,
        status: "Preparing",
        packagingTotal: packagingTotal,
        appliedOffers: appliedOffer ? [appliedOffer.code] : [],
        discountAmount: discountAmount,
      }

      await addOrder(order)

      setOrderPlaced(true)
      setCurrentView("orderConfirmation")
      setCartItems([])
      setAppliedOffer(null)
      setDiscountAmount(0)
      setOfferCode("")
    } catch (error) {
      console.error("Error placing order:", error)
      alert("There was an error placing your order. Please try again.")
    }
  }

  const renderHomeView = () => (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-sm font-medium">Karol Bagh, New Delhi</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-100 overflow-hidden">
              <img
                src="/placeholder.svg?height=32&width=32&text=User"
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9 bg-gray-100 border-none h-10 text-sm"
              placeholder="Restaurant name, cuisine, or a dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2">
              <Badge variant="outline" className="py-1 px-3 rounded-full bg-gray-100 text-gray-700 border-gray-200">
                MAX Safety
              </Badge>
              <Badge variant="outline" className="py-1 px-3 rounded-full bg-gray-100 text-gray-700 border-gray-200">
                PRO
              </Badge>
              <Badge variant="outline" className="py-1 px-3 rounded-full bg-gray-100 text-gray-700 border-gray-200">
                Cuisines <ChevronRight className="h-3 w-3 ml-1" />
              </Badge>
              <Badge variant="outline" className="py-1 px-3 rounded-full bg-gray-100 text-gray-700 border-gray-200">
                Rating: Popular
              </Badge>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </header>

      <main className="flex-1 px-4 py-3">
        {/* Offers Carousel */}
        <div className="mb-6">
          <ScrollArea className="w-full">
            <div className="flex gap-3">
              <Card className="min-w-[250px] overflow-hidden border-none shadow-sm">
                <CardContent className="p-0 relative">
                  <div className="bg-red-500 text-white p-3 rounded-lg">
                    <div className="text-lg font-bold">60% OFF</div>
                    <div className="text-sm">with free delivery</div>
                    <div className="text-xs mt-2">no cooking July</div>
                  </div>
                  <Badge className="absolute top-2 left-2 bg-blue-600">deal of the day</Badge>
                </CardContent>
              </Card>

              <Card className="min-w-[250px] overflow-hidden border-none shadow-sm">
                <CardContent className="p-0 relative">
                  <div className="bg-pink-100 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="text-lg font-bold">Burger King</div>
                      <div className="text-sm">EVERYTHING AT</div>
                      <div className="text-sm font-bold">₹129 only</div>
                    </div>
                    <img
                      src="/placeholder.svg?height=80&width=80&text=Burger"
                      alt="Burger"
                      className="h-20 w-20 object-cover"
                    />
                  </div>
                  <Badge className="absolute top-2 left-2 bg-blue-600">deal of the day</Badge>
                </CardContent>
              </Card>

              <Card className="min-w-[250px] overflow-hidden border-none shadow-sm">
                <CardContent className="p-0 relative">
                  <div className="bg-blue-100 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="text-lg font-bold">Bikkgane Biryani</div>
                      <div className="text-sm">BIRYANI FROM</div>
                      <div className="text-sm font-bold">₹169 only</div>
                    </div>
                    <img
                      src="/placeholder.svg?height=80&width=80&text=Biryani"
                      alt="Biryani"
                      className="h-20 w-20 object-cover"
                    />
                  </div>
                  <Badge className="absolute top-2 left-2 bg-blue-600">deal of the day</Badge>
                </CardContent>
              </Card>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Food Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">Eat what makes you happy</h2>
          <div className="grid grid-cols-4 gap-4">
            {foodCategories.map((category) => (
              <div key={category.id} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-1">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-medium text-center">{category.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Restaurants Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Popular Restaurants</h2>
            <Button variant="ghost" size="sm" className="text-sm text-red-500">
              See all
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <p>Loading menu items...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={() => addToCart(item)}
                    onClick={() => handleItemClick(item)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? "No items match your search" : "No items available in this category"}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )

  function OffersView({ onApplyOffer }) {
    const [allOffers, setAllOffers] = useState<Offer[]>([])
    const [offersLoading, setOffersLoading] = useState(true)

    useEffect(() => {
      const fetchAllOffers = async () => {
        try {
          setOffersLoading(true)
          const offers = await getActiveOffers()
          setAllOffers(offers)
        } catch (error) {
          console.error("Error fetching offers:", error)
          setAllOffers([])
        } finally {
          setOffersLoading(false)
        }
      }

      fetchAllOffers()
    }, [])

    return (
      <>
        <header className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="px-4 py-3 flex items-center">
            <h1 className="text-lg font-bold">Offers & Promotions</h1>
          </div>
        </header>

        <main className="flex-1 px-4 py-3">
          {offersLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading offers...</p>
            </div>
          ) : allOffers.length > 0 ? (
            <div className="space-y-4">
              {allOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{offer.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                        <div className="flex items-center mt-2">
                          <Badge className="bg-red-100 text-red-600 border-red-200">{offer.code}</Badge>
                          <span className="text-xs text-gray-500 ml-2">
                            Valid till {new Date(offer.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-2 text-sm">
                          {offer.discountType === "percentage" ? (
                            <span className="text-green-600">
                              {offer.discountValue}% off
                              {offer.maxDiscount > 0 ? ` up to ₹${offer.maxDiscount}` : ""}
                            </span>
                          ) : (
                            <span className="text-green-600">₹{offer.discountValue} off</span>
                          )}
                          {offer.minOrderValue > 0 && (
                            <span className="text-gray-500 ml-2">Min. order: ₹{offer.minOrderValue}</span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => onApplyOffer(offer)}>
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Tag className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium mb-1">No offers available</h3>
              <p className="text-sm text-gray-500">Check back later for new offers</p>
            </div>
          )}
        </main>
      </>
    )
  }

  return (
    <div className="mobile-only-container">
      <div className="mobile-app-wrapper">
        {currentView === "menu" && renderHomeView()}

        {currentView === "offers" && (
          <OffersView
            onApplyOffer={(offer) => {
              handleApplyOfferFromCart(offer)
              setCartOpen(true)
            }}
          />
        )}

        {currentView === "itemDetail" && selectedItem && (
          <ItemDetailView item={selectedItem} onBack={handleBackToMenu} onAddToCart={addToCart} />
        )}

        {currentView === "checkout" && (
          <CheckoutView
            cartItems={cartItems}
            subtotal={getSubtotal()}
            packagingTotal={packagingTotal}
            discountAmount={discountAmount}
            totalAmount={getTotalAmount()}
            offerCode={offerCode}
            setOfferCode={setOfferCode}
            appliedOffer={appliedOffer}
            offerError={offerError}
            onApplyOffer={handleApplyOffer}
            onRemoveOffer={handleRemoveOffer}
            onBack={() => setCurrentView("menu")}
            onPlaceOrder={handlePlaceOrder}
            availableOffers={availableOffers}
            onApplyOfferDirect={handleApplyOfferFromCart}
          />
        )}

        {currentView === "orderConfirmation" && (
          <OrderConfirmationView
            onBackToMenu={() => {
              setCurrentView("menu")
              setOrderPlaced(false)
            }}
          />
        )}

        {currentView === "orders" && <OrdersPage onBack={() => setCurrentView("menu")} customerPhone={customerPhone} />}

        {/* Cart Sheet */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Your Cart</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex-1 overflow-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">Your cart is empty</p>
                  <p className="text-sm text-gray-400">Add items from the menu to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-md mr-3"
                        />
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="flex flex-col">
                            <p className="text-sm text-gray-500">₹{item.price}</p>
                            {item.packagingCharge > 0 && (
                              <p className="text-xs text-gray-400">+₹{item.packagingCharge} packaging</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="mx-2 w-5 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <>
                {/* Available Offers Section */}
                {availableOffers.length > 0 && !appliedOffer && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium text-sm mb-2 flex items-center">
                      <Tag className="h-4 w-4 mr-1 text-green-600" />
                      Available Offers
                    </h4>
                    <div className="space-y-2">
                      {availableOffers.map((offer) => (
                        <div
                          key={offer.id}
                          className="bg-green-50 p-2 rounded border border-green-100 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium text-sm">{offer.name}</div>
                            <div className="text-xs text-gray-600">
                              {offer.discountType === "percentage"
                                ? `${offer.discountValue}% off up to ₹${offer.maxDiscount || "No limit"}`
                                : `₹${offer.discountValue} off`}
                            </div>
                            <div className="text-xs text-gray-500">Code: {offer.code}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-100"
                            onClick={() => handleApplyOfferFromCart(offer)}
                          >
                            Apply
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Applied Offer */}
                {appliedOffer && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-green-600 mr-2" />
                        <div>
                          <div className="font-medium text-green-700">{appliedOffer.code} applied</div>
                          <div className="text-xs text-green-600">You saved ₹{discountAmount}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500"
                        onClick={handleRemoveOffer}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <SheetFooter className="mt-6">
                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="text-gray-500">₹{getSubtotal()}</span>
                      </div>
                      {packagingTotal > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Packaging Charges</span>
                          <span className="text-gray-500">₹{packagingTotal}</span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm text-green-600">
                          <span>Discount</span>
                          <span>-₹{discountAmount}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-medium">Total Amount</span>
                      <span className="font-bold">₹{getTotalAmount()}</span>
                    </div>
                    <Button className="w-full" disabled={cartItems.length === 0} onClick={handleCheckout}>
                      Proceed to Checkout
                    </Button>
                  </div>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Sticky Cart Bar */}
        {showCartBar && currentView === "menu" && (
          <div className="fixed-cart-bar">
            <div className="p-3 flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {getCartItemCount()} item{getCartItemCount() !== 1 ? "s" : ""}
                </div>
                <div className="text-sm text-gray-500">₹{getTotalAmount()}</div>
              </div>
              <Button onClick={() => setCartOpen(true)}>View Cart</Button>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="fixed-bottom-nav">
          <div className="flex justify-between items-center">
            <NavItem
              icon={<Home className="w-5 h-5" />}
              label="Home"
              active={currentView === "menu"}
              onClick={() => setCurrentView("menu")}
            />
            <NavItem
              icon={<ShoppingBag className="w-5 h-5" />}
              label="Orders"
              active={currentView === "orders"}
              onClick={() => setCurrentView("orders")}
            />
            <NavItem
              icon={<Tag className="w-5 h-5" />}
              label="Offers"
              active={currentView === "offers"}
              onClick={() => setCurrentView("offers")}
            />
            <NavItem icon={<Heart className="w-5 h-5" />} label="Favorites" active={false} onClick={() => {}} />
            <NavItem icon={<User className="w-5 h-5" />} label="Profile" active={false} onClick={() => {}} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuItemCard({ item, onAddToCart, onClick }) {
  return (
    <Card className="overflow-hidden" onClick={onClick}>
      <CardContent className="p-3 flex">
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <Badge className={`h-5 w-5 p-0 mr-1 ${item.veg ? "bg-green-500" : "bg-red-500"}`}>
              <span className="sr-only">{item.veg ? "Vegetarian" : "Non-vegetarian"}</span>
            </Badge>
            <h3 className="font-bold text-base">{item.name}</h3>
          </div>
          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-bold">₹{item.price}</span>
              {item.packagingCharge > 0 && (
                <span className="text-xs text-gray-400">+₹{item.packagingCharge} packaging</span>
              )}
            </div>
            <Button
              size="sm"
              className="h-8 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart()
              }}
            >
              Add
            </Button>
          </div>
        </div>
        <div className="ml-3">
          <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

function ItemDetailView({ item, onBack, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)
  const [specialInstructions, setSpecialInstructions] = useState("")

  const handleAddToCart = () => {
    onAddToCart(item, quantity, specialInstructions)
    onBack()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold ml-2">Item Details</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-3">
        <div className="mb-4">
          <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-48 object-cover rounded-lg" />
        </div>

        <div className="flex items-center mb-2">
          <Badge className={`h-5 w-5 p-0 mr-2 ${item.veg ? "bg-green-500" : "bg-red-500"}`}>
            <span className="sr-only">{item.veg ? "Vegetarian" : "Non-vegetarian"}</span>
          </Badge>
          <h2 className="text-xl font-bold">{item.name}</h2>
        </div>

        <p className="text-gray-600 mb-4">{item.description}</p>

        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-lg font-bold">₹{item.price}</span>
            {item.packagingCharge > 0 && (
              <span className="text-xs text-gray-500">+₹{item.packagingCharge} packaging</span>
            )}
          </div>
          <div className="flex items-center border rounded-full overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="special-instructions">Special Instructions</Label>
          <Textarea
            id="special-instructions"
            placeholder="Any special requests for this item?"
            className="mt-1"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
          />
        </div>

        <Button className="w-full" onClick={handleAddToCart}>
          Add to Cart - ₹{(item.price + (item.packagingCharge || 0)) * quantity}
        </Button>
      </main>
    </div>
  )
}

function CheckoutView({
  cartItems,
  subtotal,
  packagingTotal,
  discountAmount,
  totalAmount,
  offerCode,
  setOfferCode,
  appliedOffer,
  offerError,
  onApplyOffer,
  onRemoveOffer,
  onBack,
  onPlaceOrder,
  availableOffers,
  onApplyOfferDirect,
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load saved customer info from localStorage
  useEffect(() => {
    const savedPhone = localStorage.getItem("customerPhone")
    const savedName = localStorage.getItem("customerName")
    const savedAddress = localStorage.getItem("customerAddress")

    if (savedPhone) setPhone(savedPhone)
    if (savedName) setName(savedName)
    if (savedAddress) setAddress(savedAddress)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Save customer info to localStorage for future use
    localStorage.setItem("customerPhone", phone)
    localStorage.setItem("customerName", name)
    localStorage.setItem("customerAddress", address)

    const customerData = {
      name,
      phone,
      address,
    }

    // Call the onPlaceOrder function with customer data
    onPlaceOrder(customerData).catch((error) => {
      console.error("Error in order submission:", error)
      setIsSubmitting(false)
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold ml-2">Checkout</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-3">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Delivery Details</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address</Label>
              <Textarea
                id="address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your complete delivery address"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Order Summary</h2>

            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity} x {item.name}
                  </span>
                  <div className="text-right">
                    <span>₹{item.price * item.quantity}</span>
                    {item.packagingCharge > 0 && (
                      <div className="text-xs text-gray-500">+₹{item.packagingCharge * item.quantity} packaging</div>
                    )}
                  </div>
                </div>
              ))}

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {packagingTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Packaging Charges</span>
                    <span>₹{packagingTotal}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold mt-2">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Offer Code Section */}
            <div className="space-y-2 bg-gray-50 p-3 rounded-md">
              <Label htmlFor="offer-code">Apply Offer Code</Label>
              {appliedOffer ? (
                <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 text-green-600 mr-2" />
                    <div>
                      <div className="font-medium text-green-700">{appliedOffer.code}</div>
                      <div className="text-xs text-green-600">
                        {appliedOffer.discountType === "percentage"
                          ? `${appliedOffer.discountValue}% off`
                          : `₹${appliedOffer.discountValue} off`}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500" onClick={onRemoveOffer}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      id="offer-code"
                      placeholder="Enter offer code"
                      value={offerCode}
                      onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                    />
                    <Button type="button" onClick={onApplyOffer}>
                      Apply
                    </Button>
                  </div>

                  {/* Available Offers */}
                  {availableOffers.length > 0 && (
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-2 flex items-center">
                        <Tag className="h-4 w-4 mr-1 text-green-600" />
                        Available Offers
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availableOffers.map((offer) => (
                          <div
                            key={offer.id}
                            className="bg-green-50 p-2 rounded border border-green-100 flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium text-sm">{offer.name}</div>
                              <div className="text-xs text-gray-600">
                                {offer.discountType === "percentage"
                                  ? `${offer.discountValue}% off up to ₹${offer.maxDiscount || "No limit"}`
                                  : `₹${offer.discountValue} off`}
                              </div>
                              <div className="text-xs text-gray-500">Code: {offer.code}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-100"
                              onClick={() => onApplyOfferDirect(offer)}
                            >
                              Apply
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {offerError && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>{offerError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Payment Method</h2>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="cash"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                  className="mr-2"
                />
                <Label htmlFor="cash">Cash on Delivery</Label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="online"
                  name="payment"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                  className="mr-2"
                />
                <Label htmlFor="online">Online Payment</Label>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Place Order"}
          </Button>
        </form>
      </main>
    </div>
  )
}

function OrderConfirmationView({ onBackToMenu }) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 px-4 py-8 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-6">Your delicious food is being prepared and will be delivered soon.</p>

        <div className="bg-gray-100 w-full rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <Clock className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-gray-700">Estimated delivery time: 30-45 minutes</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-gray-700">Track your order in the Orders tab</span>
          </div>
        </div>

        <Button onClick={onBackToMenu}>Back to Menu</Button>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active = false, onClick }) {
  return (
    <div className={`flex flex-col items-center ${active ? "text-red-500" : "text-gray-500"}`} onClick={onClick}>
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </div>
  )
}

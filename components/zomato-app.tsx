"use client"

import { useState } from "react"
import {
  Search,
  MapPin,
  ChevronDown,
  Filter,
  Clock,
  Star,
  Percent,
  Home,
  Compass,
  ShoppingBag,
  Heart,
  User,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export function ZomatoApp() {
  const [activeTab, setActiveTab] = useState("delivery")

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="container px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="ml-1 font-medium">Bangalore</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input className="pl-9 bg-gray-100 border-none" placeholder="Search for restaurant, cuisine or a dish" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="delivery" className="w-full" onValueChange={setActiveTab}>
          <div className="container px-4">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-0 mb-2">
              <TabsTrigger
                value="delivery"
                className={cn(
                  "py-2 rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent",
                  activeTab === "delivery" ? "border-b-2 border-red-500 text-red-500" : "text-gray-500",
                )}
              >
                Delivery
              </TabsTrigger>
              <TabsTrigger
                value="dining"
                className={cn(
                  "py-2 rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent",
                  activeTab === "dining" ? "border-b-2 border-red-500 text-red-500" : "text-gray-500",
                )}
              >
                Dining Out
              </TabsTrigger>
              <TabsTrigger
                value="nightlife"
                className={cn(
                  "py-2 rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent",
                  activeTab === "nightlife" ? "border-b-2 border-red-500 text-red-500" : "text-gray-500",
                )}
              >
                Nightlife
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </header>

      <main className="flex-1 container px-4 py-4">
        <Tabs defaultValue="delivery" className="w-full">
          <TabsContent value="delivery" className="mt-0">
            {/* Filters */}
            <div className="mb-6">
              <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-1 rounded-full border-gray-300">
                    <Filter className="w-3 h-3" />
                    <span>Filters</span>
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full border-gray-300">
                    Rating: 4.0+
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full border-gray-300">
                    Safe and Hygienic
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full border-gray-300">
                    Pure Veg
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full border-gray-300">
                    Delivery Time
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full border-gray-300">
                    Great Offers
                  </Button>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            {/* Food Categories */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4">Eat what makes you happy</h2>
              <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex gap-6">
                  {["Pizza", "Burger", "Biryani", "Rolls", "Cake", "Chinese", "North Indian", "South Indian"].map(
                    (category) => (
                      <div key={category} className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                          <img
                            src={`/placeholder.svg?height=64&width=64&text=${category}`}
                            alt={category}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-medium">{category}</span>
                      </div>
                    ),
                  )}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            {/* Restaurant List */}
            <div>
              <h2 className="text-lg font-bold mb-4">Delivery Restaurants in Bangalore</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <RestaurantCard key={item} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dining" className="mt-0">
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-500">Dining Out content would appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="nightlife" className="mt-0">
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-500">Nightlife content would appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 py-2">
        <div className="container flex justify-between items-center">
          <NavItem icon={<Home className="w-5 h-5" />} label="Home" active />
          <NavItem icon={<Compass className="w-5 h-5" />} label="Explore" />
          <NavItem icon={<ShoppingBag className="w-5 h-5" />} label="Orders" />
          <NavItem icon={<Heart className="w-5 h-5" />} label="Favorites" />
          <NavItem icon={<User className="w-5 h-5" />} label="Profile" />
        </div>
      </div>
    </div>
  )
}

function RestaurantCard() {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <div className="relative">
        <img
          src="/placeholder.svg?height=200&width=400&text=Restaurant"
          alt="Restaurant"
          className="w-full h-48 object-cover"
        />
        <Badge className="absolute top-3 left-3 bg-blue-700">50% OFF up to ₹100</Badge>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between">
          <Badge className="bg-gray-800/80">30-40 min</Badge>
          <Badge className="bg-gray-800/80">₹150 for two</Badge>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-base">Burger King</h3>
            <p className="text-sm text-gray-500">Burgers, American, Fast Food</p>
          </div>
          <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-sm">
            <span className="font-bold">4.2</span>
            <Star className="w-3 h-3 fill-white" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex items-center gap-2 text-xs text-gray-500">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          <span>30-40 min</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-gray-400"></div>
        <div className="flex items-center">
          <Percent className="w-3 h-3 mr-1 text-red-500" />
          <span className="text-red-500">50% OFF up to ₹100</span>
        </div>
      </CardFooter>
    </Card>
  )
}

function NavItem({ icon, label, active = false }) {
  return (
    <div className={`flex flex-col items-center ${active ? "text-red-500" : "text-gray-500"}`}>
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </div>
  )
}

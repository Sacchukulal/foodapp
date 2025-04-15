export interface MenuItem {
  id?: string
  name: string
  description: string
  price: number
  image: string
  category: string
  veg: boolean
  available: boolean
  rating?: number
  orderCount?: number
  packagingCharge?: number
}

export interface Order {
  id?: string
  customer: {
    id: string
    name: string
    phone: string
    email?: string
    address: string
  }
  items: {
    id: string
    name: string
    quantity: number
    price: number
    packagingCharge?: number
  }[]
  total: number
  status: "Pending" | "Preparing" | "On the way" | "Delivered" | "Cancelled"
  createdAt: Date
  updatedAt: Date
  packagingTotal?: number
  appliedOffers?: string[]
  discountAmount?: number
}

export interface Customer {
  id?: string
  name: string
  phone: string
  email?: string
  address: string
  orders?: number
  totalSpent?: number
  lastOrder?: Date
}

export interface Review {
  id?: string
  customerId: string
  customerName: string
  menuItemId: string
  menuItemName: string
  rating: number
  comment: string
  createdAt: Date
  replied: boolean
  reply?: string
  replyDate?: Date
}

export interface Offer {
  id?: string
  name: string
  code: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minOrderValue: number
  maxDiscount?: number
  applicableItems: "all" | string[] // "all" or array of item IDs
  startDate: Date
  endDate: Date
  active: boolean
  usageCount?: number
  createdAt: Date
}

export interface PackagingCharge {
  id?: string
  name: string
  applicableType: "category" | "item" | "all"
  applicableTo: string[] | "all" // category names, item IDs, or "all"
  chargeType: "fixed" | "percentage"
  chargeValue: number
  active: boolean
  createdAt: Date
}

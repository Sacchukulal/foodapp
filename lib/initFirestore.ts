import { db } from "./firebase"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import type { MenuItem, Order, Customer, Review } from "./models"

// This function can be run once to initialize your Firestore database with sample data
export async function initializeFirestore() {
  try {
    // Add menu items
    const menuItems: MenuItem[] = [
      {
        name: "Paneer Tikka",
        description: "Marinated cottage cheese grilled to perfection",
        price: 250,
        image: "/placeholder.svg?height=80&width=80&text=Paneer%20Tikka",
        category: "starters",
        veg: true,
        available: true,
        rating: 4.5,
        orderCount: 120,
      },
      {
        name: "Butter Chicken",
        description: "Tender chicken in a rich buttery tomato sauce",
        price: 350,
        image: "/placeholder.svg?height=80&width=80&text=Butter%20Chicken",
        category: "main",
        veg: false,
        available: true,
        rating: 4.8,
        orderCount: 200,
      },
      {
        name: "Veg Biryani",
        description: "Fragrant rice cooked with mixed vegetables and spices",
        price: 280,
        image: "/placeholder.svg?height=80&width=80&text=Veg%20Biryani",
        category: "main",
        veg: true,
        available: true,
        rating: 4.3,
        orderCount: 150,
      },
      {
        name: "Gulab Jamun",
        description: "Sweet milk solids balls soaked in sugar syrup",
        price: 120,
        image: "/placeholder.svg?height=80&width=80&text=Gulab%20Jamun",
        category: "desserts",
        veg: true,
        available: true,
        rating: 4.7,
        orderCount: 180,
      },
      {
        name: "Mango Lassi",
        description: "Refreshing yogurt drink with mango pulp",
        price: 100,
        image: "/placeholder.svg?height=80&width=80&text=Mango%20Lassi",
        category: "beverages",
        veg: true,
        available: true,
        rating: 4.6,
        orderCount: 160,
      },
      {
        name: "Chicken Tikka",
        description: "Marinated chicken pieces grilled in tandoor",
        price: 280,
        image: "/placeholder.svg?height=80&width=80&text=Chicken%20Tikka",
        category: "starters",
        veg: false,
        available: false,
        rating: 4.4,
        orderCount: 130,
      },
    ]

    const menuItemsCollection = collection(db, "menuItems")
    const menuItemIds = []

    for (const item of menuItems) {
      const docRef = await addDoc(menuItemsCollection, item)
      menuItemIds.push({ id: docRef.id, name: item.name, price: item.price })
    }

    // Add customers
    const customers: Customer[] = [
      {
        name: "Rahul Sharma",
        phone: "+91 98765 43210",
        email: "rahul.s@example.com",
        address: "123 Main St, Bangalore",
        orders: 12,
        totalSpent: 6540,
        lastOrder: new Date(),
      },
      {
        name: "Priya Patel",
        phone: "+91 87654 32109",
        email: "priya.p@example.com",
        address: "456 Park Ave, Bangalore",
        orders: 8,
        totalSpent: 4320,
        lastOrder: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      },
      {
        name: "Amit Kumar",
        phone: "+91 76543 21098",
        email: "amit.k@example.com",
        address: "789 Lake View, Bangalore",
        orders: 15,
        totalSpent: 8750,
        lastOrder: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        name: "Neha Singh",
        phone: "+91 65432 10987",
        email: "neha.s@example.com",
        address: "101 Hill Road, Bangalore",
        orders: 5,
        totalSpent: 2800,
        lastOrder: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      },
      {
        name: "Vikram Reddy",
        phone: "+91 54321 09876",
        email: "vikram.r@example.com",
        address: "202 Valley View, Bangalore",
        orders: 20,
        totalSpent: 12500,
        lastOrder: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ]

    const customersCollection = collection(db, "customers")
    const customerIds = []

    for (const customer of customers) {
      const customerData = {
        ...customer,
        lastOrder: Timestamp.fromDate(customer.lastOrder),
      }
      const docRef = await addDoc(customersCollection, customerData)
      customerIds.push({ id: docRef.id, name: customer.name })
    }

    // Add orders
    const orders: Omit<Order, "id">[] = [
      {
        customer: {
          id: customerIds[0].id,
          name: customerIds[0].name,
          phone: "+91 98765 43210",
          address: "123 Main St, Bangalore",
        },
        items: [
          { id: menuItemIds[1].id, name: menuItemIds[1].name, quantity: 1, price: menuItemIds[1].price },
          { id: menuItemIds[4].id, name: menuItemIds[4].name, quantity: 2, price: menuItemIds[4].price },
        ],
        total: menuItemIds[1].price + menuItemIds[4].price * 2,
        status: "Delivered",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        customer: {
          id: customerIds[1].id,
          name: customerIds[1].name,
          phone: "+91 87654 32109",
          address: "456 Park Ave, Bangalore",
        },
        items: [
          { id: menuItemIds[0].id, name: menuItemIds[0].name, quantity: 1, price: menuItemIds[0].price },
          { id: menuItemIds[2].id, name: menuItemIds[2].name, quantity: 1, price: menuItemIds[2].price },
        ],
        total: menuItemIds[0].price + menuItemIds[2].price,
        status: "Preparing",
        createdAt: new Date(Date.now() - 50 * 60 * 1000), // 50 minutes ago
        updatedAt: new Date(Date.now() - 50 * 60 * 1000), // 50 minutes ago
      },
      {
        customer: {
          id: customerIds[2].id,
          name: customerIds[2].name,
          phone: "+91 76543 21098",
          address: "789 Lake View, Bangalore",
        },
        items: [
          { id: menuItemIds[5].id, name: menuItemIds[5].name, quantity: 1, price: menuItemIds[5].price },
          { id: menuItemIds[3].id, name: menuItemIds[3].name, quantity: 2, price: menuItemIds[3].price },
        ],
        total: menuItemIds[5].price + menuItemIds[3].price * 2,
        status: "On the way",
        createdAt: new Date(Date.now() - 75 * 60 * 1000), // 75 minutes ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    ]

    const ordersCollection = collection(db, "orders")

    for (const order of orders) {
      const orderData = {
        ...order,
        createdAt: Timestamp.fromDate(order.createdAt),
        updatedAt: Timestamp.fromDate(order.updatedAt),
      }
      await addDoc(ordersCollection, orderData)
    }

    // Add reviews
    const reviews: Omit<Review, "id">[] = [
      {
        customerId: customerIds[0].id,
        customerName: customerIds[0].name,
        menuItemId: menuItemIds[1].id,
        menuItemName: menuItemIds[1].name,
        rating: 5,
        comment:
          "The food was absolutely delicious! The Butter Chicken was rich and flavorful, and the naan was perfectly cooked. Delivery was also very prompt.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        replied: true,
        reply: "Thank you for your feedback! We're glad you enjoyed our Butter Chicken.",
        replyDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        customerId: customerIds[1].id,
        customerName: customerIds[1].name,
        menuItemId: menuItemIds[0].id,
        menuItemName: menuItemIds[0].name,
        rating: 4,
        comment:
          "Really enjoyed the Paneer Tikka. It was well marinated and grilled perfectly. The delivery was a bit delayed though.",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        replied: false,
      },
      {
        customerId: customerIds[2].id,
        customerName: customerIds[2].name,
        menuItemId: menuItemIds[2].id,
        menuItemName: menuItemIds[2].name,
        rating: 3,
        comment: "The Veg Biryani was good but could use more spices. The portion size was generous though.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        replied: true,
        reply: "Thank you for your feedback. We'll consider adjusting our spice levels.",
        replyDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ]

    const reviewsCollection = collection(db, "reviews")

    for (const review of reviews) {
      const reviewData = {
        ...review,
        createdAt: Timestamp.fromDate(review.createdAt),
        replyDate: review.replyDate ? Timestamp.fromDate(review.replyDate) : null,
      }
      await addDoc(reviewsCollection, reviewData)
    }

    console.log("Firestore initialized with sample data!")
    return { success: true }
  } catch (error) {
    console.error("Error initializing Firestore:", error)
    return { success: false, error }
  }
}

import { supabase } from "./supabase"
import type { MenuItem, Customer } from "./models"

// This function can be run once to initialize your Supabase database with sample data
export async function initializeSupabase() {
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

    const { data: menuItemsData, error: menuItemsError } = await supabase
      .from("menu_items")
      .insert(
        menuItems.map((item) => ({
          name: item.name,
          description: item.description,
          price: item.price,
          image_url: item.image,
          category: item.category,
          veg: item.veg,
          available: item.available,
          rating: item.rating,
          order_count: item.orderCount,
        })),
      )
      .select()

    if (menuItemsError) {
      throw menuItemsError
    }

    const menuItemIds = menuItemsData.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
    }))

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

    const { data: customersData, error: customersError } = await supabase
      .from("customers")
      .insert(
        customers.map((customer) => ({
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          orders: customer.orders,
          total_spent: customer.totalSpent,
          last_order: customer.lastOrder.toISOString(),
        })),
      )
      .select()

    if (customersError) {
      throw customersError
    }

    const customerIds = customersData.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
    }))

    // Add orders and order items
    for (let i = 0; i < 3; i++) {
      const customer = customerIds[i]
      const orderItems = [
        {
          menu_item_id: menuItemIds[i].id,
          name: menuItemIds[i].name,
          quantity: 1,
          price: menuItemIds[i].price,
        },
        {
          menu_item_id: menuItemIds[(i + 3) % 6].id,
          name: menuItemIds[(i + 3) % 6].name,
          quantity: 2,
          price: menuItemIds[(i + 3) % 6].price,
        },
      ]

      const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

      const status = i === 0 ? "Delivered" : i === 1 ? "Preparing" : "On the way"
      const createdAt = new Date(Date.now() - (2 - i) * 60 * 60 * 1000) // Staggered times

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_id: customer.id,
            customer_name: customer.name,
            customer_phone: customer.phone,
            customer_address: customer.address,
            total: total,
            status: status,
            created_at: createdAt.toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()

      if (orderError) {
        throw orderError
      }

      const orderId = orderData[0].id

      // Insert order items
      const { error: orderItemsError } = await supabase.from("order_items").insert(
        orderItems.map((item) => ({
          order_id: orderId,
          ...item,
        })),
      )

      if (orderItemsError) {
        throw orderItemsError
      }
    }

    // Add reviews
    const reviews = [
      {
        customer_id: customerIds[0].id,
        customer_name: customerIds[0].name,
        menu_item_id: menuItemIds[1].id,
        menu_item_name: menuItemIds[1].name,
        rating: 5,
        comment:
          "The food was absolutely delicious! The Butter Chicken was rich and flavorful, and the naan was perfectly cooked. Delivery was also very prompt.",
        replied: true,
        reply: "Thank you for your feedback! We're glad you enjoyed our Butter Chicken.",
        reply_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        customer_id: customerIds[1].id,
        customer_name: customerIds[1].name,
        menu_item_id: menuItemIds[0].id,
        menu_item_name: menuItemIds[0].name,
        rating: 4,
        comment:
          "Really enjoyed the Paneer Tikka. It was well marinated and grilled perfectly. The delivery was a bit delayed though.",
        replied: false,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        customer_id: customerIds[2].id,
        customer_name: customerIds[2].name,
        menu_item_id: menuItemIds[2].id,
        menu_item_name: menuItemIds[2].name,
        rating: 3,
        comment: "The Veg Biryani was good but could use more spices. The portion size was generous though.",
        replied: true,
        reply: "Thank you for your feedback. We'll consider adjusting our spice levels.",
        reply_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    const { error: reviewsError } = await supabase.from("reviews").insert(reviews)

    if (reviewsError) {
      throw reviewsError
    }

    // Add offers
    const offers = [
      {
        name: "Welcome Offer",
        code: "WELCOME20",
        description: "20% off on your first order",
        discount_type: "percentage",
        discount_value: 20,
        min_order_value: 300,
        max_discount: 200,
        applicable_items: "all",
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        usage_count: 45,
      },
      {
        name: "Weekend Special",
        code: "WEEKEND10",
        description: "10% off on all orders during weekends",
        discount_type: "percentage",
        discount_value: 10,
        min_order_value: 500,
        max_discount: 150,
        applicable_items: "all",
        start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        usage_count: 28,
      },
    ]

    const { error: offersError } = await supabase.from("offers").insert(offers)

    if (offersError) {
      throw offersError
    }

    // Add packaging charges
    const packagingCharges = [
      {
        name: "Standard Packaging",
        applicable_type: "all",
        applicable_to: "all",
        charge_type: "fixed",
        charge_value: 10,
        active: true,
      },
      {
        name: "Premium Packaging",
        applicable_type: "category",
        applicable_to: JSON.stringify(["main"]),
        charge_type: "fixed",
        charge_value: 20,
        active: true,
      },
    ]

    const { error: packagingError } = await supabase.from("packaging_charges").insert(packagingCharges)

    if (packagingError) {
      throw packagingError
    }

    console.log("Supabase initialized with sample data!")
    return { success: true }
  } catch (error) {
    console.error("Error initializing Supabase:", error)
    return { success: false, error }
  }
}

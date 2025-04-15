import { supabase, createServerSupabaseClient } from "../supabase"
import type { Order } from "../models"

export const getOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items:order_items(*)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    throw error
  }

  // Transform the data to match our model
  return data.map((order) => ({
    id: order.id,
    customer: {
      id: order.customer_id,
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      address: order.customer_address,
    },
    items: order.order_items.map((item) => ({
      id: item.menu_item_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      packagingCharge: item.packaging_charge,
    })),
    total: order.total,
    status: order.status,
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at),
    packagingTotal: order.packaging_total,
    discountAmount: order.discount_amount,
  })) as Order[]
}

export const getOrdersByStatus = async (status: Order["status"]): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items:order_items(*)
    `)
    .eq("status", status)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(`Error fetching orders by status ${status}:`, error)
    throw error
  }

  // Transform the data to match our model
  return data.map((order) => ({
    id: order.id,
    customer: {
      id: order.customer_id,
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      address: order.customer_address,
    },
    items: order.order_items.map((item) => ({
      id: item.menu_item_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      packagingCharge: item.packaging_charge,
    })),
    total: order.total,
    status: order.status,
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at),
    packagingTotal: order.packaging_total,
    discountAmount: order.discount_amount,
  })) as Order[]
}

export const getOrdersByCustomer = async (customerPhone: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items:order_items(*)
    `)
    .eq("customer_phone", customerPhone)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(`Error fetching orders by customer phone ${customerPhone}:`, error)
    throw error
  }

  // Transform the data to match our model
  return data.map((order) => ({
    id: order.id,
    customer: {
      id: order.customer_id,
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      address: order.customer_address,
    },
    items: order.order_items.map((item) => ({
      id: item.menu_item_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      packagingCharge: item.packaging_charge,
    })),
    total: order.total,
    status: order.status,
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at),
    packagingTotal: order.packaging_total,
    discountAmount: order.discount_amount,
  })) as Order[]
}

export const getOrder = async (id: string): Promise<Order | null> => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items:order_items(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Error fetching order ${id}:`, error)
    return null
  }

  // Transform the data to match our model
  return {
    id: data.id,
    customer: {
      id: data.customer_id,
      name: data.customer_name,
      phone: data.customer_phone,
      email: data.customer_email,
      address: data.customer_address,
    },
    items: data.order_items.map((item) => ({
      id: item.menu_item_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      packagingCharge: item.packaging_charge,
    })),
    total: data.total,
    status: data.status,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    packagingTotal: data.packaging_total,
    discountAmount: data.discount_amount,
  } as Order
}

export const addOrder = async (order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  // Start a transaction
  const supabaseClient = createServerSupabaseClient()

  // Begin transaction
  const { error: txnError } = await supabaseClient.rpc("begin_transaction")
  if (txnError) {
    console.error("Error beginning transaction:", txnError)
    throw txnError
  }

  try {
    // Insert order
    const { data: orderData, error: orderError } = await supabaseClient
      .from("orders")
      .insert([
        {
          customer_id: order.customer.id,
          customer_name: order.customer.name,
          customer_phone: order.customer.phone,
          customer_email: order.customer.email,
          customer_address: order.customer.address,
          total: order.total,
          status: order.status,
          packaging_total: order.packagingTotal || 0,
          discount_amount: order.discountAmount || 0,
        },
      ])
      .select()

    if (orderError) {
      throw orderError
    }

    const orderId = orderData[0].id

    // Insert order items
    const orderItems = order.items.map((item) => ({
      order_id: orderId,
      menu_item_id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      packaging_charge: item.packagingCharge || 0,
    }))

    const { error: itemsError } = await supabaseClient.from("order_items").insert(orderItems)

    if (itemsError) {
      throw itemsError
    }

    // Insert applied offers if any
    if (order.appliedOffers && order.appliedOffers.length > 0) {
      // For simplicity, we're just storing the offer code
      // In a real app, you'd want to look up the offer ID
      const { error: offersError } = await supabaseClient.from("applied_offers").insert(
        order.appliedOffers.map((offerCode) => ({
          order_id: orderId,
          offer_code: offerCode,
        })),
      )

      if (offersError) {
        throw offersError
      }
    }

    // Update customer's order count and total spent
    const { error: customerError } = await supabaseClient.rpc("update_customer_after_order", {
      customer_id_param: order.customer.id,
      order_total: order.total,
    })

    if (customerError) {
      throw customerError
    }

    // Commit transaction
    const { error: commitError } = await supabaseClient.rpc("commit_transaction")
    if (commitError) {
      throw commitError
    }

    return orderId
  } catch (error) {
    // Rollback transaction on error
    await supabaseClient.rpc("rollback_transaction")
    console.error("Error adding order:", error)
    throw error
  }
}

export const updateOrderStatus = async (id: string, status: Order["status"]): Promise<void> => {
  const { error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error(`Error updating order status ${id}:`, error)
    throw error
  }
}

export const getRecentOrders = async (limitCount = 5): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items:order_items(*)
    `)
    .order("created_at", { ascending: false })
    .limit(limitCount)

  if (error) {
    console.error("Error fetching recent orders:", error)
    throw error
  }

  // Transform the data to match our model
  return data.map((order) => ({
    id: order.id,
    customer: {
      id: order.customer_id,
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      address: order.customer_address,
    },
    items: order.order_items.map((item) => ({
      id: item.menu_item_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      packagingCharge: item.packaging_charge,
    })),
    total: order.total,
    status: order.status,
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at),
    packagingTotal: order.packaging_total,
    discountAmount: order.discount_amount,
  })) as Order[]
}

export const getTotalOrders = async (): Promise<number> => {
  const { count, error } = await supabase.from("orders").select("*", { count: "exact", head: true })

  if (error) {
    console.error("Error counting total orders:", error)
    throw error
  }

  return count || 0
}

export const getTotalRevenue = async (): Promise<number> => {
  const { data, error } = await supabase.from("orders").select("total")

  if (error) {
    console.error("Error calculating total revenue:", error)
    throw error
  }

  return data.reduce((sum, order) => sum + order.total, 0)
}

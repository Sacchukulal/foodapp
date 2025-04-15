import { supabase } from "../supabase"
import type { Customer } from "../models"

export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase.from("customers").select("*").order("name")

  if (error) {
    console.error("Error fetching customers:", error)
    throw error
  }

  return data as Customer[]
}

export const getCustomer = async (id: string): Promise<Customer | null> => {
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching customer ${id}:`, error)
    return null
  }

  return data as Customer
}

export const addCustomer = async (customer: Omit<Customer, "id">): Promise<string> => {
  const { data, error } = await supabase.from("customers").insert([customer]).select()

  if (error) {
    console.error("Error adding customer:", error)
    throw error
  }

  return data[0].id
}

export const updateCustomer = async (id: string, customer: Partial<Customer>): Promise<void> => {
  const { error } = await supabase.from("customers").update(customer).eq("id", id)

  if (error) {
    console.error(`Error updating customer ${id}:`, error)
    throw error
  }
}

export const getActiveCustomers = async (): Promise<number> => {
  const { count, error } = await supabase.from("customers").select("*", { count: "exact", head: true }).gt("orders", 0)

  if (error) {
    console.error("Error counting active customers:", error)
    throw error
  }

  return count || 0
}

export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
  const { data, error } = await supabase.from("customers").select("*").eq("phone", phone).single()

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - not an error for our use case
      return null
    }
    console.error(`Error fetching customer by phone ${phone}:`, error)
    return null
  }

  return data as Customer
}

import { supabase } from "../supabase"
import type { Offer } from "../models"

export const getOffers = async (): Promise<Offer[]> => {
  const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching offers:", error)
    throw error
  }

  return data.map((offer) => ({
    id: offer.id,
    name: offer.name,
    code: offer.code,
    description: offer.description,
    discountType: offer.discount_type as "percentage" | "fixed",
    discountValue: offer.discount_value,
    minOrderValue: offer.min_order_value,
    maxDiscount: offer.max_discount,
    applicableItems: offer.applicable_items,
    startDate: new Date(offer.start_date),
    endDate: new Date(offer.end_date),
    active: offer.active,
    usageCount: offer.usage_count,
    createdAt: new Date(offer.created_at),
  })) as Offer[]
}

export const getActiveOffers = async (): Promise<Offer[]> => {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("active", true)
    .lte("start_date", now)
    .gte("end_date", now)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching active offers:", error)
    throw error
  }

  return data.map((offer) => ({
    id: offer.id,
    name: offer.name,
    code: offer.code,
    description: offer.description,
    discountType: offer.discount_type as "percentage" | "fixed",
    discountValue: offer.discount_value,
    minOrderValue: offer.min_order_value,
    maxDiscount: offer.max_discount,
    applicableItems: offer.applicable_items,
    startDate: new Date(offer.start_date),
    endDate: new Date(offer.end_date),
    active: offer.active,
    usageCount: offer.usage_count,
    createdAt: new Date(offer.created_at),
  })) as Offer[]
}

export const getOffer = async (id: string): Promise<Offer | null> => {
  const { data, error } = await supabase.from("offers").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching offer ${id}:`, error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    description: data.description,
    discountType: data.discount_type as "percentage" | "fixed",
    discountValue: data.discount_value,
    minOrderValue: data.min_order_value,
    maxDiscount: data.max_discount,
    applicableItems: data.applicable_items,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    active: data.active,
    usageCount: data.usage_count,
    createdAt: new Date(data.created_at),
  } as Offer
}

export const addOffer = async (offer: Omit<Offer, "id" | "createdAt">): Promise<string> => {
  const { data, error } = await supabase
    .from("offers")
    .insert([
      {
        name: offer.name,
        code: offer.code,
        description: offer.description,
        discount_type: offer.discountType,
        discount_value: offer.discountValue,
        min_order_value: offer.minOrderValue,
        max_discount: offer.maxDiscount || 0,
        applicable_items: offer.applicableItems,
        start_date: offer.startDate.toISOString(),
        end_date: offer.endDate.toISOString(),
        active: offer.active,
        usage_count: offer.usageCount || 0,
      },
    ])
    .select()

  if (error) {
    console.error("Error adding offer:", error)
    throw error
  }

  return data[0].id
}

export const updateOffer = async (id: string, offer: Partial<Offer>): Promise<void> => {
  const updateData: any = {}

  if (offer.name !== undefined) updateData.name = offer.name
  if (offer.code !== undefined) updateData.code = offer.code
  if (offer.description !== undefined) updateData.description = offer.description
  if (offer.discountType !== undefined) updateData.discount_type = offer.discountType
  if (offer.discountValue !== undefined) updateData.discount_value = offer.discountValue
  if (offer.minOrderValue !== undefined) updateData.min_order_value = offer.minOrderValue
  if (offer.maxDiscount !== undefined) updateData.max_discount = offer.maxDiscount
  if (offer.applicableItems !== undefined) updateData.applicable_items = offer.applicableItems
  if (offer.startDate !== undefined) updateData.start_date = offer.startDate.toISOString()
  if (offer.endDate !== undefined) updateData.end_date = offer.endDate.toISOString()
  if (offer.active !== undefined) updateData.active = offer.active
  if (offer.usageCount !== undefined) updateData.usage_count = offer.usageCount

  const { error } = await supabase.from("offers").update(updateData).eq("id", id)

  if (error) {
    console.error(`Error updating offer ${id}:`, error)
    throw error
  }
}

export const deleteOffer = async (id: string): Promise<void> => {
  const { error } = await supabase.from("offers").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting offer ${id}:`, error)
    throw error
  }
}

export const validateOfferCode = async (code: string, orderTotal: number): Promise<Offer | null> => {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("code", code)
    .eq("active", true)
    .lte("start_date", now)
    .gte("end_date", now)
    .lte("min_order_value", orderTotal)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - not an error for our use case
      return null
    }
    console.error(`Error validating offer code ${code}:`, error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    description: data.description,
    discountType: data.discount_type as "percentage" | "fixed",
    discountValue: data.discount_value,
    minOrderValue: data.min_order_value,
    maxDiscount: data.max_discount,
    applicableItems: data.applicable_items,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    active: data.active,
    usageCount: data.usage_count,
    createdAt: new Date(data.created_at),
  } as Offer
}

export const incrementOfferUsage = async (offerId: string): Promise<void> => {
  const { error } = await supabase.rpc("increment_offer_usage", { offer_id_param: offerId })

  if (error) {
    console.error(`Error incrementing offer usage ${offerId}:`, error)
    throw error
  }
}

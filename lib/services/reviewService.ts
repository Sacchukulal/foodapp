import { supabase } from "../supabase"
import type { Review } from "../models"

export const getReviews = async (): Promise<Review[]> => {
  const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching reviews:", error)
    throw error
  }

  return data.map((review) => ({
    id: review.id,
    customerId: review.customer_id,
    customerName: review.customer_name,
    menuItemId: review.menu_item_id,
    menuItemName: review.menu_item_name,
    rating: review.rating,
    comment: review.comment,
    createdAt: new Date(review.created_at),
    replied: review.replied,
    reply: review.reply,
    replyDate: review.reply_date ? new Date(review.reply_date) : undefined,
  })) as Review[]
}

export const getReviewsByRating = async (minRating: number): Promise<Review[]> => {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .gte("rating", minRating)
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error(`Error fetching reviews by rating ${minRating}:`, error)
    throw error
  }

  return data.map((review) => ({
    id: review.id,
    customerId: review.customer_id,
    customerName: review.customer_name,
    menuItemId: review.menu_item_id,
    menuItemName: review.menu_item_name,
    rating: review.rating,
    comment: review.comment,
    createdAt: new Date(review.created_at),
    replied: review.replied,
    reply: review.reply,
    replyDate: review.reply_date ? new Date(review.reply_date) : undefined,
  })) as Review[]
}

export const getPendingReviews = async (): Promise<Review[]> => {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("replied", false)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pending reviews:", error)
    throw error
  }

  return data.map((review) => ({
    id: review.id,
    customerId: review.customer_id,
    customerName: review.customer_name,
    menuItemId: review.menu_item_id,
    menuItemName: review.menu_item_name,
    rating: review.rating,
    comment: review.comment,
    createdAt: new Date(review.created_at),
    replied: review.replied,
    reply: review.reply,
    replyDate: review.reply_date ? new Date(review.reply_date) : undefined,
  })) as Review[]
}

export const getReview = async (id: string): Promise<Review | null> => {
  const { data, error } = await supabase.from("reviews").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching review ${id}:`, error)
    return null
  }

  return {
    id: data.id,
    customerId: data.customer_id,
    customerName: data.customer_name,
    menuItemId: data.menu_item_id,
    menuItemName: data.menu_item_name,
    rating: data.rating,
    comment: data.comment,
    createdAt: new Date(data.created_at),
    replied: data.replied,
    reply: data.reply,
    replyDate: data.reply_date ? new Date(data.reply_date) : undefined,
  } as Review
}

export const addReview = async (review: Omit<Review, "id" | "createdAt" | "replied">): Promise<string> => {
  const { data, error } = await supabase
    .from("reviews")
    .insert([
      {
        customer_id: review.customerId,
        customer_name: review.customerName,
        menu_item_id: review.menuItemId,
        menu_item_name: review.menuItemName,
        rating: review.rating,
        comment: review.comment,
        replied: false,
      },
    ])
    .select()

  if (error) {
    console.error("Error adding review:", error)
    throw error
  }

  return data[0].id
}

export const replyToReview = async (id: string, reply: string): Promise<void> => {
  const { error } = await supabase
    .from("reviews")
    .update({
      reply,
      replied: true,
      reply_date: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error(`Error replying to review ${id}:`, error)
    throw error
  }
}

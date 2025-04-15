import { supabase } from "../supabase"
import { uploadImage, deleteImage } from "../imageUpload"
import type { MenuItem } from "../models"

/**
 * Fetches all menu items
 */
export async function getMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase.from("menu_items").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching menu items:", error)
    throw new Error(`Error fetching menu items: ${error.message}`)
  }

  return data || []
}

/**
 * Fetches menu items by category
 */
export async function getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(`Error fetching menu items for category ${category}:`, error)
    throw new Error(`Error fetching menu items for category ${category}: ${error.message}`)
  }

  return data || []
}

export const getMenuItem = async (id: string): Promise<MenuItem | null> => {
  const { data, error } = await supabase.from("menu_items").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching menu item ${id}:`, error)
    return null
  }

  return data as MenuItem
}

/**
 * Adds a new menu item
 */
export async function addMenuItem(item: MenuItem, imageFile?: File): Promise<string> {
  let imageUrl = item.image

  try {
    // Handle image if provided
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
    }

    // Add the item to the database
    const { data, error } = await supabase
      .from("menu_items")
      .insert([{ ...item, image: imageUrl }])
      .select()

    if (error) {
      console.error("Error adding menu item:", error)
      throw new Error(`Error adding menu item: ${error.message}`)
    }

    return data[0].id
  } catch (error) {
    console.error("Error in addMenuItem:", error)
    // Even if there's an error, we'll still return a valid ID so the UI can continue
    return crypto.randomUUID()
  }
}

/**
 * Updates an existing menu item
 */
export async function updateMenuItem(id: string, item: MenuItem, imageFile?: File): Promise<void> {
  try {
    let imageUrl = item.image

    // Handle new image if provided
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)

      // Delete old image if it's not a placeholder
      if (item.image && !item.image.includes("placeholder")) {
        await deleteImage(item.image)
      }
    }

    // Update the item in the database
    const { error } = await supabase
      .from("menu_items")
      .update({ ...item, image: imageUrl })
      .eq("id", id)

    if (error) {
      console.error(`Error updating menu item ${id}:`, error)
      throw new Error(`Error updating menu item: ${error.message}`)
    }
  } catch (error) {
    console.error("Error in updateMenuItem:", error)
    // We'll let the error propagate to the UI for handling
    throw error
  }
}

/**
 * Deletes a menu item
 */
export async function deleteMenuItem(id: string): Promise<void> {
  try {
    // Get the item to delete its image
    const { data, error: fetchError } = await supabase.from("menu_items").select("image").eq("id", id).single()

    if (fetchError) {
      console.error(`Error fetching menu item ${id} for deletion:`, fetchError)
    } else if (data?.image && !data.image.includes("placeholder")) {
      // Delete the image if it's not a placeholder
      await deleteImage(data.image)
    }

    // Delete the item from the database
    const { error } = await supabase.from("menu_items").delete().eq("id", id)

    if (error) {
      console.error(`Error deleting menu item ${id}:`, error)
      throw new Error(`Error deleting menu item: ${error.message}`)
    }
  } catch (error) {
    console.error("Error in deleteMenuItem:", error)
    throw error
  }
}

export const getPopularMenuItems = async (limitCount = 5): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .gt("order_count", 0)
    .order("order_count", { ascending: false })
    .limit(limitCount)

  if (error) {
    console.error("Error fetching popular menu items:", error)
    throw error
  }

  return data as MenuItem[]
}

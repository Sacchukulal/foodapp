import { supabase } from "../supabase"
import type { PackagingCharge } from "../models"
import { getMenuItems, updateMenuItem } from "./menuService"

export const getPackagingCharges = async (): Promise<PackagingCharge[]> => {
  const { data, error } = await supabase.from("packaging_charges").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching packaging charges:", error)
    throw error
  }

  return data.map((charge) => ({
    id: charge.id,
    name: charge.name,
    applicableType: charge.applicable_type as "category" | "item" | "all",
    applicableTo: charge.applicable_to,
    chargeType: charge.charge_type as "fixed" | "percentage",
    chargeValue: charge.charge_value,
    active: charge.active,
    createdAt: new Date(charge.created_at),
  })) as PackagingCharge[]
}

export const getActivePackagingCharges = async (): Promise<PackagingCharge[]> => {
  const { data, error } = await supabase
    .from("packaging_charges")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching active packaging charges:", error)
    throw error
  }

  return data.map((charge) => ({
    id: charge.id,
    name: charge.name,
    applicableType: charge.applicable_type as "category" | "item" | "all",
    applicableTo: charge.applicable_to,
    chargeType: charge.charge_type as "fixed" | "percentage",
    chargeValue: charge.charge_value,
    active: charge.active,
    createdAt: new Date(charge.created_at),
  })) as PackagingCharge[]
}

export const getPackagingCharge = async (id: string): Promise<PackagingCharge | null> => {
  const { data, error } = await supabase.from("packaging_charges").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching packaging charge ${id}:`, error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    applicableType: data.applicable_type as "category" | "item" | "all",
    applicableTo: data.applicable_to,
    chargeType: data.charge_type as "fixed" | "percentage",
    chargeValue: data.charge_value,
    active: data.active,
    createdAt: new Date(data.created_at),
  } as PackagingCharge
}

export const addPackagingCharge = async (charge: Omit<PackagingCharge, "id" | "createdAt">): Promise<string> => {
  const { data, error } = await supabase
    .from("packaging_charges")
    .insert([
      {
        name: charge.name,
        applicable_type: charge.applicableType,
        applicable_to: charge.applicableTo,
        charge_type: charge.chargeType,
        charge_value: charge.chargeValue,
        active: charge.active,
      },
    ])
    .select()

  if (error) {
    console.error("Error adding packaging charge:", error)
    throw error
  }

  // Apply the packaging charge to menu items
  await applyPackagingChargeToMenuItems(data[0] as PackagingCharge)

  return data[0].id
}

export const updatePackagingCharge = async (id: string, charge: Partial<PackagingCharge>): Promise<void> => {
  const updateData: any = {}

  if (charge.name !== undefined) updateData.name = charge.name
  if (charge.applicableType !== undefined) updateData.applicable_type = charge.applicableType
  if (charge.applicableTo !== undefined) updateData.applicable_to = charge.applicableTo
  if (charge.chargeType !== undefined) updateData.charge_type = charge.chargeType
  if (charge.chargeValue !== undefined) updateData.charge_value = charge.chargeValue
  if (charge.active !== undefined) updateData.active = charge.active

  const { error } = await supabase.from("packaging_charges").update(updateData).eq("id", id)

  if (error) {
    console.error(`Error updating packaging charge ${id}:`, error)
    throw error
  }

  // Get the full updated charge
  const updatedCharge = await getPackagingCharge(id)
  if (updatedCharge) {
    // Apply the updated packaging charge to menu items
    await applyPackagingChargeToMenuItems(updatedCharge)
  }
}

export const deletePackagingCharge = async (id: string): Promise<void> => {
  // Get the charge before deleting
  const charge = await getPackagingCharge(id)

  const { error } = await supabase.from("packaging_charges").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting packaging charge ${id}:`, error)
    throw error
  }

  if (charge) {
    // Remove the packaging charge from menu items
    await removePackagingChargeFromMenuItems(charge)
  }
}

// Helper function to apply packaging charge to menu items
export const applyPackagingChargeToMenuItems = async (charge: PackagingCharge): Promise<void> => {
  if (!charge.active) return

  const menuItems = await getMenuItems()
  const updatePromises: Promise<void>[] = []

  for (const item of menuItems) {
    let shouldApply = false

    if (charge.applicableType === "all" || charge.applicableTo === "all") {
      shouldApply = true
    } else if (charge.applicableType === "category" && Array.isArray(charge.applicableTo)) {
      shouldApply = charge.applicableTo.includes(item.category)
    } else if (charge.applicableType === "item" && Array.isArray(charge.applicableTo)) {
      shouldApply = charge.applicableTo.includes(item.id!)
    }

    if (shouldApply && item.id) {
      let packagingCharge = 0

      if (charge.chargeType === "fixed") {
        packagingCharge = charge.chargeValue
      } else if (charge.chargeType === "percentage") {
        packagingCharge = (item.price * charge.chargeValue) / 100
      }

      updatePromises.push(updateMenuItem(item.id, { packagingCharge }))
    }
  }

  await Promise.all(updatePromises)
}

// Helper function to remove packaging charge from menu items
export const removePackagingChargeFromMenuItems = async (charge: PackagingCharge): Promise<void> => {
  const menuItems = await getMenuItems()
  const updatePromises: Promise<void>[] = []

  for (const item of menuItems) {
    let shouldRemove = false

    if (charge.applicableType === "all" || charge.applicableTo === "all") {
      shouldRemove = true
    } else if (charge.applicableType === "category" && Array.isArray(charge.applicableTo)) {
      shouldRemove = charge.applicableTo.includes(item.category)
    } else if (charge.applicableType === "item" && Array.isArray(charge.applicableTo)) {
      shouldRemove = charge.applicableTo.includes(item.id!)
    }

    if (shouldRemove && item.id) {
      updatePromises.push(updateMenuItem(item.id, { packagingCharge: 0 }))
    }
  }

  await Promise.all(updatePromises)
}

// Apply packaging charges directly to menu items
export const applyPackagingChargeToMenuItem = async (menuItemId: string, packagingCharge: number): Promise<void> => {
  await updateMenuItem(menuItemId, { packagingCharge })
}

// Apply packaging charges to a category of menu items
export const applyPackagingChargeToCategory = async (category: string, packagingCharge: number): Promise<void> => {
  const menuItems = await getMenuItems()
  const updatePromises = menuItems
    .filter((item) => item.category === category && item.id)
    .map((item) => updateMenuItem(item.id!, { packagingCharge }))

  await Promise.all(updatePromises)
}

// Apply bulk packaging charges to multiple menu items
export const applyBulkPackagingCharges = async (menuItemIds: string[], packagingCharge: number): Promise<void> => {
  const updatePromises = menuItemIds.map((id) => updateMenuItem(id, { packagingCharge }))
  await Promise.all(updatePromises)
}

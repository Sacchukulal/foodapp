import { supabase } from "./supabase"

export async function initializeStorage() {
  try {
    // Check if the 'images' bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      throw bucketsError
    }

    const imagesBucketExists = buckets.some((bucket) => bucket.name === "images")

    // If the bucket doesn't exist, create it
    if (!imagesBucketExists) {
      const { error: createError } = await supabase.storage.createBucket("images", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
      })

      if (createError) {
        throw createError
      }

      console.log("Created images bucket")
    }

    return { success: true }
  } catch (error) {
    console.error("Error initializing storage:", error)
    return { success: false, error }
  }
}

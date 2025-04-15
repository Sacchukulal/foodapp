/**
 * Client-side image handling utility
 * Uses local storage and data URLs as a fallback when Supabase storage is unavailable
 */

// Store image data URLs in memory (in a real app, you might use localStorage or IndexedDB)
const localImageStore: Record<string, string> = {}

/**
 * Generates a unique ID for images
 */
function generateUniqueId(): string {
  return `img_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
}

/**
 * Creates a data URL from a file
 */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads an image (stores locally if Supabase storage is unavailable)
 * @param file The file to upload
 * @param path The storage path (unused in local mode)
 * @returns The URL of the "uploaded" image
 */
export async function uploadImage(file: File, path = "menu-items"): Promise<string> {
  try {
    // Generate a unique ID for this image
    const imageId = generateUniqueId()

    // Convert the file to a data URL
    const dataUrl = await fileToDataUrl(file)

    // Store the data URL in our local store
    localImageStore[imageId] = dataUrl

    // Return the data URL directly
    return dataUrl
  } catch (error) {
    console.error("Error handling image:", error)
    // Return a placeholder image URL as fallback
    return createPlaceholderImage(file.name)
  }
}

/**
 * Creates a placeholder image URL
 * @param name Text to display on the placeholder
 * @returns Placeholder image URL
 */
function createPlaceholderImage(name = "Image"): string {
  return `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(name)}`
}

/**
 * Deletes an image (from local storage if using the fallback)
 * @param url The URL of the image to delete
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    // Check if it's a placeholder image
    if (url.includes("/placeholder.svg")) {
      return // No need to delete placeholder images
    }

    // Check if it's a data URL (our local storage)
    if (url.startsWith("data:")) {
      // Find and remove from local storage
      const imageId = Object.keys(localImageStore).find((key) => localImageStore[key] === url)
      if (imageId) {
        delete localImageStore[imageId]
      }
      return
    }

    // If it's a Supabase URL, we'll just log it since we can't delete it
    console.log("Skipping delete for image URL:", url)
  } catch (error) {
    console.error("Error deleting image:", error)
  }
}

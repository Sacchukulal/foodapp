import { NextResponse } from "next/server"
import { initializeSupabase } from "@/lib/initSupabase"
import { initializeStorage } from "@/lib/initStorage"

export async function GET() {
  try {
    // Initialize storage bucket
    const storageResult = await initializeStorage()
    if (!storageResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: storageResult.error,
        },
        { status: 500 },
      )
    }

    // Initialize database
    const dbResult = await initializeSupabase()

    return NextResponse.json({
      success: dbResult.success,
      storage: storageResult.success,
      error: dbResult.success ? null : dbResult.error,
    })
  } catch (error) {
    console.error("Error initializing:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

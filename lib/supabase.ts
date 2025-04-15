import { createClient } from "@supabase/supabase-js"

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Create a mock client for when Supabase credentials are missing
const createMockClient = () => {
  console.warn("Using mock Supabase client. Some features may not work properly.")

  // Return a mock client with the same interface but no-op functions
  return {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
      order: () => ({ data: [], error: null }),
      limit: () => ({ data: [], error: null }),
      gt: () => ({ data: [], error: null }),
      gte: () => ({ data: [], error: null }),
      lt: () => ({ data: [], error: null }),
      lte: () => ({ data: [], error: null }),
    }),
    storage: {
      from: () => ({
        upload: () => ({ data: { path: "" }, error: null }),
        download: () => ({ data: new Blob(), error: null }),
        remove: () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        list: () => ({ data: [], error: null }),
      }),
      listBuckets: () => ({ data: [], error: null }),
      createBucket: () => ({ data: null, error: null }),
    },
    auth: {
      signInWithPassword: () => ({ data: null, error: null }),
      signOut: () => ({ error: null }),
      getSession: () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
    },
    rpc: () => ({ error: null }),
  }
}

// Create a server-side client with service role for admin operations
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Missing Supabase server credentials. Using mock client.")
    return createMockClient()
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

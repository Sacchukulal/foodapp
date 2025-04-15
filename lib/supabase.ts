import { createClient } from "@supabase/supabase-js"

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Check if Supabase credentials are available
const hasSupabaseCredentials = supabaseUrl && supabaseAnonKey

// Create a Supabase client with better error handling
export const supabase = hasSupabaseCredentials
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: (...args) => {
          // Add custom fetch logic if needed
          return fetch(...args)
        },
      },
    })
  : createMockClient()

// Create a mock client for when Supabase credentials are missing
function createMockClient() {
  console.warn("⚠️ Using mock Supabase client. Database operations will not persist.")

  // Return a mock client with the same interface but no-op functions
  return {
    from: (table) => ({
      select: (columns) => {
        console.log(`Mock SELECT ${columns || "*"} FROM ${table}`)
        return {
          data: [],
          error: null,
          limit: () => ({ data: [], error: null }),
          single: () => ({ data: null, error: null }),
          eq: () => ({ data: [], error: null }),
          order: () => ({ data: [], error: null }),
          count: () => ({ data: [], error: null, count: 0 }),
        }
      },
      insert: (rows) => {
        console.log(`Mock INSERT INTO ${table}`, rows)
        return {
          data: Array.isArray(rows) ? rows.map((row, i) => ({ ...row, id: `mock-${i}` })) : [],
          error: null,
          select: () => ({
            data: Array.isArray(rows) ? rows.map((row, i) => ({ ...row, id: `mock-${i}` })) : [],
            error: null,
          }),
        }
      },
      update: (updates) => {
        console.log(`Mock UPDATE ${table}`, updates)
        return {
          data: null,
          error: null,
          eq: () => ({ data: null, error: null }),
        }
      },
      delete: () => {
        console.log(`Mock DELETE FROM ${table}`)
        return {
          data: null,
          error: null,
          eq: () => ({ data: null, error: null }),
        }
      },
      eq: () => ({
        data: [],
        error: null,
        select: () => ({ data: [], error: null }),
        delete: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
      }),
      order: () => ({
        data: [],
        error: null,
        limit: () => ({ data: [], error: null }),
      }),
      limit: () => ({
        data: [],
        error: null,
      }),
    }),
    storage: {
      from: (bucket) => ({
        upload: (path, file) => {
          console.log(`Mock UPLOAD to ${bucket}/${path}`)
          return { data: { path }, error: null }
        },
        download: (path) => {
          console.log(`Mock DOWNLOAD from ${bucket}/${path}`)
          return { data: new Blob(), error: null }
        },
        remove: (paths) => {
          console.log(`Mock REMOVE from ${bucket}`, paths)
          return { data: null, error: null }
        },
        getPublicUrl: (path) => {
          return { data: { publicUrl: `/mock-storage/${bucket}/${path}` } }
        },
        list: (prefix) => {
          console.log(`Mock LIST from ${bucket}/${prefix || ""}`)
          return { data: [], error: null }
        },
      }),
      listBuckets: () => {
        console.log("Mock LIST BUCKETS")
        return { data: [], error: null }
      },
      createBucket: (name) => {
        console.log(`Mock CREATE BUCKET ${name}`)
        return { data: null, error: null }
      },
    },
    auth: {
      signInWithPassword: () => {
        console.log("Mock SIGN IN")
        return { data: null, error: null }
      },
      signOut: () => {
        console.log("Mock SIGN OUT")
        return { error: null }
      },
      getSession: () => {
        console.log("Mock GET SESSION")
        return { data: { session: null }, error: null }
      },
      onAuthStateChange: (callback) => {
        console.log("Mock AUTH STATE CHANGE")
        return { data: { subscription: { unsubscribe: () => {} } }, error: null }
      },
    },
    rpc: (fn, params) => {
      console.log(`Mock RPC ${fn}`, params)
      return { data: null, error: null }
    },
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

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured() {
  return hasSupabaseCredentials
}

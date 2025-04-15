import { SupabaseConnectionTest } from "@/components/supabase-connection-test"

export default function TestConnectionPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Supabase Connection Test</h1>
      <SupabaseConnectionTest />

      <div className="mt-8 max-w-md mx-auto bg-gray-50 p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Troubleshooting Tips</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Environment Variables:</strong> Make sure <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are correctly set in your deployment.
          </li>
          <li>
            <strong>Row-Level Security:</strong> Check if RLS policies are properly configured in your Supabase
            dashboard.
          </li>
          <li>
            <strong>Table Structure:</strong> Verify that the tables exist and have the expected structure.
          </li>
          <li>
            <strong>Network Issues:</strong> Ensure your deployment can reach the Supabase API.
          </li>
        </ul>
      </div>
    </div>
  )
}

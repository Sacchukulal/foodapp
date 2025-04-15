import { HotelDeliveryApp } from "@/components/hotel-delivery-app"

export default function Home() {
  // Check if Supabase is properly initialized
  const isSupabaseAvailable = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <>
      {!isSupabaseAvailable && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Note</p>
          <p>
            Supabase environment variables are missing. Some features may not work properly. The app is running in demo
            mode with local data.
          </p>
        </div>
      )}
      <HotelDeliveryApp />
    </>
  )
}

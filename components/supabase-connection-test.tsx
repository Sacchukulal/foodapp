"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<"loading" | "success" | "error">("loading")
  const [writeStatus, setWriteStatus] = useState<"untested" | "loading" | "success" | "error">("untested")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [supabaseUrl, setSupabaseUrl] = useState<string | null>(null)

  useEffect(() => {
    testConnection()
    // Get the Supabase URL from the environment variable
    setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "Not configured")
  }, [])

  const testConnection = async () => {
    try {
      setConnectionStatus("loading")
      setErrorMessage(null)

      // Simple query to test connection - just select a single row
      const { data, error } = await supabase.from("menu_items").select("id").limit(1)

      if (error) {
        throw error
      }

      setConnectionStatus("success")
    } catch (error) {
      console.error("Supabase connection error:", error)
      setConnectionStatus("error")
      setErrorMessage(error.message || "Unknown error connecting to Supabase")
    }
  }

  const testWrite = async () => {
    try {
      setWriteStatus("loading")
      setErrorMessage(null)

      // Create a test item
      const testItem = {
        name: "Test Item " + new Date().toISOString(),
        description: "This is a test item to verify database write permissions",
        price: 1.0,
        image_url: "/placeholder.svg?height=100&width=100&text=Test",
        category: "starters",
        veg: true,
        available: true,
      }

      // Try to insert the test item
      const { data, error } = await supabase.from("menu_items").insert([testItem]).select()

      if (error) {
        throw error
      }

      // If successful, delete the test item to clean up
      if (data && data[0] && data[0].id) {
        await supabase.from("menu_items").delete().eq("id", data[0].id)
      }

      setWriteStatus("success")
    } catch (error) {
      console.error("Supabase write test error:", error)
      setWriteStatus("error")
      setErrorMessage(error.message || "Unknown error writing to Supabase")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Supabase URL:</span>
            <span className="text-sm font-mono break-all">{supabaseUrl}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-medium">Connection Status:</span>
            <div className="flex items-center">
              {connectionStatus === "loading" && <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />}
              {connectionStatus === "success" && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
              {connectionStatus === "error" && <XCircle className="h-5 w-5 text-red-500 mr-2" />}
              <span>
                {connectionStatus === "loading" && "Testing..."}
                {connectionStatus === "success" && "Connected"}
                {connectionStatus === "error" && "Failed"}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-medium">Write Permission:</span>
            <div className="flex items-center">
              {writeStatus === "untested" && <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />}
              {writeStatus === "loading" && <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />}
              {writeStatus === "success" && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
              {writeStatus === "error" && <XCircle className="h-5 w-5 text-red-500 mr-2" />}
              <span>
                {writeStatus === "untested" && "Not Tested"}
                {writeStatus === "loading" && "Testing..."}
                {writeStatus === "success" && "Successful"}
                {writeStatus === "error" && "Failed"}
              </span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="text-sm font-mono break-all">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button onClick={testConnection} variant="outline" className="flex-1">
            Test Connection
          </Button>
          <Button onClick={testWrite} variant="default" className="flex-1" disabled={connectionStatus !== "success"}>
            Test Write Permission
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

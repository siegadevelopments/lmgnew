'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCcw, AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Storefront Error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="mb-6 rounded-full bg-destructive/10 p-4 text-destructive">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
      <p className="mt-2 mb-8 max-w-md text-muted-foreground">
        We encountered an error while loading this content. This could be due to a temporary connection issue or a stale cache.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => reset()}
          size="lg"
          className="font-bold"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
          size="lg"
        >
          Hard Refresh
        </Button>
      </div>
    </div>
  )
}

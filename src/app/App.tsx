import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from './providers/AuthProvider'
import { OrganizationProvider } from './providers/OrganizationProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { AppRoutes } from './router/routes'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <OrganizationProvider>
              <Suspense fallback={<LoadingScreen />}>
                <AppRoutes />
              </Suspense>
              <Toaster position="top-right" richColors />
            </OrganizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}

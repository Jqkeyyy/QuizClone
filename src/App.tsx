import { QueryCache, MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AppShell } from './components/layout/AppShell'
import { AuthProvider } from './hooks/AuthProvider'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

const Dashboard = lazy(() => import('./routes/Dashboard'))
const Flashcards = lazy(() => import('./routes/Flashcards'))
const Learn = lazy(() => import('./routes/Learn'))
const Login = lazy(() => import('./routes/Login'))
const NewSet = lazy(() => import('./routes/NewSet'))
const NotFound = lazy(() => import('./routes/NotFound'))
const ImportSet = lazy(() => import('./routes/ImportSet'))
const SetEditor = lazy(() => import('./routes/SetEditor'))
const SetOverview = lazy(() => import('./routes/SetOverview'))
const Settings = lazy(() => import('./routes/Settings'))
const Stats = lazy(() => import('./routes/Stats'))
const Test = lazy(() => import('./routes/Test'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => console.error('Query error:', error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => console.error('Mutation error:', error),
  }),
})

function ProtectedPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<p role="status" className="p-6 text-sm text-neutral-500">Loading…</p>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
              <Route path="/set/new" element={<ProtectedPage><NewSet /></ProtectedPage>} />
              <Route path="/set/import" element={<ProtectedPage><ImportSet /></ProtectedPage>} />
              <Route path="/set/:id" element={<ProtectedPage><SetOverview /></ProtectedPage>} />
              <Route path="/set/:id/edit" element={<ProtectedPage><SetEditor /></ProtectedPage>} />
              <Route path="/set/:id/flashcards" element={<ProtectedPage><Flashcards /></ProtectedPage>} />
              <Route path="/set/:id/learn" element={<ProtectedPage><Learn /></ProtectedPage>} />
              <Route path="/set/:id/stats" element={<ProtectedPage><Stats /></ProtectedPage>} />
              <Route path="/set/:id/test" element={<ProtectedPage><Test /></ProtectedPage>} />
              <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />
              <Route path="*" element={<ProtectedPage><NotFound /></ProtectedPage>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

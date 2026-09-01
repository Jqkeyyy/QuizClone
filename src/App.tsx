import { BrowserRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import Login from './routes/Login'
import Dashboard from './routes/Dashboard'
import NewSet from './routes/NewSet'
import SetOverview from './routes/SetOverview'
import SetEditor from './routes/SetEditor'
import Flashcards from './routes/Flashcards'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('Query error:', error)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('Mutation error:', error)
    },
  }),
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/set/new"
            element={
              <ProtectedRoute>
                <AppShell>
                  <NewSet />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/set/:id"
            element={
              <ProtectedRoute>
                <AppShell>
                  <SetOverview />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/set/:id/edit"
            element={
              <ProtectedRoute>
                <AppShell>
                  <SetEditor />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/set/:id/flashcards"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Flashcards />
                </AppShell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

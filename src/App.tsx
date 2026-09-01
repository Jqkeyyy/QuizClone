import { BrowserRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './routes/Login'
import Dashboard from './routes/Dashboard'
import NewSet from './routes/NewSet'
import SetOverview from './routes/SetOverview'
import SetEditor from './routes/SetEditor'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

const queryClient = new QueryClient()

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
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

import { QueryCache, MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import Dashboard from './routes/Dashboard'
import Flashcards from './routes/Flashcards'
import Login from './routes/Login'
import NewSet from './routes/NewSet'
import SetEditor from './routes/SetEditor'
import SetOverview from './routes/SetOverview'

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

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
          <Route path="/set/new" element={<ProtectedPage><NewSet /></ProtectedPage>} />
          <Route path="/set/:id" element={<ProtectedPage><SetOverview /></ProtectedPage>} />
          <Route path="/set/:id/edit" element={<ProtectedPage><SetEditor /></ProtectedPage>} />
          <Route path="/set/:id/flashcards" element={<ProtectedPage><Flashcards /></ProtectedPage>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

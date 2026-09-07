import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { NavBar } from './components/NavBar.jsx'
import { Login } from './pages/Login.jsx'
import { DocumentsPage } from './pages/DocumentsPage.jsx'
import { ArchivedDocumentsPage } from './pages/ArchivedDocumentsPage.jsx'
import { DocumentChunksPage } from './pages/DocumentChunksPage.jsx'
import { DocumentVersionsPage } from './pages/DocumentVersionsPage.jsx'
import { ConversationsPage } from './pages/ConversationsPage.jsx'
import { ConversationDetailPage } from './pages/ConversationDetailPage.jsx'
import { UsersPage } from './pages/UsersPage.jsx'
import './App.css'

function AuthenticatedLayout({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <NavBar />
      <main className="app-content">{children}</main>
    </ProtectedRoute>
  )
}

function LoginRoute() {
  const { token } = useAuth()

  if (token) {
    return <Navigate to="/documents" replace />
  }

  return <Login />
}

const REVIEW_ROLES = ['reviewer', 'super_admin']

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/documents"
          element={
            <AuthenticatedLayout>
              <DocumentsPage />
            </AuthenticatedLayout>
          }
        />
        <Route
          path="/documents/archived"
          element={
            <AuthenticatedLayout roles={REVIEW_ROLES}>
              <ArchivedDocumentsPage />
            </AuthenticatedLayout>
          }
        />
        <Route
          path="/documents/:id/chunks"
          element={
            <AuthenticatedLayout>
              <DocumentChunksPage />
            </AuthenticatedLayout>
          }
        />
        <Route
          path="/documents/:id/versions"
          element={
            <AuthenticatedLayout>
              <DocumentVersionsPage />
            </AuthenticatedLayout>
          }
        />
        <Route
          path="/conversations"
          element={
            <AuthenticatedLayout roles={REVIEW_ROLES}>
              <ConversationsPage />
            </AuthenticatedLayout>
          }
        />
        <Route
          path="/conversations/:sessionId"
          element={
            <AuthenticatedLayout roles={REVIEW_ROLES}>
              <ConversationDetailPage />
            </AuthenticatedLayout>
          }
        />
        <Route
          path="/users"
          element={
            <AuthenticatedLayout roles={['super_admin']}>
              <UsersPage />
            </AuthenticatedLayout>
          }
        />
        <Route path="*" element={<Navigate to="/documents" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

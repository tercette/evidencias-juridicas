import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'

import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { NewPasswordPage } from './pages/NewPasswordPage'
import { AccountPage } from './pages/AccountPage'
import { DashboardPage } from './pages/DashboardPage'
import { EvidenceEditorPage } from './pages/EvidenceEditorPage'
import { EvidenceDetailPage } from './pages/EvidenceDetailPage'
import { SharePage } from './pages/SharePage'
import { PublicViewPage } from './pages/PublicViewPage'

// basename = "/evidencias-juridicas" no GitHub Pages, "/" no dev.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

function Protected({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          {/* Público (sem login) */}
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/cadastro" element={<Layout><RegisterPage /></Layout>} />
          <Route path="/recuperar" element={<Layout><ForgotPasswordPage /></Layout>} />
          <Route path="/nova-senha" element={<Layout><NewPasswordPage /></Layout>} />
          <Route path="/v/:token" element={<PublicViewPage />} />

          {/* Protegido (requer login) */}
          <Route path="/" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/nova" element={<Protected><EvidenceEditorPage /></Protected>} />
          <Route path="/item/:id" element={<Protected><EvidenceDetailPage /></Protected>} />
          <Route path="/item/:id/editar" element={<Protected><EvidenceEditorPage /></Protected>} />
          <Route path="/compartilhar" element={<Protected><SharePage /></Protected>} />
          <Route path="/conta" element={<Protected><AccountPage /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import { useAuth } from '../context/AuthContext'
import HomePage from '../pages/Home/HomePage'
import LoginPage from '../pages/Login/LoginPage'
import NotFoundPage from '../pages/NotFound/NotFoundPage'
import NotificationsPage from '../pages/Notifications/NotificationsPage'
import PostDetailsPage from '../pages/PostDetails/PostDetailsPage'
import ProfilePage from '../pages/Profile/ProfilePage'
import RegisterPage from '../pages/Register/RegisterPage'
import ResetPasswordPage from '../pages/ResetPassword/ResetPasswordPage'
import SettingsPage from '../pages/Settings/SettingsPage'
import MessagesPage from '../pages/Messages/MessagesPage'
import ProtectedRoute from './ProtectedRoute'

function OwnProfileRedirect() {
  const { user } = useAuth()
  return <Navigate to={`/profile/${user.id}`} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        element={(
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        )}
      >
        <Route index element={<HomePage />} />
        <Route path="/profile" element={<OwnProfileRedirect />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/post/:id" element={<PostDetailsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:conversationId" element={<MessagesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

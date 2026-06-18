import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./api/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UploadPage from "./pages/UploadPage";
import CreatorDashboard from "./pages/CreatorDashboard";
import SalonProfile from "./pages/SalonProfile";
import Explore from "./pages/Explore";
import ViralityDashboard from "./pages/ViralityDashboard";


function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/salon/:salonId" element={<SalonProfile />} />
          <Route
            path="/creator/dashboard"
            element={
              <ProtectedRoute requiredRole="creator">
                <CreatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/creator/upload"
            element={
              <ProtectedRoute requiredRole="creator">
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/creator/video/:videoId"
            element={
              <ProtectedRoute requiredRole="creator">
                <ViralityDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/explore" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

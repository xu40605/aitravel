import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VoiceRecognition from '../pages/VoiceRecognition';
import DirectVoiceRecognition from '../pages/DirectVoiceRecognition';
import PlannerPage from '../pages/Planner/PlannerPage';
import MyPlansPage from '../pages/MyPlans/MyPlansPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import ExpenseManagement from '../pages/ExpenseManagement';
import { PrivateRoute } from './PrivateRoute';
import MainLayout from '../layout/MainLayout';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes */}
      <Route path="/voice-recognition" element={
        <PrivateRoute>
          <VoiceRecognition />
        </PrivateRoute>
      } />
      <Route path="/direct-voice-recognition" element={
        <PrivateRoute>
          <DirectVoiceRecognition />
        </PrivateRoute>
      } />
      
      {/* Main application routes with layout */}
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="planner" replace />} />
        <Route path="planner" element={<PlannerPage />} />
        <Route path="my-plans" element={<MyPlansPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="itineraries/:itineraryId/expenses" element={<ExpenseManagement />} />
      </Route>
      
      {/* Default redirect to login if not authenticated */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
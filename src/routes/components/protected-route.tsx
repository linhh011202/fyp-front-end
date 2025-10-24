import { Navigate } from 'react-router-dom';

import { useAuthToken } from 'src/hooks/use-auth';

import { authService } from 'src/services/auth.service';

// ----------------------------------------------------------------------

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Verify and auto-refresh token
  useAuthToken();

  if (!authService.isAuthenticated()) {
    // Redirect to sign-in page if not authenticated
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

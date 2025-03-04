import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/clerk-react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignInPage from "./pages/auth/SignIn";
import SignUpPage from "./pages/auth/SignUp";
import NotebooksPage from "./pages/notebooks/Notebooks";
import NotebookDetailPage from "./pages/notebooks/NotebookDetail";
import { UserProvider } from "./contexts/UserContext";
import { Toaster } from "react-hot-toast";
import Sandbox from "./components/Sandbox";
import { useTheme } from "./contexts/ThemeContext";
import TokenRefresher from "./components/TokenRefresher";

export default function App() {
  // Get current theme from our context
  const { theme } = useTheme();
  
  // Determine toast styling based on theme
  const isDark = theme === "dark";
  
  return (
    <UserProvider>
      <SignedIn>
        <TokenRefresher />
      </SignedIn>
      
      <Router>
        <Toaster
          position="top-center"
          toastOptions={{
            // Styling for toast notifications based on current theme
            style: {
              background: isDark ? "#333333" : "#ffffff",
              color: isDark ? "#ffffff" : "#000000",
              border: isDark ? "1px solid #555555" : "1px solid #000000",
            },
            // Default toast durations
            duration: 3000,
            // Custom toast type styling
            success: {
              duration: 3000,
              style: {
                background: isDark ? "#1e3a2f" : "#edf7ed",
                border: isDark ? "1px solid #2e5a4e" : "1px solid #c3e6cb",
                color: isDark ? "#ffffff" : "#000000",
              },
            },
            error: {
              duration: 4000,
              style: {
                background: isDark ? "#3e2a2a" : "#f8d7da",
                border: isDark ? "1px solid #5e3a3a" : "1px solid #f5c6cb",
                color: isDark ? "#ffffff" : "#000000",
              },
            },
          }}
        />
        <Routes>
          <Route
            path="/sign-in"
            element={
              <SignedOut>
                <SignInPage />
              </SignedOut>
            }
          />
          <Route
            path="/sign-up"
            element={
              <SignedOut>
                <SignUpPage />
              </SignedOut>
            }
          />
          <Route
            path="/sandbox"
            element={
              <SignedIn>
                <Sandbox />
              </SignedIn>
            }
          />
          <Route
            path="/notebooks"
            element={
              <SignedIn>
                <NotebooksPage />
              </SignedIn>
            }
          />
          <Route
            path="/notebooks/:notebookId"
            element={
              <SignedIn>
                <NotebookDetailPage />
              </SignedIn>
            }
          />
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <Navigate to="/notebooks" replace />
                </SignedIn>
                <SignedOut>
                  <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center">
                    <div className="text-center space-y-8">
                      <div>
                        <h1 className="text-6xl font-bold text-black dark:text-white mb-4">
                          Vox
                          <span className="font-black text-gray-400 dark:text-gray-500">
                            AI
                          </span>
                        </h1>
                        <p className="text-xl text-gray-800 dark:text-gray-200 max-w-md mx-auto">
                          Experience the future of voice interaction
                        </p>
                      </div>

                      <div className="flex gap-4 justify-center">
                        <SignInButton mode="modal">
                          <button className="px-6 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black font-medium transition-all duration-300 hover:bg-gray-900 dark:hover:bg-gray-100 cursor-pointer">
                            Sign In
                          </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                          <button className="px-6 py-2 rounded-full border-2 border-black text-black dark:border-white dark:text-white font-medium transition-all duration-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer">
                            Sign Up
                          </button>
                        </SignUpButton>
                      </div>
                    </div>
                  </div>
                </SignedOut>
              </>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}

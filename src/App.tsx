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
import HomePage from "./pages/Home";
import SignInPage from "./pages/auth/SignIn";
import SignUpPage from "./pages/auth/SignUp";

export default function App() {
  return (
    <Router>
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
          path="/home"
          element={
            <SignedIn>
              <HomePage />
            </SignedIn>
          }
        />
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Navigate to="/home" replace />
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
                        <button className="px-6 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black font-medium transition-all duration-300 hover:bg-gray-900 dark:hover:bg-gray-100">
                          Sign In
                        </button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <button className="px-6 py-2 rounded-full border-2 border-black text-black dark:border-white dark:text-white font-medium transition-all duration-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
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
  );
}

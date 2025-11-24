import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

function SignInContent() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 py-8">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Sign In
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 py-8">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Sign In
          </h1>
          <p className="text-gray-500 text-center">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}



import { RegisterForm } from "@/components/auth/RegisterForm";

export default function SignUp() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Create Account
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Join the TahOak Park Collective
        </p>
        <RegisterForm />
      </div>
    </div>
  );
}


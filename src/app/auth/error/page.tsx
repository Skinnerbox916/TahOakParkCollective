import Link from "next/link";

export default function AuthError({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessage =
    searchParams.error === "CredentialsSignin"
      ? "Invalid email or password"
      : "An authentication error occurred";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Auth Error</h1>
        <p className="text-gray-600 mb-8">{errorMessage}</p>
        <Link
          href="/auth/signin"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}



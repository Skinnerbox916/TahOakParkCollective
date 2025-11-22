import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Unauthorized Access
        </h2>
        <p className="text-gray-600 mb-8">
          You don&apos;t have permission to access this page.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}



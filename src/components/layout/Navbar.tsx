"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          <div className="flex items-center min-w-0 flex-shrink">
            <Link href="/" className="text-lg sm:text-xl font-bold text-indigo-600 truncate">
              TahOak Park Collective
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {status === "loading" ? (
              <span className="text-gray-500 text-sm">Loading...</span>
            ) : session ? (
              <>
                <span className="text-sm text-gray-700 hidden sm:inline">
                  {session.user?.name || session.user?.email}
                </span>
                {session.user?.role && (
                  <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded hidden sm:inline-block">
                    {session.user.role}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button href="/auth/signup" variant="outline" size="sm">
                  Sign Up
                </Button>
                <Button href="/auth/signin" size="sm">
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}



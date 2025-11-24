import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { Role } from "@/lib/prismaEnums";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        // Trim email to handle any whitespace
        const email = credentials.email.trim().toLowerCase();
        
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          console.error(`[AUTH] User not found for email: ${email}`);
          throw new Error("Invalid email or password");
        }

        // Check if user has a password set
        if (!user.password) {
          console.error(`[AUTH] User ${email} has no password set`);
          throw new Error("Password not set. Please reset your password.");
        }

        // Verify the password hash
        const isValidPassword = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          console.error(`[AUTH] Invalid password for user: ${email}`);
          throw new Error("Invalid email or password");
        }

        console.log(`[AUTH] Successfully authenticated user: ${email}`);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles: user.roles,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as { roles: Role[] }).roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; roles: Role[] }).id = token.id as string;
        (session.user as { id: string; roles: Role[] }).roles = token.roles as Role[];
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


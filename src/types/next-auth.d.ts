import type { Role } from "@/lib/prismaEnums";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      image: string | null;
      roles: Role[];
    };
  }

  interface User {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    roles: Role[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: Role[];
  }
}


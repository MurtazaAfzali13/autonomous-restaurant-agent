import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string;
      firstname?: string;
      lastname?: string;
      email?: string;
      role?: "admin" | "user";
      image?: string;
    };
  }

  interface User {
    id: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    role?: "admin" | "user";
  }
}

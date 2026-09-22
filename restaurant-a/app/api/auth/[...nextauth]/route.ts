import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { JWT } from "next-auth/jwt";
import { Session, User as NextAuthUser } from "next-auth";
import { supabase } from "@/lib/supabase"; // مسیر فایل کمکی سوپابیس

interface User {
  id: string; // در سوپابیس id از نوع BIGINT است ولی اینجا به عنوان استرینگ استفاده می‌کنیم مشکلی ندارد
  email: string;
  firstname: string;
  lastname: string;
  password: string;
  role: "admin" | "customer"; // طبق جدول role پیش‌فرض customer بود
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: { email: string; password: string } | undefined
      ) {
        if (!credentials) return null;

        // 👈 خواندن کاربر از سوپابیس
        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", credentials.email)
          .maybeSingle();

        if (error || !user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // باید حتما id به string تبدیل شود تا در سشن به مشکل نخوریم (چون در سوپابیس bigint است)
        return {
          id: String(user.id), 
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT & { id?: string; firstname?: string; lastname?: string; role?: "admin" | "customer" };
      user?: NextAuthUser & { id?: string; firstname?: string; lastname?: string; role?: "admin" | "customer" };
    }) {
      if (user) {
        token.id = user.id;
        token.firstname = user.firstname ?? undefined;
        token.lastname = user.lastname ?? undefined;
        token.role = user.role;
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & { id?: string; firstname?: string; lastname?: string; role?: "admin" | "customer" };
    }) {
      if (token) {
        session.user.id = token.id!;
        session.user.firstname = token.firstname;
        session.user.lastname = token.lastname;
        session.user.role = token.role;
        session.user.name = `${token.firstname || ""} ${token.lastname || ""}`.trim();
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
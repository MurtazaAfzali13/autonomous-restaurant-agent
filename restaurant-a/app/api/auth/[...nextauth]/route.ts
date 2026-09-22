import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { supabase } from "@/lib/supabase"; 

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", credentials.email)
          .maybeSingle();

        if (error || !user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // اطلاعات کاربر را برمی‌گردانیم و با as any از خطای تایپ‌اسکریپت عبور می‌کنیم
        return {
          id: String(user.id), 
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
        } as any;
      },
    }),
  ],

  callbacks: {
    // 🌟 اینجا پارامترها را به حالت استاندارد NextAuth برگرداندیم
    async jwt({ token, user }) {
      if (user) {
        // متغیر user را کست می‌کنیم تا بتوانیم ویژگی‌های اختصاصی خودمان را بخوانیم
        const customUser = user as any;
        token.id = customUser.id;
        token.firstname = customUser.firstname;
        token.lastname = customUser.lastname;
        token.role = customUser.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        // متغیر session.user را کست می‌کنیم تا بتوانیم ویژگی‌های اختصاصی را بنویسیم
        const customSessionUser = session.user as any;
        customSessionUser.id = token.id;
        customSessionUser.firstname = token.firstname;
        customSessionUser.lastname = token.lastname;
        customSessionUser.role = token.role;
        customSessionUser.name = `${token.firstname || ""} ${token.lastname || ""}`.trim();
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
'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import clsx from "clsx";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [message, setMessage] = useState("");

  async function submitHandler(e: React.FormEvent) {
    e.preventDefault();

    if (isLogin) {
      await signIn("credentials", {
        redirect: true,
        email,
        password,
        callbackUrl: "/",
      });
    } else {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstname, lastname }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("✅ Account created successfully! Please log in.");
        setTimeout(() => {
          setIsLogin(true);
          setFirstname("");
          setLastname("");
          setPassword("");
          setEmail("");
          setMessage("");
        }, 1500);
      } else {
        setMessage("❌ " + (data.error || "Registration failed!"));
      }
    }
  }

  return (
    <>
      {/* تعریف استایل برای تغییر عکس پس‌زمینه بر اساس سایز صفحه */}
      <style jsx>{`
        .responsive-bg {
          background-image: url('/images/login/login1.jpg');
        }
        @media (min-width: 768px) {
          .responsive-bg {
            background-image: url('/images/login/login2.jpg');
          }
        }
      `}</style>

      {/* بخش پس‌زمینه که کل صفحه را می‌گیرد */}
      <div className="responsive-bg flex items-center justify-center min-h-screen p-4 bg-cover bg-center bg-no-repeat relative">
        
        {/* یک لایه تاریک‌کننده برای خواناتر شدن فرم روی عکس */}
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative w-full max-w-md z-10">
          
          {/* کانتینر اصلی با افکت شیشه‌ای */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-8">
            
            {/* دکمه‌های جابجایی بین Signup و Login */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-white/20 rounded-full p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={clsx(
                    "px-8 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    !isLogin 
                      ? "bg-white text-rose-500 shadow-md" 
                      : "text-white/80 hover:text-white"
                  )}
                >
                  Signup
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={clsx(
                    "px-8 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    isLogin 
                      ? "bg-white text-rose-500 shadow-md" 
                      : "text-white/80 hover:text-white"
                  )}
                >
                  Login
                </button>
              </div>
            </div>

            <form onSubmit={submitHandler} className="flex flex-col gap-4">
              {!isLogin && (
                <>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    className="w-full bg-white/20 border border-white/30 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-white/70 shadow-inner"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    className="w-full bg-white/20 border border-white/30 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-white/70 shadow-inner"
                    required
                  />
                </>
              )}

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/20 border border-white/30 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-white/70 shadow-inner"
                required
              />
              
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/20 border border-white/30 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-white/70 shadow-inner"
                required
              />

              {message && (
                <p className="text-center text-sm text-white font-medium bg-black/30 p-2 rounded-lg">
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-semibold transition-colors shadow-lg"
              >
                {isLogin ? "Login" : "Sign Up"}
              </button>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}
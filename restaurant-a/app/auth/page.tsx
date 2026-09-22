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
  const [animating, setAnimating] = useState(false);
  const [message, setMessage] = useState("");

  async function submitHandler(e: React.FormEvent) {
    e.preventDefault();

    if (isLogin) {
      await signIn("credentials", {
        redirect: true,
        email,
        password,
        callbackUrl: "/", // بعد از لاگین برو به صفحه اصلی
      });
    } else {
      // ثبت‌نام کاربر جدید
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstname, lastname }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("✅ Account created successfully! Please log in.");
        // کمی صبر کن تا پیام دیده بشه، بعد به فرم لاگین برگرد
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

  const toggleForm = () => {
    setAnimating(true);
    setTimeout(() => {
      setIsLogin((prev) => !prev);
      setAnimating(false);
      setEmail("");
      setPassword("");
      setFirstname("");
      setLastname("");
      setMessage("");
    }, 400);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-green-200 via-green-100 to-green-200 p-4">
      <div className="relative w-full max-w-md">
        <div
          className={clsx(
            "bg-white rounded-3xl shadow-xl p-8 transition-transform duration-500",
            animating
              ? isLogin
                ? "translate-y-96 opacity-0"
                : "-translate-y-96 opacity-0"
              : "translate-y-0 opacity-100"
          )}
        >
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h1>

          <form onSubmit={submitHandler} className="flex flex-col gap-4">
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />

            {message && (
              <p className="text-center text-sm text-green-600 font-medium">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="bg-green-500 text-white p-3 rounded-xl font-semibold hover:bg-green-600 transition"
            >
              {isLogin ? "Login" : "Register"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-4">
            {isLogin ? "New here?" : "Already have an account?"}{" "}
            <button
              onClick={toggleForm}
              className="text-green-500 font-semibold underline"
            >
              {isLogin ? "Create one" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

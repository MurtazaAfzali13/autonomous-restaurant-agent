'use client';

import { useState, useEffect } from "react";
import { Menu, X, ShoppingCart, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Logo from "@/public/images/logo/menu-item-1.png";
import { useCart } from "@/share/CartContext";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasOrders, setHasOrders] = useState(false);
  const pathname = usePathname();
  const { state } = useCart();
  const { data: session } = useSession();

  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "admin";

  const publicNavItems = [
    { name: "Home", href: "/" },
    { name: "Menu", href: "/menu" },
    { name: "About", href: "/about" },
    { name: "Gallery", href: "/gallery" },
  ];

  const navItems = [
    ...publicNavItems,
    ...(isLoggedIn && isAdmin ? [{ name: "Dashboard", href: "/dashboard" }] : []),
  ];

  // فقط کاربران عادی My Orders را بررسی می‌کنند
  useEffect(() => {
    if (!isLoggedIn || !session?.user?.email || isAdmin) {
      setHasOrders(false);
      return;
    }

    const email = session.user.email;
    fetch(`/api/myOrders?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => setHasOrders((data.orders?.length || 0) > 0))
      .catch(() => setHasOrders(false));
  }, [isLoggedIn, session?.user?.email, isAdmin]);

  useEffect(() => {
    if (pathname === "/") {
      const handleScroll = () => setScrolled(window.scrollY > 20);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      setScrolled(true);
    }
  }, [pathname]);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
      scrolled
        ? "bg-black/80 backdrop-blur-md border-b border-gray-700 shadow-md"
        : "bg-transparent border-transparent shadow-none"
    }`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <Image
            src={Logo}
            alt="Ariana Feast Logo"
            width={40}
            height={40}
            className="rounded-full object-cover"
            priority
          />
          <span className={`text-xl font-bold hidden sm:block transition-colors duration-500 ${
            scrolled ? "text-white" : "text-gray-100"
          }`}>
            Ariana Feast
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-8">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 font-semibold transition-colors duration-300 ${
                pathname === item.href
                  ? "text-emerald-300"
                  : scrolled
                  ? "text-gray-200 hover:text-emerald-300"
                  : "text-white hover:text-emerald-300"
              }`}
            >
              {item.name}
            </Link>
          ))}

          {/* Customers فقط برای Admin */}
          {isLoggedIn && isAdmin && (
            <Link
              href="/customers"
              className={`px-3 py-2 font-semibold transition-colors duration-300 ${
                pathname === "/customers"
                  ? "text-emerald-300"
                  : scrolled
                  ? "text-gray-200 hover:text-emerald-300"
                  : "text-white hover:text-emerald-300"
              }`}
            >
              👥 Customers
            </Link>
          )}

          {/* My Orders فقط برای کاربران عادی */}
          {isLoggedIn && !isAdmin && hasOrders && (
            <Link
              href="/myOrders"
              className={`px-3 py-2 font-semibold transition-colors duration-300 ${
                pathname === "/myOrders"
                  ? "text-emerald-300"
                  : scrolled
                  ? "text-gray-200 hover:text-emerald-300"
                  : "text-white hover:text-emerald-300"
              }`}
            >
              🧾 My Orders
            </Link>
          )}

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex items-center justify-center text-white hover:text-emerald-300 transition"
          >
            <ShoppingCart size={24} />
            {state.items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                {state.items.length}
              </span>
            )}
          </Link>

          {/* Login / Logout */}
          {isLoggedIn ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-3 py-2 font-semibold text-white hover:text-emerald-300 flex items-center space-x-1"
            >
              <LogOut size={16} /> <span>Logout</span>
            </button>
          ) : (
            <Link
              href="/auth"
              className="px-3 py-2 font-semibold text-white hover:text-emerald-300"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-white focus:outline-none"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={`lg:hidden transition-all duration-300 ${
          scrolled ? "bg-black/80 backdrop-blur-md" : "bg-black/40 backdrop-blur-sm"
        }`}>
          <div className="flex flex-col space-y-2 p-4">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2 font-semibold transition-colors duration-200 ${
                  pathname === item.href
                    ? "text-emerald-300"
                    : "text-gray-100 hover:text-emerald-300"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Customers فقط برای Admin */}
            {isLoggedIn && isAdmin && (
              <Link
                href="/customers"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 font-semibold transition-colors duration-200 text-gray-100 hover:text-emerald-300"
              >
                👥 Customers
              </Link>
            )}

            {/* My Orders فقط برای کاربران عادی */}
            {isLoggedIn && !isAdmin && hasOrders && (
              <Link
                href="/myOrders"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 font-semibold transition-colors duration-200 text-gray-100 hover:text-emerald-300"
              >
                🧾 My Orders
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center text-white hover:text-emerald-300 mt-2"
              onClick={() => setIsOpen(false)}
            >
              <ShoppingCart size={24} />
              {state.items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                  {state.items.length}
                </span>
              )}
            </Link>

            {/* Login / Logout */}
            {isLoggedIn ? (
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-2 font-semibold text-white hover:text-emerald-300 flex items-center space-x-1"
              >
                <LogOut size={16} /> <span>Logout</span>
              </button>
            ) : (
              <Link
                href="/auth"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 font-semibold text-white hover:text-emerald-300"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

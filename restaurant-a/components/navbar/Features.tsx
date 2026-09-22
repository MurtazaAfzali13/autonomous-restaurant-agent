"use client";

export default function FeaturesSection() {
  return (
    <section className="relative py-24 bg-[#0a0f1a] overflow-hidden selection:bg-emerald-500/30">
      {/* هاله‌های نوری پس‌زمینه برای عمق دادن به صفحه */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 mx-auto container px-6 max-w-7xl">
        {/* Header */}
        <div className="mx-auto text-center max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Our Excellence
          </div>
          
          <h2 className="font-black text-4xl sm:text-5xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-tight">
            Why Choose <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">Ariana Feast</span>
          </h2>
          
          <p className="text-slate-400 text-lg sm:text-xl font-light leading-relaxed">
            Experience the perfect blend of culinary excellence, premium service, and memorable ambiance
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Feature 1 - Love (Rose) */}
          <div className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] hover:-translate-y-2 hover:border-rose-500/30 hover:shadow-[0_15px_40px_-10px_rgba(244,63,94,0.15)] transition-all duration-500 overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-6 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-slate-200 group-hover:text-rose-300 transition-colors duration-300">Crafted with Love</h3>
              <p className="text-slate-400 font-light leading-relaxed">Every dish is prepared with passion and attention to detail by our expert chefs</p>
            </div>
          </div>

          {/* Feature 2 - Fresh (Emerald) */}
          <div className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] hover:-translate-y-2 hover:border-emerald-500/30 hover:shadow-[0_15px_40px_-10px_rgba(16,185,129,0.15)] transition-all duration-500 overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-slate-200 group-hover:text-emerald-300 transition-colors duration-300">Fresh Ingredients</h3>
              <p className="text-slate-400 font-light leading-relaxed">We source only the finest, freshest ingredients from local farms and trusted suppliers</p>
            </div>
          </div>

          {/* Feature 3 - Fast (Cyan) */}
          <div className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] hover:-translate-y-2 hover:border-cyan-500/30 hover:shadow-[0_15px_40px_-10px_rgba(6,182,212,0.15)] transition-all duration-500 overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-500 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-slate-200 group-hover:text-cyan-300 transition-colors duration-300">Fast Service</h3>
              <p className="text-slate-400 font-light leading-relaxed">Quick and efficient service without compromising on quality or presentation</p>
            </div>
          </div>

          {/* Feature 4 - Chefs (Amber) */}
          <div className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] hover:-translate-y-2 hover:border-amber-500/30 hover:shadow-[0_15px_40px_-10px_rgba(245,158,11,0.15)] transition-all duration-500 overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-6 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-slate-200 group-hover:text-amber-300 transition-colors duration-300">Expert Chefs</h3>
              <p className="text-slate-400 font-light leading-relaxed">Our team of world-class chefs brings years of culinary expertise to every plate</p>
            </div>
          </div>

          {/* Feature 5 - Ambiance (Purple) */}
          <div className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] hover:-translate-y-2 hover:border-purple-500/30 hover:shadow-[0_15px_40px_-10px_rgba(168,85,247,0.15)] transition-all duration-500 overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-slate-200 group-hover:text-purple-300 transition-colors duration-300">Premium Ambiance</h3>
              <p className="text-slate-400 font-light leading-relaxed">Elegant dining atmosphere perfect for romantic dinners and special occasions</p>
            </div>
          </div>

          {/* Feature 6 - 24/7 (Indigo) */}
          <div className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] hover:-translate-y-2 hover:border-indigo-500/30 hover:shadow-[0_15px_40px_-10px_rgba(99,102,241,0.15)] transition-all duration-500 overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-3 text-slate-200 group-hover:text-indigo-300 transition-colors duration-300">24/7 Service</h3>
              <p className="text-slate-400 font-light leading-relaxed">Available round the clock for all your dining needs and special requests</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import Image from 'next/image'
import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Saul Goodman',
    role: 'CEO & Founder',
    image: '/images/about/testimonials-1.jpg',
    text: 'Proin iaculis purus consequat sem cure dignissim donec porttitora entum suscipit rhoncus.',
  },
  {
    name: 'Sara Wilsson',
    role: 'Designer',
    image: '/images/about/testimonials-2.jpg',
    text: 'Export tempor illum tamen malis malis eram quae irure esse labore quem cillum quid.',
  },
  {
    name: 'Jena Karlis',
    role: 'Store Owner',
    image: '/images/about/testimonials-3.jpg',
    text: 'Enim nisi quem export duis labore cillum quae magna enim sint quorum nulla quem veniam.',
  },
  {
    name: 'John Larson',
    role: 'Entrepreneur',
    image: '/images/about/testimonials-4.jpg',
    text: 'Fugiat enim eram quae cillum dolore dolor amet nulla culpa multos export minim fugiat minim velit.',
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 bg-[#0a0f1a] overflow-hidden selection:bg-emerald-500/30">
      
      {/* هاله‌های نوری پس‌زمینه */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* استایل سفارشی برای دکمه‌های Pagination کتابخانه Swiper */}
      <style>{`
        .swiper-pagination-bullet {
          background-color: #334155 !important;
          opacity: 1 !important;
          transition: all 0.3s ease !important;
        }
        .swiper-pagination-bullet-active {
          background-color: #10b981 !important;
          width: 24px !important;
          border-radius: 12px !important;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.5) !important;
        }
      `}</style>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Testimonials
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-wide mb-4">
            What Are They <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">Saying About Us</span>
          </h2>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          speed={800}
          className="pb-16"
        >
          {testimonials.map((t, i) => (
            <SwiperSlide key={i}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 p-4"
              >
                {/* Avatar */}
                <div className="relative shrink-0 group">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl opacity-60 scale-150 group-hover:bg-emerald-500/30 transition-all duration-500"></div>
                  <div className="relative w-[140px] h-[140px] rounded-full p-1.5 bg-gradient-to-br from-emerald-500 to-slate-800 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
                    <Image
                      src={t.image}
                      alt={t.name}
                      width={140}
                      height={140}
                      className="rounded-full object-cover w-full h-full border-4 border-slate-950"
                    />
                  </div>
                </div>

                {/* Card */}
                <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-[0_15px_50px_-12px_rgba(0,0,0,0.5)] rounded-[2.5rem] p-8 md:p-10 max-w-2xl">
                  {/* علامت نقل قول تزئینی (بالا چپ) */}
                  <div className="absolute -top-4 -left-2 text-8xl text-emerald-500/10 font-serif leading-none select-none pointer-events-none">
                    “
                  </div>
                  
                  <p className="text-slate-300 italic text-lg md:text-xl leading-relaxed relative z-10 font-light">
                    {t.text}
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800/60 pt-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{t.name}</h3>
                      <h4 className="text-emerald-400/80 text-sm font-medium tracking-wide uppercase">{t.role}</h4>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-1">
                      {Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <svg
                            key={index}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                          >
                            <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.729 1.507 8.165L12 18.896l-7.443 4.304 1.507-8.165L0 9.306l8.332-1.151z" />
                          </svg>
                        ))}
                    </div>
                  </div>
                  
                  {/* علامت نقل قول تزئینی (پایین راست) */}
                  <div className="absolute -bottom-10 -right-2 text-8xl text-emerald-500/10 font-serif leading-none select-none pointer-events-none rotate-180">
                    “
                  </div>
                </div>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
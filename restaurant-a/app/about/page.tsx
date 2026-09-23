"use client";

import { motion, useScroll, useTransform, Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function AboutPage() {
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <section ref={ref} className="relative bg-slate-950 min-h-screen overflow-hidden font-sans">
      
      <motion.div style={{ y: yBg }} className="absolute inset-0 z-0">
        <Image
          src="/images/about/restaurant3.jpg"
          alt="Restaurant background"
          fill
          className="object-cover brightness-[0.35]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950" />
      </motion.div>

      <div className="relative z-10 container mx-auto px-6 py-32 text-white">
        
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center mb-24"
        >
          <motion.span variants={fadeUp} className="text-amber-500 font-medium tracking-[0.3em] uppercase text-sm mb-4 block">
            Discover Our Roots
          </motion.span>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
            About Our Restaurant
          </motion.h1>
          <motion.p variants={fadeUp} className="text-gray-300 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
            Experience the art of fine dining where passion meets flavor. We
            serve fresh ingredients, local produce, and heartwarming hospitality.
          </motion.p>
        </motion.div>

        {/* Stats Row (Glassmorphism) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-32 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          {[
            { label: "Years Experience", value: "14+" },
            { label: "Master Chefs", value: "12" },
            { label: "Signature Dishes", value: "50+" },
            { label: "Happy Guests", value: "20k+" },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <h3 className="text-4xl font-bold text-amber-500 mb-2">{stat.value}</h3>
              <p className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Main Content - Story Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto mb-32">
          
          {/* Image Section with Hover Effect */}
          <motion.div
            initial={{ opacity: 0, x: -50, rotate: -5 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 1, type: "spring", bounce: 0.3 }}
            viewport={{ once: true }}
            className="relative w-full h-[550px] rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)] group"
          >
            <Image
              src="/images/chefs/chef.jpg"
              alt="Our chef"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* لایه رنگی روی عکس هنگام هاور */}
            <div className="absolute inset-0 bg-amber-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </motion.div>

          {/* Text Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="flex flex-col justify-center"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-6">
              <div className="h-[2px] w-12 bg-amber-500" />
              <h2 className="text-3xl md:text-4xl font-bold">Our Story</h2>
            </motion.div>
            
            <motion.p variants={fadeUp} className="text-gray-300 mb-6 text-lg leading-relaxed">
              Founded in 2010, <span className="font-bold text-amber-500">Le Delice</span> started as a small family restaurant with a dream of bringing authentic Mediterranean flavors to the heart of the city. Each dish tells a story of tradition, crafted with love and a deep respect for the ingredients.
            </motion.p>
            
            <motion.p variants={fadeUp} className="text-gray-400 mb-10 leading-relaxed">
              Our chefs carefully curate every plate, blending timeless recipes with modern techniques. Whether you're here for a romantic dinner, a family gathering, or a celebration — we promise an unforgettable dining experience.
            </motion.p>
            
            <motion.div variants={fadeUp}>
              <Link
                href="/menu"
                className="relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-300 bg-amber-600 rounded-full hover:bg-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-1 overflow-hidden group"
              >
                <span className="relative z-10">Explore Our Menu</span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Mission / Core Values Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {[
            { title: "Fresh Ingredients", desc: "We source our produce locally every morning to ensure the highest quality.", icon: "🌱" },
            { title: "Master Craftsmanship", desc: "Our culinary team treats every plate as a canvas, blending art and flavor.", icon: "👨‍🍳" },
            { title: "Warm Hospitality", desc: "From the moment you walk in, you are treated like family in our home.", icon: "🥂" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              whileHover={{ y: -10 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors duration-300"
            >
              <div className="text-4xl mb-6 bg-white/10 w-16 h-16 flex items-center justify-center rounded-2xl">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
              <p className="text-gray-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
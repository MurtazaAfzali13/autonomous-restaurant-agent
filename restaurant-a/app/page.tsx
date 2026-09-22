import Events from '@/components/Event'
import Hero from '@/components/Hero'
import ImageGallery from '@/components/ImageGallery'
import HomePage from '@/components/map/MapMainPage'
import MealsPreview from '@/components/MealsList'
import FeaturesSection from '@/components/navbar/Features'
import Footer from '@/components/navbar/Footer'
import OurTeam from '@/components/OurThem'
import Testimonials from '@/components/Testimonials'
import React from 'react'

const App = () => {
  return (
    <div>
      <Hero />
      <FeaturesSection />
      <MealsPreview />
      <Testimonials />
      <Events />
      <ImageGallery />
     
      <HomePage />
      <Footer />
    </div>
  )
}

export default App
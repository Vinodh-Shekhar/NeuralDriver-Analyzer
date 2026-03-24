import { useEffect } from 'react'
import Header from './components/Header'
import Hero from './sections/Hero'
import CoreCapabilities from './sections/CoreCapabilities'
import Differentiation from './sections/Differentiation'
import UseCases from './sections/UseCases'
import FeatureDeepDive from './sections/FeatureDeepDive'
import ComparisonShowcase from './sections/ComparisonShowcase'
import CredibilitySection from './sections/CredibilitySection'
import DownloadSection from './sections/DownloadSection'
import Footer from './sections/Footer'

export default function App() {
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('[data-animate]')
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.8) {
          el.classList.add('animate-fade-in-up')
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="w-full bg-nvidia-bg text-nvidia-text overflow-x-hidden pt-16">
      <Header />
      <Hero />
      <CoreCapabilities />
      <Differentiation />
      <UseCases />
      <FeatureDeepDive />
      <ComparisonShowcase />
      <CredibilitySection />
      <DownloadSection />
      <Footer />
    </div>
  )
}

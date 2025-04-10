import { useRef, useState, useEffect } from "react";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import { Button } from "./components/ui/button";
import { 
  ArrowRight, ChevronDown, Menu, X, Globe, Check,
  CircleDollarSign, ChevronRight, Twitter, Instagram, Github
} from "lucide-react";

// Hero section background images
const heroBackgrounds = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2000&q=80',
    title: "The heart of",
    subtitle: "Kuri",
    description: "Kuri is inspired by global saving circles - from chit funds in India, to tandas in Mexico, to susus in West Africa."
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=2000&q=80',
    title: "Empower Your",
    subtitle: "Financial Future",
    description: "Zero interest, zero fees. Just the power of community saving to help you reach your goals."
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1556484687-30636164638b?auto=format&fit=crop&w=2000&q=80',
    title: "Transparent",
    subtitle: "& Trustworthy",
    description: "We've turned tradition into joyful, interest-free finance."
  }
];

// Circle preview data
const activeCircles = [
  {
    id: 1,
    name: "Home Renovators",
    members: 12,
    contribution: "$250 monthly",
    totalPool: "$3,000",
    nextDraw: "April 15, 2025",
    imageUrl: "https://images.unsplash.com/photo-1484154218962-491adf1aa5ba?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 2,
    name: "Entrepreneurs Fund",
    members: 8,
    contribution: "$500 monthly",
    totalPool: "$4,000",
    nextDraw: "April 20, 2025",
    imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 3,
    name: "Education Savers",
    members: 15,
    contribution: "$200 monthly",
    totalPool: "$3,000",
    nextDraw: "April 25, 2025",
    imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=80"
  }
];

function App() {
  // State for navigation
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  
  // Refs for sections
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);
  const liveCirclesRef = useRef(null);
  
  // Scroll animations - using useScroll without destructuring unused variables
  useScroll();
  
  // Hero slider animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === heroBackgrounds.length - 1 ? 0 : prev + 1));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Scroll-based animations
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      // Determine active section based on scroll position
      const sections = [
        { id: "home", ref: heroRef },
        { id: "about", ref: aboutRef },
        { id: "how-it-works", ref: howItWorksRef },
        { id: "testimonials", ref: testimonialsRef },
        { id: "live-circles", ref: liveCirclesRef }
      ];
      
      for (const section of sections) {
        const element = section.ref.current;
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            break;
          }
        }
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full backdrop-blur-sm border-b border-border/40 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="#" className="text-2xl font-bold flex items-center">
              <CircleDollarSign className="h-8 w-8 text-[hsl(var(--terracotta))]" />
              <span className="ml-2 display-title text-gradient">KURI</span>
            </a>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#about" className="text-foreground/80 hover:text-foreground transition-colors">About</a>
              <a href="#how-it-works" className="text-foreground/80 hover:text-foreground transition-colors">How It Works</a>
              <a href="#testimonials" className="text-foreground/80 hover:text-foreground transition-colors">Testimonials</a>
              <a href="#circles" className="text-foreground/80 hover:text-foreground transition-colors">Live Circles</a>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" size="sm" className="border-border/60 hover:border-border">
              Log In
            </Button>
            <Button size="sm" className="btn-tactile bg-[hsl(var(--terracotta))] text-white">
              Join Now
            </Button>
          </div>
          <button 
            className="md:hidden text-foreground p-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background/95 backdrop-blur-md border-b border-border/40"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                <a href="#about" className="py-2 text-foreground/80 hover:text-foreground transition-colors">About</a>
                <a href="#how-it-works" className="py-2 text-foreground/80 hover:text-foreground transition-colors">How It Works</a>
                <a href="#testimonials" className="py-2 text-foreground/80 hover:text-foreground transition-colors">Testimonials</a>
                <a href="#circles" className="py-2 text-foreground/80 hover:text-foreground transition-colors">Live Circles</a>
                <div className="flex flex-col space-y-2 pt-2">
                  <Button variant="outline" size="sm" className="w-full border-border/60 hover:border-border">
                    Log In
                  </Button>
                  <Button size="sm" className="w-full btn-tactile bg-[hsl(var(--terracotta))] text-white">
                    Join Now
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section with Image Slider */}
      <section ref={heroRef} className="hero-slider" id="hero">
        {/* Background images that change */}
        {heroBackgrounds.map((slide, index) => (
          <div 
            key={index} 
            className={`slider-item ${index === activeSlide ? 'active' : ''}`}
          >
            <div className="slider-overlay"></div>
            <img 
              src={slide.imageUrl} 
              alt={`Kuri community savings circle ${index + 1}`} 
              className="slider-image"
            />
          </div>
        ))}
        
        {/* Fixed content card that stays in place */}
        <div className="container mx-auto slider-content">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ 
              opacity: 1, 
              y: 0
            }}
            whileHover={{
              y: -10,
              scale: 1.02,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            transition={{ 
              delay: 0.2, 
              duration: 0.8
            }}
            className="relative z-10 cursor-pointer overflow-hidden"
          >
            {/* Modern asymmetric layout with cultural elements */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Content side - takes up 3/5 of the space on desktop */}
              <div className="md:col-span-3 p-10 md:p-14 rounded-3xl border border-white/20 border-l-4 border-l-[hsl(var(--terracotta))] relative overflow-hidden bg-black/10 backdrop-blur-[1px] shadow-lg">
                
                {/* Fixed height container for content to maintain consistent card size */}
                <div className="min-h-[320px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlide}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="h-full"
                    >
                      {/* Culturally-inspired typography with modern layout */}
                      <div className="mb-2 text-[hsl(var(--gold))] font-sans uppercase tracking-widest text-sm">
                        Community-Powered Finance
                      </div>
                      
                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white mb-6 tracking-tight leading-[1.2]">
                        <div className="overflow-hidden pb-2">
                          <motion.span 
                            initial={{ y: "100%" }}
                            animate={{ y: "0%" }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="block py-1"
                          >
                            {heroBackgrounds[activeSlide].title}
                          </motion.span>
                        </div>
                        <div className="overflow-hidden pb-2">
                          <motion.span 
                            initial={{ y: "100%" }}
                            animate={{ y: "0%" }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="block text-white py-1"
                          >
                            {heroBackgrounds[activeSlide].subtitle}
                          </motion.span>
                        </div>
                      </h2>
                      
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-base md:text-lg font-sans text-white/80 mb-10 max-w-xl"
                      >
                        {heroBackgrounds[activeSlide].description}
                      </motion.p>
                    </motion.div>
                  </AnimatePresence>
                </div>
                
                {/* Buttons moved outside AnimatePresence to prevent unmounting during transitions */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Button 
                    size="lg" 
                    className="relative group overflow-hidden rounded-xl bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-14 px-8"
                  >
                    <span className="relative z-20 flex items-center font-sans font-medium">
                      Create Your Circle
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                  
                  <Button 
                    size="lg" 
                    className="relative group overflow-hidden rounded-xl bg-black/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-14 px-8 backdrop-blur-[1px]"
                  >
                    <span className="relative z-20 flex items-center font-sans font-medium">
                      Explore Circles
                      <ArrowRight className="ml-2 h-5 w-5 opacity-70 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                    </span>
                  </Button>
                </motion.div>
              </div>
              
              {/* Empty div to maintain the grid layout */}
              <div className="md:col-span-2"></div>
            </div>
            
            {/* Slide indicators - redesigned as cultural symbols */}
            <div className="flex justify-center mt-8 space-x-3">
              {heroBackgrounds.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`w-8 h-8 flex items-center justify-center focus:outline-none transition-all duration-300 ${
                    activeSlide === index ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-75'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  {activeSlide === index && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute w-6 h-6 rounded-full border border-white/50"
                      transition={{ duration: 0.3 }}
                    ></motion.div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-12 right-12 hidden md:flex flex-col items-center text-white/80"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-sm mb-2 rotate-90 origin-left">Scroll</span>
          <ChevronDown size={20} />
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full border border-white/20 rotating-circle opacity-70"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full border border-white/10 rotating-circle-reverse opacity-50"></div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} className="py-24 relative overflow-hidden" id="about">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2000&q=80')] bg-fixed bg-center bg-no-repeat bg-cover opacity-5" />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-display font-semibold mb-4 relative inline-block">
                <span className="relative z-10">The Heart of Kuri</span>
                <motion.div 
                  className="absolute -bottom-3 left-0 h-3 bg-[hsl(var(--terracotta))/30] w-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  viewport={{ once: true }}
                />
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-6">
                Kuri is inspired by global saving circles — from chit funds in India, to tandas in Mexico, to susus in West Africa.
                We've turned tradition into joyful, interest-free finance.
              </p>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative aspect-square"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4/5 h-4/5 rounded-full border-2 border-terracotta/30 animate-rotate-slow flex items-center justify-center">
                  <div className="w-3/5 h-3/5 rounded-full border-2 border-ochre/20 animate-rotate-reverse" />
                </div>
              </div>
              <img
                src="https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&w=800&q=80"
                alt="Traditional savings group"
                className="absolute inset-0 w-3/4 h-3/4 object-cover rounded-full m-auto shadow-xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-display font-semibold mb-6">The Heart of Kuri</h3>
              <p className="text-lg text-muted-foreground mb-8">
                Kuri is inspired by global saving circles — from chit funds in India, to tandas in Mexico, to susus in West Africa.
                We've turned tradition into joyful, interest-free finance.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform brings the time-honored practice of community saving into the digital age, 
                making it accessible, transparent, and secure for everyone.
              </p>
              <div className="flex items-center space-x-4">
                <Globe className="h-6 w-6 text-[hsl(var(--terracotta))]" />
                <span className="text-sm font-medium">Trusted by communities worldwide</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-24 bg-sand/30 relative overflow-hidden" id="how-it-works">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513759565286-20e9c5fad06b?auto=format&fit=crop&w=2000&q=80')] bg-fixed bg-center bg-no-repeat bg-cover opacity-5" />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-serif font-semibold mb-4 relative inline-block">
                <span className="relative z-10">Why It's Special</span>
                <motion.div 
                  className="absolute -bottom-3 left-0 h-3 bg-[hsl(var(--terracotta))/30] w-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  viewport={{ once: true }}
                />
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-6">
                We've turned tradition into joyful, interest-free finance.
              </p>
            </motion.div>
          </div>
          
          {/* Interactive Process Steps with Image Reveals */}
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24 bg-[hsl(var(--sand))/50] py-16 px-4 md:px-8 rounded-3xl">
            {/* Step 1 */}
            <div className="order-1 md:order-1">
              <motion.div 
                className="relative rounded-2xl overflow-hidden image-reveal hover-lift shadow-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1517245386807-bb43f82c976d?auto=format&fit=crop&w=800&q=80" 
                  alt="People joining a circle" 
                  className="w-full h-[400px] object-cover"
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--foreground))/70] to-transparent"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                />
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 p-6"
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  viewport={{ once: true }}
                >
                  <span className="inline-block bg-[hsl(var(--gold))/10] text-[hsl(var(--gold))] text-sm font-bold px-3 py-1 rounded-full mb-3">Step 1</span>
                  <h3 className="text-white text-2xl font-serif font-semibold mb-2">Join Your Circle</h3>
                  <p className="text-white/80">Create or join a circle with people you trust</p>
                </motion.div>
              </motion.div>
            </div>
            
            <motion.div 
              className="order-2 md:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="text-[hsl(var(--gold))] font-mono text-sm tracking-wider">01 — JOIN</span>
              <h3 className="text-3xl font-serif font-semibold mb-6 mt-2">Trust-based with optional privacy</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Start your own circle or join an existing one. Invite friends, family, or colleagues to 
                participate in this collaborative saving journey.
              </p>
              
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">Recommended Size</p>
                  <p className="font-medium">8-15 members</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Invitation Methods</p>
                  <p className="font-medium">Email, Social Media, Direct Link</p>
                </div>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="mt-1 mr-4 flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--terracotta))/10] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                  </div>
                  <p>Set your circle size (8-15 members recommended)</p>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-4 flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--terracotta))/10] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                  </div>
                  <p>Determine contribution amount and frequency</p>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-4 flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--terracotta))/10] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                  </div>
                  <p>Invite members through email or social media</p>
                </li>
              </ul>
              
              <div className="mt-8 inline-block">
                <Button 
                  variant="terracotta" 
                  size="lg" 
                  rounded="full"
                  className="group bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))/90] text-white"
                >
                  Start Your Circle
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div 
              className="order-4 md:order-3"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="text-[hsl(var(--gold))] font-mono text-sm tracking-wider">02 — CONTRIBUTE</span>
              <h3 className="text-3xl font-serif font-semibold mb-6 mt-2">Regular Contributions</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Each member contributes an equal amount at regular intervals, building a 
                communal fund that grows with each cycle.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">Payment Methods</p>
                  <p className="font-medium">Multiple options</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contribution Cycle</p>
                  <p className="font-medium">Monthly or Custom</p>
                </div>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="mt-1 mr-4 flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--gold))/10] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[hsl(var(--gold))]" />
                  </div>
                  <p>Automated payment reminders</p>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-4 flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--gold))/10] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[hsl(var(--gold))]" />
                  </div>
                  <p>Multiple payment methods supported</p>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-4 flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--gold))/10] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[hsl(var(--gold))]" />
                  </div>
                  <p>Real-time fund tracking and transparency</p>
                </li>
              </ul>
            </motion.div>
            
            <div className="order-3 md:order-4">
              <motion.div 
                className="relative rounded-2xl overflow-hidden image-reveal hover-lift shadow-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=800&q=80" 
                  alt="Making contributions" 
                  className="w-full h-[400px] object-cover"
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-background to-transparent"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                />
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 p-6"
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  viewport={{ once: true }}
                >
                  <span className="inline-block bg-[hsl(var(--gold))/10] text-[hsl(var(--gold))] text-sm font-bold px-3 py-1 rounded-full mb-3">Step 2</span>
                  <h3 className="text-white text-2xl font-serif font-semibold mb-2">Make Contributions</h3>
                  <p className="text-white/80">Regular payments build your community fund</p>
                </motion.div>
              </motion.div>
            </div>
            
            {/* Step 3 */}
            <div className="order-5 md:order-5">
              <motion.div 
                className="relative rounded-2xl overflow-hidden image-reveal hover-lift shadow-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1579621970795-bb43f82c976d?auto=format&fit=crop&w=800&q=80" 
                  alt="Receiving funds" 
                  className="w-full h-[400px] object-cover"
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-background to-transparent"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                />
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 p-6"
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  viewport={{ once: true }}
                >
                  <span className="inline-block bg-[hsl(var(--forest))/10] text-[hsl(var(--forest))] text-sm font-bold px-3 py-1 rounded-full mb-3">Step 3</span>
                  <h3 className="text-white text-2xl font-serif font-semibold mb-2">Receive Your Payout</h3>
                  <p className="text-white/80">Get the full pool when it's your turn</p>
                </motion.div>
              </motion.div>
            </div>
            
            <motion.div 
              className="order-6 md:order-6"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="text-[hsl(var(--forest))] font-mono text-sm tracking-wider">03 — RECEIVE</span>
              <h3 className="text-3xl font-serif font-semibold mb-6 mt-2">Fair Distribution</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Each cycle, one member receives the entire pool through a transparent selection process,
                until everyone has had their turn.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">Selection Method</p>
                  <p className="font-medium">Transparent Lottery</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payout Speed</p>
                  <p className="font-medium">Same-day Transfer</p>
                </div>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="mt-1 mr-4 flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--forest))/10] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[hsl(var(--forest))]" />
                  </div>
                  <p>Blockchain-verified random selection</p>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-4 flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--forest))/10] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[hsl(var(--forest))]" />
                  </div>
                  <p>Immediate fund transfer to your account</p>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-4 flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--forest))/10] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[hsl(var(--forest))]" />
                  </div>
                  <p>Complete history of all transactions</p>
                </li>
              </ul>
              
              <div className="mt-8 inline-block">
                <Button 
                  variant="forest" 
                  size="lg" 
                  rounded="full"
                  className="group"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Circles Section */}
      <section ref={liveCirclesRef} className="py-24 bg-sand/30" id="circles">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-semibold mb-4">Live Circles</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join one of our active circles or create your own to start your saving journey.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {activeCircles.map((circle, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-background rounded-2xl overflow-hidden hover-lift shadow-lg"
              >
                <div className="relative h-48">
                  <img
                    src={circle.imageUrl}
                    alt={circle.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-display font-semibold text-white">{circle.name}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Members</p>
                      <p className="font-medium">{circle.members}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contribution</p>
                      <p className="font-medium">{circle.contribution}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Next Draw</p>
                      <p className="font-medium font-mono">{circle.nextDraw}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">View Details</Button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="gold" size="lg" rounded="full" className="group">
              View All Circles
              <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-terracotta/10" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] gradient-blur" />
        </div>
        <div className="container mx-auto px-4 py-12 relative">
          <div className="bg-background/80 backdrop-blur-md p-12 rounded-2xl max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-display font-semibold mb-6">Ready to Start Your Circle?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of people who are already saving together and building stronger communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" rounded="full" className="group">
                Create Your Circle
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="xl" variant="outline" rounded="full">
                Join Existing Circle
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--ochre))/20] py-16 bg-[hsl(var(--terracotta))] relative text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513759565286-20e9c5fad06b?auto=format&fit=crop&w=2000&q=80')] bg-center bg-no-repeat bg-cover opacity-10" />
        <div className="container mx-auto px-4 py-12 relative">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <CircleDollarSign className="h-8 w-8 text-white" />
                <span className="ml-2 text-2xl font-bold text-white">
                  <span className="font-serif">KURI</span>
                </span>
              </div>
              <p className="text-white/80 max-w-md mb-6">
                Built with care for circles that matter. Bringing ancestral saving traditions into the digital age with trust, transparency, and community at its core.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-serif font-semibold mb-6 text-white">Platform</h3>
              <ul className="space-y-4 text-white/80">
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Circles</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif font-semibold mb-6 text-white">Company</h3>
              <ul className="space-y-4 text-white/80">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[hsl(var(--ochre))/20] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-white/80">&copy; 2025 Kuri. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
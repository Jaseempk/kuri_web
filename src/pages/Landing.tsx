import { useRef, useState, useEffect } from "react";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { ConnectKitButton } from "connectkit";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Menu,
  X,
  Check,
  ChevronRight,
  Twitter,
  Instagram,
  Github,
  ChevronUp,
} from "lucide-react";

// Hero section background images
const heroBackgrounds = [
  {
    id: 1,
    imageUrl: "/images/trust.jpg",
    title: "The heart ",
    subtitle: "Of Kuri",
    description:
      "Kuri is inspired by global saving circles - from chit funds in India, to tandas in Mexico, to susus in West Africa.",
  },
  {
    id: 2,
    imageUrl: "/images/financialempowerment.jpg",
    title: "Empower Your",
    subtitle: "Financial Future",
    description:
      "Zero interest, zero hidden fees. Just the power of community saving to help you reach your goals.",
  },
  {
    id: 3,
    imageUrl: "/images/kate-bezzubets-z7btlKrdmrI-unsplash.jpg",
    title: "Transparent",
    subtitle: "& Trustworthy",
    description: "We've turned tradition into joyful, interest-free finance.",
  },
];

// Testimonial data
const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Small Business Owner",
    quote:
      "Kuri helped me save for my business expansion without taking on debt. The community aspect made the journey enjoyable rather than stressful.",
    imageUrl:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Freelance Designer",
    quote:
      "As someone with irregular income, Kuri circles gave me the structure I needed to save consistently. It's changed my financial habits completely.",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    name: "Aisha Okafor",
    role: "Healthcare Worker",
    quote:
      "My grandmother used to participate in susus back home. Kuri brings that tradition into the digital age while keeping the community spirit alive.",
    imageUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
  },
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
    imageUrl: "/images/homerenovators.jpg",
  },
  {
    id: 2,
    name: "Entrepreneurs Fund",
    members: 8,
    contribution: "$500 monthly",
    totalPool: "$4,000",
    nextDraw: "April 20, 2025",
    imageUrl:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: 3,
    name: "Education Savers",
    members: 15,
    contribution: "$200 monthly",
    totalPool: "$3,000",
    nextDraw: "April 25, 2025",
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=80",
  },
];

function App() {
  const navigate = useNavigate();
  // State for navigation
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Refs for sections
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);
  const liveCirclesRef = useRef(null);

  // Smooth scroll function
  const scrollToSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      // Close mobile menu if open
      if (isMenuOpen) setIsMenuOpen(false);

      // Smooth scroll to the element
      window.scrollTo({
        top: element.offsetTop - 80, // Offset for the fixed header
        behavior: "smooth",
      });
    }
  };

  // Scroll animations - using useScroll without destructuring unused variables
  useScroll();

  // Hero slider animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) =>
        prev === heroBackgrounds.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Testimonial rotation
  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) =>
        prev === testimonials.length - 1 ? 0 : prev + 1
      );
    }, 6000);

    return () => clearInterval(testimonialInterval);
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
        { id: "live-circles", ref: liveCirclesRef },
      ];

      for (const section of sections) {
        const element = section.ref.current;
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full backdrop-blur-md bg-black/20 border-b border-white/10 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="#" className="text-2xl font-bold flex items-center">
              <div className="relative">
                <div className="flex items-center">
                  <span className="font-sans font-extrabold text-[hsl(var(--gold))] text-2xl tracking-wide">
                    K
                  </span>
                  <span className="font-sans font-extrabold text-white text-2xl tracking-wide">
                    URI
                  </span>
                  <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-[hsl(var(--gold))] to-white"></div>
                </div>
              </div>
            </a>
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => scrollToSection("about")}
                className="text-white hover:text-[hsl(var(--gold))] transition-all font-medium drop-shadow-sm cursor-pointer relative group"
                aria-label="Navigate to About section"
              >
                About
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[hsl(var(--gold))] transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-white hover:text-[hsl(var(--gold))] transition-all font-medium drop-shadow-sm cursor-pointer relative group"
                aria-label="Navigate to How It Works section"
              >
                How It Works
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[hsl(var(--gold))] transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => scrollToSection("why-its-special")}
                className="text-white hover:text-[hsl(var(--gold))] transition-all font-medium drop-shadow-sm cursor-pointer relative group"
                aria-label="Navigate to Why It's Special section"
              >
                Why It's Special
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[hsl(var(--gold))] transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="text-white hover:text-[hsl(var(--gold))] transition-all font-medium drop-shadow-sm cursor-pointer relative group"
                aria-label="Navigate to Testimonials section"
              >
                Testimonials
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[hsl(var(--gold))] transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => scrollToSection("circles")}
                className="text-white hover:text-[hsl(var(--gold))] transition-all font-medium drop-shadow-sm cursor-pointer relative group"
                aria-label="Navigate to Live Circles section"
              >
                Live Circles
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[hsl(var(--gold))] transition-all duration-300 group-hover:w-full"></span>
              </button>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <ConnectKitButton />
          </div>
          <button
            className="md:hidden text-white p-1"
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
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/90 backdrop-blur-md border-b border-white/10"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection("about")}
                  className="py-2 text-white hover:text-[hsl(var(--gold))] transition-all font-medium cursor-pointer relative group w-full text-left"
                  aria-label="Navigate to About section"
                >
                  About
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[hsl(var(--gold))] transition-all duration-300 group-hover:w-full"></span>
                </button>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="py-2 text-white hover:text-[hsl(var(--gold))] transition-all font-medium cursor-pointer relative group w-full text-left"
                  aria-label="Navigate to How It Works section"
                >
                  How It Works
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[hsl(var(--gold))] transition-all duration-300 group-hover:w-full"></span>
                </button>
                <button
                  onClick={() => scrollToSection("why-its-special")}
                  className="py-2 text-white hover:text-[hsl(var(--gold))] transition-all font-medium cursor-pointer relative group w-full text-left"
                  aria-label="Navigate to Why It's Special section"
                >
                  Why It's Special
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[hsl(var(--gold))] transition-all duration-300 group-hover:w-full"></span>
                </button>
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className="py-2 text-white hover:text-[hsl(var(--gold))] transition-all font-medium cursor-pointer relative group w-full text-left"
                  aria-label="Navigate to Testimonials section"
                >
                  Testimonials
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[hsl(var(--gold))] transition-all duration-300 group-hover:w-full"></span>
                </button>
                <button
                  onClick={() => scrollToSection("circles")}
                  className="py-2 text-white hover:text-[hsl(var(--gold))] transition-all font-medium cursor-pointer relative group w-full text-left"
                  aria-label="Navigate to Live Circles section"
                >
                  Live Circles
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[hsl(var(--gold))] transition-all duration-300 group-hover:w-full"></span>
                </button>
                <div className="flex flex-col space-y-2 pt-2">
                  <ConnectKitButton />
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
            className={`slider-item ${index === activeSlide ? "active" : ""}`}
          >
            <div className="slider-overlay"></div>
            <img
              src={slide.imageUrl}
              alt={`Kuri community savings circle ${index + 1}`}
              className="slider-image"
              loading="lazy"
            />
          </div>
        ))}

        {/* Fixed content card that stays in place */}
        <div className="container mx-auto px-4 py-8 slider-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            whileHover={{
              y: -10,
              scale: 1.02,
              transition: { duration: 0.3, ease: "easeOut" },
            }}
            transition={{
              delay: 0.2,
              duration: 0.8,
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
                      <div className="mb-2 text-[hsl(var(--gold))] font-sans uppercase tracking-widest text-sm font-semibold drop-shadow-sm brightness-125">
                        Community-Powered Finance
                      </div>

                      <h2 className="text-4xl font-sans font-bold text-white mb-6 tracking-tight leading-[1.2]">
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
                        className="text-base md:text-lg font-sans text-white/95 mb-10 max-w-xl font-medium drop-shadow-sm"
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
                    onClick={() => navigate("/dapp")}
                  >
                    <span className="relative z-20 flex items-center font-sans font-medium">
                      Create Your Circle
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>

                  <Button
                    size="lg"
                    className="relative group overflow-hidden rounded-xl bg-black/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-14 px-8 backdrop-blur-[1px]"
                    onClick={() => navigate("/dapp")}
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
                    activeSlide === index
                      ? "opacity-100 scale-110"
                      : "opacity-50 hover:opacity-75"
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
          className="absolute bottom-12 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center text-white/80"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-sm mb-2 font-light tracking-wider">Scroll</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
          >
            <ChevronUp className="rotate-180" size={20} />
          </motion.div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full border border-white/20 rotating-circle opacity-70"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full border border-white/10 rotating-circle-reverse opacity-50"></div>

        {/* Section transition blend effect */}
        <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden">
          {/* Multiple wave layers with increasing opacity */}
          <svg
            className="absolute bottom-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ transform: "translateY(10%)" }}
          >
            <path
              fill="hsl(var(--sand))"
              fillOpacity="0.3"
              d="M0,128L48,144C96,160,192,192,288,186.7C384,181,480,139,576,138.7C672,139,768,181,864,202.7C960,224,1056,224,1152,202.7C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>

          <svg
            className="absolute bottom-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ transform: "translateY(20%)" }}
          >
            <path
              fill="hsl(var(--sand))"
              fillOpacity="0.5"
              d="M0,160L48,149.3C96,139,192,117,288,117.3C384,117,480,139,576,165.3C672,192,768,224,864,218.7C960,213,1056,171,1152,149.3C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>

          <svg
            className="absolute bottom-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ transform: "translateY(30%)" }}
          >
            <path
              fill="hsl(var(--sand))"
              fillOpacity="0.7"
              d="M0,192L48,181.3C96,171,192,149,288,154.7C384,160,480,192,576,192C672,192,768,160,864,154.7C960,149,1056,171,1152,181.3C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>

          {/* Final solid wave for complete transition */}
          <svg
            className="absolute bottom-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="hsl(var(--sand))"
              fillOpacity="0.9"
              d="M0,224L48,229.3C96,235,192,245,288,240C384,235,480,213,576,213.3C672,213,768,235,864,234.7C960,235,1056,213,1152,202.7C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>

          {/* Gradient overlay for smoother transition */}
          <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-b from-transparent via-[hsl(var(--sand))/20] to-[hsl(var(--sand))]"></div>
        </div>
      </section>

      {/* About Section */}
      <section
        ref={aboutRef}
        className="py-16 relative overflow-hidden bg-[hsl(var(--sand))]"
        id="about"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513759565286-20e9c5fad06b?auto=format&fit=crop&w=2000&q=80')] bg-fixed bg-center bg-no-repeat bg-cover opacity-5" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-sans font-semibold mb-4 relative inline-block">
                <span className="relative z-10">About Kuri</span>
                <motion.div
                  className="absolute -bottom-3 left-0 h-3 bg-[hsl(var(--terracotta))/30] w-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  viewport={{ once: true }}
                />
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-6">
                A modern revival of time-honored community saving traditions
                from around the world.
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
                loading="lazy"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-sans font-semibold mb-6">
                The Heart of Kuri
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Kuri revives ancient community saving traditions for today's
                world. A circle of trust where friends, family, and communities
                pool resources to help each member flourish, one by one.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                No banks, no interest, no debt—just people supporting people.
                Your circle becomes your safety net, turning individual
                contributions into collective empowerment.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                <span className="font-semibold">How it works:</span> Join or
                create a circle with people you trust. Everyone contributes an
                equal amount regularly, and each cycle, one member receives the
                entire pool through a fair, transparent raffle. This continues
                until everyone has had their turn.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why It's Special Section */}
      <section
        id="why-its-special"
        className="py-16 bg-sand/30 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513759565286-20e9c5fad06b?auto=format&fit=crop&w=2000&q=80')] bg-fixed bg-center bg-no-repeat bg-cover opacity-5" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="text-[hsl(var(--terracotta))] font-mono text-sm tracking-wider uppercase">
                What makes Kuri different
              </span>
              <h2 className="text-4xl font-sans font-semibold mb-4 relative inline-block">
                <span className="relative z-10">Why It's Special</span>
                <motion.div
                  className="absolute -bottom-3 left-0 h-3 bg-[hsl(var(--terracotta))]/30 w-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  viewport={{ once: true }}
                />
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground mt-6">
                Kuri combines ancient community finance traditions with modern
                technology to create something truly unique.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-28 h-28 rounded-full bg-[hsl(var(--sand))] border-2 border-[hsl(var(--gold))] flex items-center justify-center mb-6 shadow-md overflow-hidden">
                <img
                  src="/images/zeroInterest.jpg"
                  alt="Zero interest"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-sans font-medium mb-3">
                Zero-interest,
                <br />
                Zero-shame
              </h3>
              <p className="text-muted-foreground">
                No predatory fees or interest rates. Just people helping people
                achieve financial goals together.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-28 h-28 rounded-full bg-[hsl(var(--sand))] border-2 border-[hsl(var(--gold))] flex items-center justify-center mb-6 shadow-md overflow-hidden">
                <img
                  src="/images/trustvibe.jpg"
                  alt="Trust based"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-sans font-medium mb-3">
                Trust-based
                <br />
                with optional privacy
              </h3>
              <p className="text-muted-foreground">
                Built on community trust with flexible privacy options to suit
                your comfort level.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="w-28 h-28 rounded-full bg-[hsl(var(--sand))] border-2 border-[hsl(var(--gold))] flex items-center justify-center mb-6 shadow-md overflow-hidden">
                <img
                  src="/images/communityvibe.jpg"
                  alt="Community owned"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-sans font-medium mb-3">
                Community-
                <br />
                owned vibe
              </h3>
              <p className="text-muted-foreground">
                Created by and for communities, with decisions made collectively
                by members.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="w-28 h-28 rounded-full bg-[hsl(var(--terracotta))] flex items-center justify-center mb-6 shadow-md overflow-hidden">
                <img
                  src="/images/fairplay.jpg"
                  alt="Fair raffles"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-sans font-medium mb-3">
                Fair, verifiable
                <br />
                raffles
              </h3>
              <p className="text-muted-foreground">
                Transparent selection process ensures everyone gets their turn,
                verified on blockchains trustless.
              </p>
            </motion.div>
          </div>

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <Button
              size="lg"
              className="bg-[hsl(var(--terracotta))] hover:bg-white hover:text-[hsl(var(--terracotta))] text-white border border-[hsl(var(--terracotta))] group"
            >
              Learn More About Our Approach
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        ref={howItWorksRef}
        className="py-16 bg-sand/30 relative overflow-hidden"
        id="how-it-works"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513759565286-20e9c5fad06b?auto=format&fit=crop&w=2000&q=80')] bg-fixed bg-center bg-no-repeat bg-cover opacity-5" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-sans font-semibold mb-4 relative inline-block">
                <span className="relative z-10">How It Works</span>
                <motion.div
                  className="absolute -bottom-3 left-0 h-3 bg-[hsl(var(--terracotta))/30] w-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  viewport={{ once: true }}
                />
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We've turned tradition into joyful, interest-free finance.
              </p>
            </motion.div>
          </div>

          {/* Interactive Process Steps with Image Reveals */}
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24 bg-[hsl(var(--sand))/50] py-16 px-4 md:px-8 rounded-3xl">
            {/* Step 1: Image on LEFT */}
            <div className="order-1 md:order-1">
              <motion.div
                className="relative rounded-2xl overflow-hidden image-reveal hover-lift shadow-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -10,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                style={{
                  background: `url('/images/joinyourcircle.jpg') center/cover no-repeat`,
                }}
              >
                <div className="w-full h-[400px]"></div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 p-6 z-10"
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white text-2xl font-sans font-semibold mb-2 drop-shadow-md">
                    Join Your Circle
                  </h3>
                  <p className="text-white/90 drop-shadow-md font-medium">
                    Create or join a circle with people you trust
                  </p>
                </motion.div>
              </motion.div>
            </div>

            {/* Step 1: Text on RIGHT */}
            <motion.div
              className="order-2 md:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="text-[hsl(var(--gold))] font-mono text-sm tracking-wider">
                01 — JOIN
              </span>
              <h3 className="text-3xl font-sans font-semibold mb-6 mt-2">
                Trust-based with optional privacy
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Start your own circle or join an existing one. Invite friends,
                family, or colleagues to participate in this collaborative
                saving journey.
              </p>

              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Recommended Size
                  </p>
                  <p className="font-medium">Any number of trusted people</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Invitation Methods
                  </p>
                  <p className="font-medium">
                    Email, Social Media, Direct Link
                  </p>
                </div>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="mt-1 mr-4 flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--terracotta))/10] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                  </div>
                  <p>Set your circle size (number of participants)</p>
                </li>
                <li className="flex items-start">
                  <div className="mt-1 mr-4 flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--terracotta))/10] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                  </div>
                  <p>
                    Determine contribution amount and frequency is set
                    automatically based on the number participants
                  </p>
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
                  variant="default"
                  size="lg"
                  className="group bg-[hsl(var(--terracotta))] hover:bg-white hover:text-[hsl(var(--terracotta))] text-white border border-[hsl(var(--terracotta))]"
                >
                  Start Your Circle
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>

            {/* Step 2: Text on LEFT */}
            <motion.div
              className="order-3 md:order-3"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="text-[hsl(var(--gold))] font-mono text-sm tracking-wider">
                02 — CONTRIBUTE
              </span>
              <h3 className="text-3xl font-sans font-semibold mb-6 mt-2">
                Regular Contributions
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Each member contributes an equal amount at regular intervals,
                building a communal fund that grows with each cycle.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Payment Methods
                  </p>
                  <p className="font-medium">Multiple options</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Contribution Cycle
                  </p>
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

            {/* Step 2: Image on RIGHT */}
            <div className="order-4 md:order-4">
              <motion.div
                className="relative rounded-2xl overflow-hidden image-reveal hover-lift shadow-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -10,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                style={{
                  background: `url('/images/makecontributions.jpg') center/cover no-repeat`,
                }}
              >
                <div className="w-full h-[400px]"></div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 p-6 z-10"
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white text-2xl font-sans font-semibold mb-2 drop-shadow-md">
                    Make Contributions
                  </h3>
                  <p className="text-white/90 drop-shadow-md font-medium">
                    Regular payments build your community fund
                  </p>
                </motion.div>
              </motion.div>
            </div>

            {/* Step 3: Image on LEFT */}
            <div className="order-5 md:order-5">
              <motion.div
                className="relative rounded-2xl overflow-hidden image-reveal hover-lift shadow-lg"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -10,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                style={{
                  background: `url('/images/fairdistribution.jpg') center/cover no-repeat`,
                }}
              >
                <div className="w-full h-[400px]"></div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 p-6 z-10"
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white text-2xl font-sans font-semibold mb-2 drop-shadow-md">
                    Receive Your Payout
                  </h3>
                  <p className="text-white/90 drop-shadow-md font-medium">
                    Get the full pool when it's your turn
                  </p>
                </motion.div>
              </motion.div>
            </div>

            {/* Step 3: Text on RIGHT */}
            <motion.div
              className="order-6 md:order-6"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="text-[hsl(var(--forest))] font-mono text-sm tracking-wider">
                03 — RECEIVE
              </span>
              <h3 className="text-3xl font-sans font-semibold mb-6 mt-2">
                Fair Distribution
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Each cycle, one member receives the entire pool through a
                transparent selection process, until everyone has had their
                turn. Last three payouts are always gonna get an extra yield,
                for their patience.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Selection Method
                  </p>
                  <p className="font-medium">Random Verifiable Raffle</p>
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
                  className="bg-[hsl(var(--forest))] hover:bg-white hover:text-[hsl(var(--forest))] text-white border border-[hsl(var(--forest))] group"
                >
                  Start Your Circle
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        ref={testimonialsRef}
        className="py-16 relative overflow-hidden"
        id="testimonials"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513759565286-20e9c5fad06b?auto=format&fit=crop&w=2000&q=80')] bg-fixed bg-center bg-no-repeat bg-cover opacity-5 -z-10" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <blockquote className="text-center max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTestimonial}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <div className="mb-8 relative">
                      <motion.img
                        src={testimonials[activeTestimonial].imageUrl}
                        alt={testimonials[activeTestimonial].name}
                        className="w-20 h-20 rounded-full mx-auto mb-6 border-4 border-terracotta/20 object-cover shadow-lg"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <motion.p
                      className="text-2xl font-sans text-muted-foreground mb-8 italic"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      "{testimonials[activeTestimonial].quote}"
                    </motion.p>
                    <motion.footer
                      className="font-mono text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <cite>
                        {testimonials[activeTestimonial].name} ·{" "}
                        {testimonials[activeTestimonial].role}
                      </cite>
                    </motion.footer>
                  </motion.div>
                </AnimatePresence>

                {/* Testimonial navigation dots */}
                <div className="flex justify-center mt-8 space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTestimonial(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeTestimonial === index
                          ? "bg-[hsl(var(--terracotta))] w-4"
                          : "bg-[hsl(var(--terracotta))/30]"
                      }`}
                      aria-label={`View testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </blockquote>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Circles Section */}
      <section ref={liveCirclesRef} className="py-16 bg-sand/30" id="circles">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-sans font-semibold mb-4">
              Live Circles
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join one of our active circles or create your own to start your
              saving journey.
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
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-sans font-semibold text-white">
                      {circle.name}
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Members</p>
                      <p className="font-medium">{circle.members}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Contribution
                      </p>
                      <p className="font-medium">{circle.contribution}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Next Draw</p>
                      <p className="font-medium font-mono">{circle.nextDraw}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button
              variant="gold"
              size="lg"
              className="bg-[hsl(var(--gold))] hover:bg-white hover:text-[hsl(var(--gold))] text-white border border-[hsl(var(--gold))] group"
            >
              View All Circles
              <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-terracotta/10" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] gradient-blur" />
        </div>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="bg-background/80 backdrop-blur-md p-12 rounded-2xl max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-sans font-semibold mb-6">
              Ready to Start Your Circle?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of people who are already saving together and
              building stronger communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" className="group">
                Create Your Circle
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="xl" variant="outline">
                Join Existing Circle
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--ochre))/20] py-8 bg-[hsl(var(--terracotta))] relative text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513759565286-20e9c5fad06b?auto=format&fit=crop&w=2000&q=80')] bg-center bg-no-repeat bg-cover opacity-10" />
        <div className="container mx-auto px-4 py-4 relative">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="relative flex items-center">
                  <span className="font-sans font-extrabold text-[hsl(var(--gold))] text-2xl tracking-wide">
                    K
                  </span>
                  <span className="font-sans font-extrabold text-white text-2xl tracking-wide">
                    URI
                  </span>
                  <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-[hsl(var(--gold))] to-white"></div>
                </div>
              </div>
              <p className="text-white/80 max-w-md mb-6">
                Built with care for circles that matter. Bringing ancestral
                saving traditions into the digital age with trust, transparency,
                and community at its core.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-sans font-semibold mb-6 text-white">
                Platform
              </h3>
              <ul className="space-y-4 text-white/80">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    How it Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Circles
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-sans font-semibold mb-6 text-white">
                Company
              </h3>
              <ul className="space-y-4 text-white/80">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[hsl(var(--ochre))/20] mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-white/80">
              &copy; 2025 Kuri. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-2 md:mt-0">
              <a
                href="#"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 rounded-full bg-[hsl(var(--terracotta))] text-white shadow-lg hover:bg-[hsl(var(--terracotta))/90] transition-all z-50"
            aria-label="Scroll to top"
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

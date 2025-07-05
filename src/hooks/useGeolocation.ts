import { useState, useEffect } from "react";

interface LocationData {
  country: string;
  country_name: string;
  region: string;
  city: string;
  ip: string;
  timestamp?: number;
}

interface LocalizedContent {
  description: string;
  localTerm: string;
  localTermMeaning: string;
}

const CACHE_KEY = "kuri_geolocation_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const getLocalizedContent = (country: string): LocalizedContent => {
  const defaultContent = {
    description:
      "Join the future of collaborative finance. Zero interest, zero hidden fees. Just the power of community saving to help you reach your goals.",
    localTerm: "Community Savings",
    localTermMeaning: "traditional savings circles",
  };

  const localizedContent: Record<string, LocalizedContent> = {
    NG: {
      // Nigeria
      description:
        "It's like Ajo, Esusu, or Adashi - but your money is always safe and protected. No organizer can disappear with your funds, and you can save in dollars to protect against inflation.",
      localTerm: "Ajo/Esusu/Adashi",
      localTermMeaning: "traditional Nigerian rotating savings",
    },
    KE: {
      // Kenya
      description:
        "Think of it as a modern Chama - but with guaranteed safety and dollar savings. All the trust and community spirit you love, with complete protection from fraud.",
      localTerm: "Chama",
      localTermMeaning: "traditional Kenyan investment groups",
    },
    IN: {
      // India
      description:
        "Just like Chitfunds, but completely transparent and secure. No organizer can run away with your money, and you can save in dollars to beat inflation.",
      localTerm: "Chitfunds",
      localTermMeaning: "traditional Indian rotating savings",
    },
    IR: {
      // Iran
      description:
        "Similar to Sandogh-e-Gharzolhasaneh, but with global access and dollar stability. Interest-free community savings with complete transparency and security.",
      localTerm: "Sandogh-e-Gharzolhasaneh",
      localTermMeaning: "traditional Iranian non-interest loan funds",
    },
    TR: {
      // Turkey
      description:
        "Like Altın Günü or El Birliği, but digitally secure and inflation-proof. Save in dollars while keeping the community spirit, with guaranteed safety.",
      localTerm: "Altın Günü/El Birliği",
      localTermMeaning: "traditional Turkish collective savings",
    },
    PK: {
      // Pakistan
      description:
        "Similar to Committee systems, but with complete transparency and dollar stability. All the benefits of community savings, with guaranteed security against fraud.",
      localTerm: "Committee",
      localTermMeaning: "traditional Pakistani rotating savings",
    },
    BD: {
      // Bangladesh
      description:
        "Like Samity or rotating savings, but digitally secure and globally accessible. Community-powered savings with modern safety and dollar protection.",
      localTerm: "Samity",
      localTermMeaning: "traditional Bangladeshi savings groups",
    },
    EG: {
      // Egypt
      description:
        "Similar to Gam'iya, but with guaranteed security and dollar stability. Traditional community savings with modern safety and complete transparency.",
      localTerm: "Gam'iya",
      localTermMeaning: "traditional Egyptian rotating savings",
    },
    ZA: {
      // South Africa
      description:
        "Like Stokvels, but digitally secure and inflation-protected. Community savings with global reach and guaranteed safety from fraud.",
      localTerm: "Stokvels",
      localTermMeaning: "traditional South African savings clubs",
    },
    GH: {
      // Ghana
      description:
        "Similar to Susu, but with complete transparency and dollar stability. Traditional community savings with modern security and protection from fraud.",
      localTerm: "Susu",
      localTermMeaning: "traditional Ghanaian rotating savings",
    },
    MX: {
      // Mexico
      description:
        "Like Tandas, but with guaranteed security and dollar stability. Traditional community savings with modern transparency and complete protection from fraud.",
      localTerm: "Tandas",
      localTermMeaning: "traditional Mexican rotating savings",
    },
    CO: {
      // Colombia
      description:
        "Similar to Natillera, but digitally secure and inflation-protected. Community savings with complete transparency and guaranteed safety from fraud.",
      localTerm: "Natillera",
      localTermMeaning: "traditional Colombian savings groups",
    },
    PE: {
      // Peru
      description:
        "Like Juntas, but with modern security and dollar stability. Traditional community savings with guaranteed transparency and protection from fraud.",
      localTerm: "Juntas",
      localTermMeaning: "traditional Peruvian savings circles",
    },
    PH: {
      // Philippines
      description:
        "Similar to Paluwagan, but digitally secure and globally accessible. Community savings with complete transparency and guaranteed protection from fraud.",
      localTerm: "Paluwagan",
      localTermMeaning: "traditional Filipino rotating savings",
    },
    ID: {
      // Indonesia
      description:
        "Like Arisan, but with guaranteed security and dollar savings. Traditional community spirit with modern safety - no one can disappear with your money.",
      localTerm: "Arisan",
      localTermMeaning: "traditional Indonesian rotating savings",
    },
    TH: {
      // Thailand
      description:
        "Similar to Chit Fund systems, but digitally secure and inflation-protected. Community savings with complete transparency and guaranteed safety.",
      localTerm: "Chit Fund",
      localTermMeaning: "traditional Thai savings groups",
    },
    VN: {
      // Vietnam
      description:
        "Like Hui or Ho, but with modern security and dollar stability. Traditional community savings with guaranteed transparency and protection from fraud.",
      localTerm: "Hui/Ho",
      localTermMeaning: "traditional Vietnamese rotating savings",
    },
    ET: {
      // Ethiopia
      description:
        "Similar to Equb, but digitally secure and globally accessible. Community savings with complete transparency and guaranteed protection from fraud.",
      localTerm: "Equb",
      localTermMeaning: "traditional Ethiopian rotating savings",
    },
    SN: {
      // Senegal
      description:
        "Like Tontines, but with guaranteed security and dollar stability. Traditional community savings with modern transparency and complete protection from fraud.",
      localTerm: "Tontines",
      localTermMeaning: "traditional Senegalese savings groups",
    },
    JM: {
      // Jamaica
      description:
        "Similar to Partner, but digitally secure and inflation-protected. Community savings with complete transparency and guaranteed safety from fraud.",
      localTerm: "Partner",
      localTermMeaning: "traditional Jamaican rotating savings",
    },
  };

  return localizedContent[country] || defaultContent;
};

const getCachedLocation = (): LocationData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      const now = Date.now();
      if (
        parsedCache.timestamp &&
        now - parsedCache.timestamp < CACHE_DURATION
      ) {
        return parsedCache;
      }
    }
  } catch (error) {
    console.warn("Error reading location cache:", error);
  }
  return null;
};

const setCachedLocation = (location: LocationData): void => {
  try {
    const locationWithTimestamp = {
      ...location,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(locationWithTimestamp));
  } catch (error) {
    console.warn("Error caching location:", error);
  }
};

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check cache first
        const cachedLocation = getCachedLocation();
        if (cachedLocation) {
          setLocation(cachedLocation);
          setIsLoading(false);
          return;
        }

        const response = await fetch("https://ipapi.co/json/");

        if (!response.ok) {
          throw new Error("Failed to fetch location data");
        }

        const data = await response.json();

        // Check if the response contains an error (rate limited, etc.)
        if (data.error) {
          throw new Error(data.reason || "Location service error");
        }

        setLocation(data);
        setCachedLocation(data);
      } catch (err) {
        console.warn("Geolocation failed:", err);
        setError(err instanceof Error ? err.message : "Failed to get location");
        // Don't set location to null here - let it remain null for fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocation();
  }, []);

  const localizedContent = location
    ? getLocalizedContent(location.country)
    : getLocalizedContent("");

  return {
    location,
    isLoading,
    error,
    localizedContent,
  };
};

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar } from "lucide-react";

// Dot matrix patterns for digits 0-9 and colon
const dotPatterns = {
  "0": [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  "1": [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
  ],
  "2": [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  "3": [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  "4": [
    [0, 0, 0, 1, 0],
    [0, 0, 1, 1, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0],
  ],
  "5": [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  "6": [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  "7": [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0],
  ],
  "8": [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  "9": [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  ":": [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  " ": [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
};

interface CharacterGridProps {
  char: string;
  shouldAnimate: boolean;
}

function CharacterGrid({ char, shouldAnimate }: CharacterGridProps) {
  const pattern =
    dotPatterns[char as keyof typeof dotPatterns] || dotPatterns["0"];

  return (
    <motion.div
      key={`char-${char}`}
      initial={shouldAnimate ? { rotateY: -90, opacity: 0 } : false}
      animate={
        shouldAnimate ? { rotateY: 0, opacity: 1 } : { rotateY: 0, opacity: 1 }
      }
      transition={{
        duration: 0.25,
        type: "tween",
        ease: "easeOut",
      }}
      className="flex flex-col gap-[1px] sm:gap-[1.5px] lg:gap-[1px]"
    >
      {pattern.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-[1px] sm:gap-[1.5px] lg:gap-[1px]"
        >
          {row.map((dot, colIndex) => (
            <motion.div
              key={colIndex}
              animate={{
                scale: dot === 1 ? 1 : 0.8,
                opacity: dot === 1 ? 1 : 0.3,
              }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
                delay: shouldAnimate ? (rowIndex + colIndex) * 0.005 : 0,
              }}
              className={`w-[2px] h-[2px] sm:w-[2.5px] sm:h-[2.5px] lg:w-[2px] lg:h-[2px] xl:w-[2.5px] xl:h-[2.5px] rounded-[0.5px] ${
                dot === 1 ? "bg-white" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      ))}
    </motion.div>
  );
}

interface TimeUnit {
  value: string;
  hasChanged: boolean;
  digits: {
    first: { value: string; hasChanged: boolean };
    second: { value: string; hasChanged: boolean };
  };
}

interface CountdownCardProps {
  title: string;
  targetTimestamp: number;
  icon: React.ReactNode;
  accentColor: "forest" | "ochre" | "terracotta";
  dateString: string;
}

export function CountdownCard({
  title,
  targetTimestamp,
  icon,
  accentColor,
  dateString,
}: CountdownCardProps) {
  const [timeUnits, setTimeUnits] = useState<{
    days: TimeUnit;
    hours: TimeUnit;
    minutes: TimeUnit;
    seconds: TimeUnit;
  }>({
    days: {
      value: "00",
      hasChanged: false,
      digits: {
        first: { value: "0", hasChanged: false },
        second: { value: "0", hasChanged: false },
      },
    },
    hours: {
      value: "00",
      hasChanged: false,
      digits: {
        first: { value: "0", hasChanged: false },
        second: { value: "0", hasChanged: false },
      },
    },
    minutes: {
      value: "00",
      hasChanged: false,
      digits: {
        first: { value: "0", hasChanged: false },
        second: { value: "0", hasChanged: false },
      },
    },
    seconds: {
      value: "00",
      hasChanged: false,
      digits: {
        first: { value: "0", hasChanged: false },
        second: { value: "0", hasChanged: false },
      },
    },
  });

  const previousTimeRef = useRef<string>("");

  const createTimeUnit = useCallback(
    (newValue: string, prevUnit: TimeUnit): TimeUnit => {
      const newFirstDigit = newValue[0];
      const newSecondDigit = newValue[1];

      return {
        value: newValue,
        hasChanged: prevUnit.value !== newValue,
        digits: {
          first: {
            value: newFirstDigit,
            hasChanged: prevUnit.digits.first.value !== newFirstDigit,
          },
          second: {
            value: newSecondDigit,
            hasChanged: prevUnit.digits.second.value !== newSecondDigit,
          },
        },
      };
    },
    []
  );

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTimestamp - now;

      if (diff <= 0) {
        const zeroTime = {
          days: {
            value: "00",
            hasChanged: false,
            digits: {
              first: { value: "0", hasChanged: false },
              second: { value: "0", hasChanged: false },
            },
          },
          hours: {
            value: "00",
            hasChanged: false,
            digits: {
              first: { value: "0", hasChanged: false },
              second: { value: "0", hasChanged: false },
            },
          },
          minutes: {
            value: "00",
            hasChanged: false,
            digits: {
              first: { value: "0", hasChanged: false },
              second: { value: "0", hasChanged: false },
            },
          },
          seconds: {
            value: "00",
            hasChanged: false,
            digits: {
              first: { value: "0", hasChanged: false },
              second: { value: "0", hasChanged: false },
            },
          },
        };
        setTimeUnits(zeroTime);
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      const newDays = days.toString().padStart(2, "0");
      const newHours = hours.toString().padStart(2, "0");
      const newMinutes = minutes.toString().padStart(2, "0");
      const newSeconds = seconds.toString().padStart(2, "0");

      const newTimeString = `${newDays}:${newHours}:${newMinutes}:${newSeconds}`;

      // Only update if time has actually changed
      if (newTimeString !== previousTimeRef.current) {
        setTimeUnits((prev) => ({
          days: createTimeUnit(newDays, prev.days),
          hours: createTimeUnit(newHours, prev.hours),
          minutes: createTimeUnit(newMinutes, prev.minutes),
          seconds: createTimeUnit(newSeconds, prev.seconds),
        }));
        previousTimeRef.current = newTimeString;
      }
    };

    const timer = setInterval(updateTimer, 1000);
    updateTimer(); // Initial update

    return () => clearInterval(timer);
  }, [targetTimestamp, createTimeUnit]);

  const getColorClasses = () => {
    switch (accentColor) {
      case "forest":
        return {
          textColor: "text-[hsl(var(--forest))]",
          borderColor: "border-[hsl(var(--forest))]",
          cardBg: "bg-white/20 backdrop-blur-xl",
          glassAccent: "shadow-emerald-500/10",
          cardBorder: "border-gray-300/80 border-2",
        };
      case "ochre":
        return {
          textColor: "text-[hsl(var(--ochre))]",
          borderColor: "border-[hsl(var(--ochre))]",
          cardBg: "bg-white/20 backdrop-blur-xl",
          glassAccent: "shadow-amber-500/10",
          cardBorder: "border-gray-300/80 border-2",
        };
      case "terracotta":
        return {
          textColor: "text-[hsl(var(--terracotta))]",
          borderColor: "border-[hsl(var(--terracotta))]",
          cardBg: "bg-white/20 backdrop-blur-xl",
          glassAccent: "shadow-orange-500/10",
          cardBorder: "border-gray-300/80 border-2",
        };
    }
  };

  const colors = getColorClasses();
  const daysLeft = Math.floor(
    (targetTimestamp - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Create the display string with granular digit change detection
  const displayElements = useMemo(
    () => [
      {
        chars: [
          {
            value: timeUnits.days.digits.first.value,
            hasChanged: timeUnits.days.digits.first.hasChanged,
          },
          {
            value: timeUnits.days.digits.second.value,
            hasChanged: timeUnits.days.digits.second.hasChanged,
          },
        ],
        label: "d",
        group: "days",
      },
      {
        chars: [{ value: ":", hasChanged: false }],
        label: "",
        group: "separator",
      },
      {
        chars: [
          {
            value: timeUnits.hours.digits.first.value,
            hasChanged: timeUnits.hours.digits.first.hasChanged,
          },
          {
            value: timeUnits.hours.digits.second.value,
            hasChanged: timeUnits.hours.digits.second.hasChanged,
          },
        ],
        label: "h",
        group: "hours",
      },
      {
        chars: [{ value: ":", hasChanged: false }],
        label: "",
        group: "separator",
      },
      {
        chars: [
          {
            value: timeUnits.minutes.digits.first.value,
            hasChanged: timeUnits.minutes.digits.first.hasChanged,
          },
          {
            value: timeUnits.minutes.digits.second.value,
            hasChanged: timeUnits.minutes.digits.second.hasChanged,
          },
        ],
        label: "m",
        group: "minutes",
      },
      {
        chars: [{ value: ":", hasChanged: false }],
        label: "",
        group: "separator",
      },
      {
        chars: [
          {
            value: timeUnits.seconds.digits.first.value,
            hasChanged: timeUnits.seconds.digits.first.hasChanged,
          },
          {
            value: timeUnits.seconds.digits.second.value,
            hasChanged: timeUnits.seconds.digits.second.hasChanged,
          },
        ],
        label: "s",
        group: "seconds",
      },
    ],
    [timeUnits]
  );

  return (
    <div
      className={`${colors.cardBg} ${colors.cardBorder} ${colors.glassAccent} rounded-3xl p-4 sm:p-6 shadow-2xl hover:shadow-3xl hover:bg-white/25 hover:border-gray-400/90 transition-all duration-300 relative overflow-hidden`}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-3xl"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h4 className="text-gray-800 font-semibold text-base sm:text-lg drop-shadow-sm">
            {title}
          </h4>
          <div
            className={`${colors.textColor} ${colors.borderColor} bg-white/30 backdrop-blur-md border-2 px-2 py-1 sm:px-3 sm:py-1 rounded-lg text-xs sm:text-sm font-medium shadow-lg hover:shadow-xl hover:bg-white/40 transform hover:scale-105 transition-all duration-200 cursor-default`}
          >
            {new Date(targetTimestamp).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>

        {/* Time Display */}
        <div className="mb-4 sm:mb-4"></div>

        {/* Dot Matrix Display in Black Container - Mobile Optimized */}
        <div className="bg-black/90 backdrop-blur-sm rounded-2xl px-4 py-4 sm:px-6 sm:py-5 lg:px-4 lg:py-3 xl:px-5 xl:py-4 flex justify-center items-center overflow-hidden shadow-2xl border border-white/10">
          <div className="flex gap-1 sm:gap-2 lg:gap-1 xl:gap-1.5 items-center justify-center flex-wrap max-w-full">
            {displayElements.map((element, elementIndex) => (
              <div
                key={`element-${elementIndex}`}
                className="flex gap-1 sm:gap-1.5 lg:gap-0.5 xl:gap-1 items-center"
              >
                {element.chars.map((char, charIndex) => (
                  <CharacterGrid
                    key={`${elementIndex}-${charIndex}-${char.value}`}
                    char={char.value}
                    shouldAnimate={char.hasChanged && char.value !== ":"}
                  />
                ))}
                {element.label && (
                  <div className="text-white text-[10px] sm:text-xs lg:text-[10px] xl:text-xs ml-1 sm:ml-1.5 lg:ml-0.5 xl:ml-1 opacity-70 font-mono leading-none">
                    {element.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DualCountdownProps {
  raffleTimestamp: number;
  depositTimestamp: number;
  raffleDate: string;
  depositDate: string;
}

export function DualCountdown({
  raffleTimestamp,
  depositTimestamp,
  raffleDate,
  depositDate,
}: DualCountdownProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <CountdownCard
        title="Next Raffle"
        targetTimestamp={raffleTimestamp}
        icon={<Trophy className="w-5 h-5" />}
        accentColor="forest"
        dateString={raffleDate}
      />
      <CountdownCard
        title="Next Deposit Due"
        targetTimestamp={depositTimestamp}
        icon={<Calendar className="w-5 h-5" />}
        accentColor="ochre"
        dateString={depositDate}
      />
    </div>
  );
}

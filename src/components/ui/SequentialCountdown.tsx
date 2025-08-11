import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar } from "lucide-react";
import { CountdownCard } from "./DotMatrixCountdown";
import { 
  useCountdownPhase, 
  shouldShowCountdown, 
  getCountdownTitle, 
  getCountdownAccentColor 
} from "../../hooks/useCountdownPhase";

interface SequentialCountdownProps {
  raffleTimestamp: number;
  depositTimestamp: number;
  raffleDate: string;
  depositDate: string;
}

export function SequentialCountdown({
  raffleTimestamp,
  depositTimestamp,
  raffleDate,
  depositDate,
}: SequentialCountdownProps) {
  const phaseInfo = useCountdownPhase(depositTimestamp, raffleTimestamp);

  // Don't show countdown during transition phase
  if (!shouldShowCountdown(phaseInfo)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/20 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-lg text-center max-w-xs w-full"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-[hsl(var(--terracotta))]" />
          <h4 className="text-gray-800 font-semibold text-lg">Cycle Complete</h4>
        </div>
        <p className="text-sm text-gray-600">
          {phaseInfo.phaseDescription}
        </p>
      </motion.div>
    );
  }

  // Determine which countdown to show based on current phase
  const activeTimestamp = phaseInfo.activeTimestamp;
  const activeTitle = getCountdownTitle(phaseInfo.phase);
  const activeAccentColor = getCountdownAccentColor(phaseInfo.phase);
  const activeIcon = phaseInfo.phase === 'deposit' ? 
    <Calendar className="w-5 h-5" /> : 
    <Trophy className="w-5 h-5" />;
  const activeDateString = phaseInfo.phase === 'deposit' ? depositDate : raffleDate;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${phaseInfo.phase}-${activeTimestamp}`} // Key ensures re-render on phase change
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full max-w-xs"
      >
        <CountdownCard
          title={activeTitle}
          targetTimestamp={activeTimestamp}
          icon={activeIcon}
          accentColor={activeAccentColor}
          dateString={activeDateString}
        />
      </motion.div>
    </AnimatePresence>
  );
}
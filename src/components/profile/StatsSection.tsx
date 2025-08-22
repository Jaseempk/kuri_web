import { motion } from "framer-motion";
import { KuriUserProfile } from "../../types/user";

interface StatsSectionProps {
  profile: KuriUserProfile;
  totalCircles?: number;
}

interface StatCardProps {
  value: string | number;
  label: string;
  index: number;
}

function StatCard({ value, label, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-xl p-6 text-center shadow-sm"
    >
      <div className="text-2xl font-bold text-primary mb-2">
        {value}
      </div>
      <div className="text-sm text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
}

export function StatsSection({ profile, totalCircles = 0 }: StatsSectionProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const stats = [
    {
      value: profile.reputation_score || 0,
      label: "Reputation"
    },
    {
      value: totalCircles,
      label: "Total Circles"
    },
    {
      value: formatDate(profile.created_at),
      label: "Member Since"
    }
  ];

  return (
    <div className="hidden md:block mx-4 mt-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            value={stat.value}
            label={stat.label}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
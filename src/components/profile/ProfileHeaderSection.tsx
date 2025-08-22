import { motion } from "framer-motion";
import { KuriUserProfile } from "../../types/user";

interface ProfileHeaderSectionProps {
  profile: KuriUserProfile;
}

export function ProfileHeaderSection({ profile }: ProfileHeaderSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-6 sm:p-8 md:p-12 mx-4 mt-8 relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8 relative z-10">
        {/* Profile Picture */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
          <img
            src={profile.profile_image_url || "/default-avatar.png"}
            alt={profile.display_name ?? "User Profile"}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Profile Info */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            {profile.display_name}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            @{profile.username}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
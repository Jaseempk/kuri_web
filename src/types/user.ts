export interface KuriUserProfile {
  id: number;
  user_address: string;
  created_at: Date;
  username: string | null;
  display_name: string | null;
  reputation_score: number | null;
  last_active: Date | null;
  profile_image_url: string | null;
}

export type UserProfileFormData = Pick<
  KuriUserProfile,
  "username" | "display_name"
>;

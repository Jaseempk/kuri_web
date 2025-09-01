import { useOptimizedAuth } from "../hooks/useOptimizedAuth";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { LoadingSkeleton } from "../components/ui/loading-states";

export default function UserProfile() {
  const { profile, isLoading } = useOptimizedAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <p className="text-gray-600 mb-6">
          Please complete your profile setup to continue.
        </p>
        <Button onClick={() => navigate("/markets")}>Go to Markets</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{profile.display_name}</h1>
            <p className="text-gray-600">@{profile.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Reputation Score</h3>
            <p className="text-2xl font-bold text-primary">
              {profile.reputation_score || 0}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Member Since</h3>
            <p className="text-gray-700">
              {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold mb-4">Activity Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Placeholder for future activity stats */}
            <div className="bg-gray-50 rounded p-4 text-center">
              <p className="text-sm text-gray-600">Markets Joined</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="bg-gray-50 rounded p-4 text-center">
              <p className="text-sm text-gray-600">Successful Contributions</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="bg-gray-50 rounded p-4 text-center">
              <p className="text-sm text-gray-600">Markets Completed</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

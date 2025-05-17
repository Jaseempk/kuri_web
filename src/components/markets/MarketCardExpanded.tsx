import React from "react";
import { X } from "lucide-react";
import { KuriMarket } from "../../hooks/useKuriMarkets";

// Define MarketMetadata type if not already imported
export interface MarketMetadata {
  id: number;
  created_at: string;
  market_address: string;
  short_description: string;
  long_description: string;
  image_url: string;
}

interface MarketCardExpandedProps {
  market: KuriMarket;
  metadata: MarketMetadata;
  onClose: () => void;
}

export const MarketCardExpanded = ({
  market,
  metadata,
  onClose,
}: MarketCardExpandedProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="relative">
          <img
            src={metadata.image_url}
            alt={metadata.short_description}
            className="w-full h-48 object-cover rounded-xl mb-4"
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-white/80 rounded-full p-2 hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {metadata.short_description}
        </h2>
        <div className="prose max-w-none">
          <p className="text-gray-600 whitespace-pre-wrap">
            {metadata.long_description}
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-[#F9F5F1] p-4 rounded-xl">
            <p className="text-sm text-gray-500">Total Kuri Amount</p>
            <p className="text-lg font-semibold">
              $
              {(Number(market.kuriAmount) / 1e6) *
                Number(market.totalParticipants)}{" "}
              USDC
            </p>
          </div>
          <div className="bg-[#F9F5F1] p-4 rounded-xl">
            <p className="text-sm text-gray-500">Participants</p>
            <p className="text-lg font-semibold">{market.totalParticipants}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

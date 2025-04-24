import { Market } from "../../graphql/types";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { formatEther } from "viem";

interface MarketCardProps {
  market: Market;
  onJoinClick: (market: Market) => void;
}

export const MarketCard = ({ market, onJoinClick }: MarketCardProps) => {
  // Default values until implemented in Market type
  const defaultDescription =
    "A community savings circle powered by Kuri protocol.";
  const defaultEntryFee = "0.1"; // 0.1 ETH default entry fee

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CREATED":
        return "bg-[hsl(var(--gold))]";
      case "ACTIVE":
        return "bg-[hsl(var(--forest))]";
      case "PAUSED":
        return "bg-[hsl(var(--ochre))]";
      default:
        return "bg-[hsl(var(--sand))]";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            {market.name}
          </CardTitle>
          <Badge className={getStatusColor(market.status)}>
            {market.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="text-sm line-clamp-2">{defaultDescription}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Entry Fee</p>
            <p className="font-medium">{defaultEntryFee} ETH</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Participants</p>
            <p className="font-medium">{market.memberCount}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="default"
          className="w-full"
          onClick={() => onJoinClick(market)}
        >
          Join Market
        </Button>
      </CardFooter>
    </Card>
  );
};

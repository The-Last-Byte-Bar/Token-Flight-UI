import { Button } from "./ui/button";
import { useWallet } from "../hooks/useWallet";
import { formatErgAmount } from "../lib/utils";

export function WalletConnect() {
  const { isConnected, balance, connect, disconnect } = useWallet();

  return (
    <div className="flex items-center gap-4">
      {!isConnected ? (
        <Button
          onClick={connect}
          variant="outline"
          className="font-semibold"
        >
          Connect Wallet
        </Button>
      ) : (
        <div className="flex items-center gap-4">
          <div className="text-sm">
            {balance && (
              <div className="text-muted-foreground">
                {formatErgAmount(balance.nanoErgs.toString())} ERG
              </div>
            )}
          </div>
          <Button
            onClick={disconnect}
            variant="outline"
            size="sm"
            className="font-semibold"
          >
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
} 
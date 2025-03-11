import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import WaveBackground from "@/components/WaveBackground";
import TokenFlightLogo from "@/components/TokenFlightLogo";
import NautilusWallet from "@/components/NautilusWallet";
import AirdropForm from "@/components/AirdropForm";
import { NFTAirdropForm } from "@/components/NFTAirdropForm";
import { AirdropTypeSelector } from "@/components/AirdropTypeSelector";
import AnimatedToken from "@/components/AnimatedToken";
import { GithubIcon, PenIcon } from "lucide-react";
import { Token } from '@/lib/wallet';

type AirdropType = 'token' | 'nft' | null;

const Index = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [airdropType, setAirdropType] = useState<AirdropType>(null);

  useEffect(() => {
    setIsLoaded(true);
    console.log("Index component mounted");
  }, []);

  const handleWalletConnect = (address: string, tokens: Token[]) => {
    console.log("Wallet connected:", address);
    console.log("Tokens:", tokens);
    setWalletAddress(address);
    setAvailableTokens(tokens);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setAvailableTokens([]);
    setAirdropType(null);
  };

  const handleAirdropTypeSelect = (type: 'token' | 'nft') => {
    setAirdropType(type);
  };

  const handleBack = () => {
    setAirdropType(null);
  };

  const renderAirdropContent = () => {
    if (!walletAddress) {
      return (
        <div className="flex justify-center mt-6">
          <NautilusWallet onConnect={handleWalletConnect} />
        </div>
      );
    }

    if (!airdropType) {
      return <AirdropTypeSelector onSelect={handleAirdropTypeSelect} />;
    }

    if (airdropType === 'nft') {
      return (
        <NFTAirdropForm
          walletAddress={walletAddress}
          availableTokens={availableTokens}
          onDisconnect={handleDisconnect}
          onBack={handleBack}
        />
      );
    }

    return (
      <AirdropForm 
        walletConnected={true}
        walletAddress={walletAddress}
        availableTokens={availableTokens}
        onDisconnect={handleDisconnect}
        onBack={handleBack}
      />
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-ocean-light to-ocean-dark relative ${isLoaded ? 'fade-in' : ''}`}>
      <WaveBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <TokenFlightLogo />
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/yourusername/token-flight"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-pixel-teal transition-colors"
              >
                <GithubIcon className="w-6 h-6" />
              </a>
              <a
                href="https://docs.tokenflight.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-pixel-teal transition-colors"
              >
                <PenIcon className="w-6 h-6" />
              </a>
            </div>
          </nav>
        </header>
        
        <main className="mt-12">
          <section className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight pixel-text mb-4">
              Token Flight <span className="text-pixel-teal animate-blink">Airdrop</span>
            </h1>
            <p className="text-white/90 max-w-xl mx-auto">
              The easiest way to distribute tokens and NFTs to multiple addresses at once.
              Connect your Nautilus wallet and start your airdrop journey!
            </p>
          </section>
          
          <section className="mt-8 container mx-auto px-4">
            {renderAirdropContent()}
          </section>
        </main>
      </div>
      
      <AnimatedToken />
    </div>
  );
};

export default Index;

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import WaveBackground from "@/components/WaveBackground";
import TokenFlightLogo from "@/components/TokenFlightLogo";
import NautilusWallet from "@/components/NautilusWallet";
import AirdropForm from "@/components/AirdropForm";
import AnimatedToken from "@/components/AnimatedToken";
import { GithubIcon, PenIcon } from "lucide-react";
import { Token } from '@/lib/wallet';

const Index = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <WaveBackground />
      
      <AnimatedToken delay={0} size={32} left="15%" />
      <AnimatedToken delay={0.5} size={24} left="30%" />
      <AnimatedToken delay={1.5} size={40} left="75%" />
      <AnimatedToken delay={2.5} size={20} left="55%" />
      <AnimatedToken delay={3.5} size={28} left="85%" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6 pb-20">
        <header className="flex flex-col sm:flex-row justify-between items-center">
          <TokenFlightLogo />
          
          <div className="mt-4 sm:mt-0 flex items-center gap-4">
            <a 
              href="https://github.com/yourproject/token-flight" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-pixel-teal transition-colors"
            >
              <GithubIcon className="h-6 w-6" />
            </a>
            
            <Button className="pixel-btn bg-pixel-teal text-pixel-navy hover:bg-pixel-skyblue" type="button">
              Docs
            </Button>
          </div>
        </header>
        
        <main className="mt-12">
          <section className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight pixel-text mb-4">
              Token Flight <span className="text-pixel-teal animate-blink">Airdrop</span>
            </h1>
            <p className="text-white/90 max-w-xl mx-auto">
              The easiest way to distribute tokens to multiple addresses at once.
              Connect your Nautilus wallet and start your airdrop journey!
            </p>
            
            <div className="flex justify-center mt-6">
              <NautilusWallet onConnect={handleWalletConnect} />
            </div>
          </section>
          
          <section className="mt-8">
            {walletAddress && (
              <AirdropForm 
                walletConnected={true}
                walletAddress={walletAddress}
                availableTokens={availableTokens}
                onDisconnect={handleDisconnect}
              />
            )}
          </section>
          
          <section className="mt-12 max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white pixel-text mb-4">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/30 backdrop-blur-sm p-4 rounded pixel-borders">
                <div className="font-bold text-ocean-dark mb-2">1. Connect</div>
                <p className="text-sm text-ocean-dark/90">Connect your Nautilus wallet to authorize transactions</p>
              </div>
              <div className="bg-white/30 backdrop-blur-sm p-4 rounded pixel-borders">
                <div className="font-bold text-ocean-dark mb-2">2. Configure</div>
                <p className="text-sm text-ocean-dark/90">Set token amount and add recipient addresses</p>
              </div>
              <div className="bg-white/30 backdrop-blur-sm p-4 rounded pixel-borders">
                <div className="font-bold text-ocean-dark mb-2">3. Launch</div>
                <p className="text-sm text-ocean-dark/90">Approve the transaction and watch your tokens fly!</p>
              </div>
            </div>
          </section>
          
          <section className="mt-12 max-w-3xl mx-auto text-center bg-white/30 backdrop-blur-sm p-6 rounded pixel-borders">
            <h2 className="text-2xl font-bold text-ocean-dark mb-4">
              Token Flight Benefits
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="flex items-start gap-2">
                <div className="bg-pixel-teal h-6 w-6 rounded-full flex items-center justify-center text-white font-bold shrink-0">1</div>
                <p className="text-sm text-ocean-dark/90">Send tokens to hundreds of addresses in a single transaction</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-pixel-teal h-6 w-6 rounded-full flex items-center justify-center text-white font-bold shrink-0">2</div>
                <p className="text-sm text-ocean-dark/90">Save on transaction fees with batch processing</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-pixel-teal h-6 w-6 rounded-full flex items-center justify-center text-white font-bold shrink-0">3</div>
                <p className="text-sm text-ocean-dark/90">Keep track of all your airdrops with built-in transaction history</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-pixel-teal h-6 w-6 rounded-full flex items-center justify-center text-white font-bold shrink-0">4</div>
                <p className="text-sm text-ocean-dark/90">Seamless integration with the Nautilus wallet ecosystem</p>
              </div>
            </div>
          </section>
        </main>
        
        <footer className="mt-20 text-center">
          <div className="mb-4 p-3 bg-pixel-teal/20 backdrop-blur-sm rounded-lg max-w-2xl mx-auto border border-pixel-teal/30">
            <p className="text-white text-sm font-medium">
              <span className="font-bold">Fee Disclaimer:</span> We charge a 1% service fee for each successful airdrop transaction to maintain this platform and continue providing high-quality services.
            </p>
          </div>
          
          <p className="text-white/70 text-sm">© 2023 Token Flight Airdrop • Built with ♥ for the blockchain community</p>
          <p className="mt-2">
            <a href="#" className="text-white/90 hover:text-white underline inline-flex items-center gap-1">
              <PenIcon className="h-3 w-3" /> Submit feedback
            </a>
          </p>
        </footer>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-0 right-0 bg-black/70 text-white text-xs p-1 z-50">
          {isLoaded ? "⚡ App Loaded" : "Loading..."}
        </div>
      )}
    </div>
  );
};

export default Index;

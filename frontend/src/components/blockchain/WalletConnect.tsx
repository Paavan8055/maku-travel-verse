import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Coins,
  Award,
  ExternalLink,
  Copy,
  Loader2
} from 'lucide-react';

interface WalletInfo {
  address: string;
  matic_balance: number;
  maku_balance: number;
  chain_id: number;
  network: string;
  mock_mode?: boolean;
}

interface NFT {
  token_id: number;
  tier: string;
  cashback_rate: number;
  minted_at: number;
  metadata_uri: string;
}

interface WalletData {
  wallet: WalletInfo;
  pending_cashback: number;
  nfts: NFT[];
  nft_count: number;
  highest_cashback_rate: number;
}

export const WalletConnect: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
  };

  // Generate mock wallet address for testing
  const generateMockWalletAddress = () => {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  };

  // Connect to MetaMask or use mock wallet
  const connectWallet = async () => {
    setConnecting(true);
    
    try {
      let address: string;

      // Try MetaMask if available
      if (isMetaMaskInstalled()) {
        try {
          const accounts = await (window as any).ethereum.request({
            method: 'eth_requestAccounts'
          });

          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found');
          }

          address = accounts[0];

          // Try to switch to Mumbai testnet
          try {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x13881' }], // 80001 in hex
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x13881',
                  chainName: 'Polygon Mumbai Testnet',
                  nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                  },
                  rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
                  blockExplorerUrls: ['https://mumbai.polygonscan.com']
                }]
              });
            }
          }
        } catch (metaMaskError) {
          console.log('MetaMask connection failed, using mock wallet:', metaMaskError);
          // Fall back to mock wallet
          address = generateMockWalletAddress();
          toast({
            title: "Using Mock Wallet",
            description: "MetaMask connection failed. Using test wallet for demonstration.",
          });
        }
      } else {
        // No MetaMask, use mock wallet
        address = generateMockWalletAddress();
        toast({
          title: "Mock Wallet Connected",
          description: "Using test wallet for demonstration. Install MetaMask for real wallet.",
        });
      }

      // Fetch wallet data from backend
      await fetchWalletData(address);

      setConnected(true);

      toast({
        title: "Wallet Connected!",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  // Fetch wallet data from backend
  const fetchWalletData = async (address: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/blockchain/wallet/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }
      const data = await response.json();
      setWalletData(data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Claim cashback
  const claimCashback = async () => {
    if (!walletData || walletData.pending_cashback <= 0) {
      toast({
        title: "No Cashback",
        description: "You don't have any pending cashback to claim.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/blockchain/cashback/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_address: walletData.wallet.address })
      });

      if (!response.ok) {
        throw new Error('Failed to claim cashback');
      }

      const result = await response.json();

      toast({
        title: "Cashback Claimed! 🎉",
        description: `${result.amount_claimed} MAKU claimed successfully`,
      });

      // Refresh wallet data
      await fetchWalletData(walletData.wallet.address);
    } catch (error: any) {
      console.error('Error claiming cashback:', error);
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim cashback",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy address to clipboard
  const copyAddress = () => {
    if (walletData?.wallet.address) {
      navigator.clipboard.writeText(walletData.wallet.address);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setConnected(false);
    setWalletData(null);
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully",
    });
  };

  if (!connected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            Connect Your Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Connect your wallet to access MAKU token rewards, NFT memberships, and cashback features.
          </p>
          
          {!isMetaMaskInstalled() && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Optional: MetaMask</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    You can use a mock wallet for testing, or install MetaMask for real blockchain connection.
                  </p>
                  <a 
                    href="https://metamask.io/download/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-orange-600 hover:text-orange-700 mt-2 inline-flex items-center gap-1 font-medium"
                  >
                    Download MetaMask <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={connectWallet}
            disabled={connecting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6 text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                {isMetaMaskInstalled() ? 'Connect Wallet' : 'Use Mock Wallet'}
              </>
            )}
          </Button>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              🎭 Testing Mode: Using mock blockchain for demonstration
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Wallet Connected
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={disconnectWallet}
          >
            Disconnect
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && !walletData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : walletData && (
          <>
            {/* Wallet Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm font-mono">
                  {walletData.wallet.address.slice(0, 10)}...{walletData.wallet.address.slice(-8)}
                </code>
                <Button variant="outline" size="sm" onClick={copyAddress}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {walletData.wallet.mock_mode && (
                <Badge variant="outline" className="text-xs">
                  🎭 Mock Mode
                </Badge>
              )}
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">MAKU Balance</span>
                </div>
                <p className="text-2xl font-bold text-orange-700">
                  {walletData.wallet.maku_balance.toFixed(2)}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {walletData.pending_cashback > 0 && `+${walletData.pending_cashback.toFixed(2)} pending`}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">MATIC Balance</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {walletData.wallet.matic_balance.toFixed(4)}
                </p>
                <p className="text-xs text-purple-600 mt-1">Mumbai Testnet</p>
              </div>
            </div>

            {/* Pending Cashback */}
            {walletData.pending_cashback > 0 && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Pending Cashback</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {walletData.pending_cashback.toFixed(2)} MAKU
                    </p>
                  </div>
                  <Button
                    onClick={claimCashback}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Claim Now</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* NFTs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Your NFT Memberships</h3>
                <Badge variant="outline">
                  {walletData.nft_count} NFT{walletData.nft_count !== 1 ? 's' : ''}
                </Badge>
              </div>

              {walletData.nfts.length > 0 ? (
                <div className="space-y-2">
                  {walletData.nfts.map((nft) => (
                    <div 
                      key={nft.token_id}
                      className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className={`w-5 h-5 ${
                            nft.tier === 'Platinum' ? 'text-purple-600' :
                            nft.tier === 'Gold' ? 'text-yellow-600' :
                            nft.tier === 'Silver' ? 'text-gray-500' :
                            'text-orange-600'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">{nft.tier} Tier</p>
                            <p className="text-xs text-gray-600">Token #{nft.token_id}</p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                          {nft.cashback_rate}% Cashback
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No NFT memberships yet</p>
                  <p className="text-xs mt-1">Purchase or earn NFTs to get cashback rewards</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Highest Cashback Rate:</span>
                <span className="font-bold text-orange-600">
                  {walletData.highest_cashback_rate}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium text-gray-900">
                  {walletData.wallet.network} (Chain {walletData.wallet.chain_id})
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

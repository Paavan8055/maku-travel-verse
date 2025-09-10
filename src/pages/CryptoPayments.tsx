import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Shield, Zap, Globe, DollarSign, Wallet } from 'lucide-react';

const CryptoPayments = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Crypto Payments - Pay with Digital Currency | Maku.travel</title>
        <meta name="description" content="Book your travel with cryptocurrency. Secure, fast, and global payments with Bitcoin, Ethereum, and other major cryptocurrencies." />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <Coins className="h-20 w-20 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Crypto Payments
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Book your travel with cryptocurrency. Fast, secure, and borderless payments for the modern traveler.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </section>

        {/* Supported Cryptocurrencies */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Supported Cryptocurrencies</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[
                { name: "Bitcoin", symbol: "BTC", color: "text-orange-500" },
                { name: "Ethereum", symbol: "ETH", color: "text-blue-500" },
                { name: "Litecoin", symbol: "LTC", color: "text-gray-500" },
                { name: "Ripple", symbol: "XRP", color: "text-blue-600" },
                { name: "Cardano", symbol: "ADA", color: "text-blue-700" },
                { name: "Polygon", symbol: "MATIC", color: "text-purple-500" }
              ].map((crypto, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className={`text-4xl font-bold mb-2 ${crypto.color}`}>
                      {crypto.symbol}
                    </div>
                    <p className="text-sm text-muted-foreground">{crypto.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Crypto Payments?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Instant Transactions",
                  description: "Complete your booking in seconds with near-instant crypto transactions."
                },
                {
                  icon: Shield,
                  title: "Enhanced Security",
                  description: "Blockchain technology ensures secure and tamper-proof payment processing."
                },
                {
                  icon: Globe,
                  title: "Global Accessibility",
                  description: "Pay from anywhere in the world without currency conversion fees."
                },
                {
                  icon: DollarSign,
                  title: "Lower Fees",
                  description: "Enjoy lower transaction fees compared to traditional payment methods."
                },
                {
                  icon: Wallet,
                  title: "Privacy Protection",
                  description: "Enhanced privacy with pseudonymous transactions and data protection."
                },
                {
                  icon: Coins,
                  title: "Portfolio Diversification",
                  description: "Use your crypto holdings for real-world travel purchases."
                }
              ].map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <benefit.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How to Pay with Crypto</h2>
            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Select Crypto Payment",
                  description: "Choose cryptocurrency as your payment method at checkout."
                },
                {
                  step: "2",
                  title: "Connect Your Wallet",
                  description: "Connect your preferred crypto wallet or exchange account."
                },
                {
                  step: "3",
                  title: "Confirm Transaction",
                  description: "Review the conversion rate and confirm your payment."
                },
                {
                  step: "4",
                  title: "Instant Confirmation",
                  description: "Receive instant booking confirmation once the transaction is verified."
                }
              ].map((step, index) => (
                <Card key={index}>
                  <CardContent className="flex items-center p-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mr-6">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CryptoPayments;
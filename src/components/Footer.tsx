import { Globe, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import makuMascot from "@/assets/maku-mascot.png";

const Footer = () => {
  const footerLinks = {
    company: [
      { name: "About Maku.travel", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Press", href: "#" },
      { name: "Partner Portal", href: "#" },
      { name: "Investor Relations", href: "#" }
    ],
    marketplaces: [
      { name: "Family Adventures", href: "#" },
      { name: "Solo Journeys", href: "#" },
      { name: "Pet-Friendly Travel", href: "#" },
      { name: "Spiritual Retreats", href: "#" },
      { name: "Travel Fund Manager", href: "#" }
    ],
    support: [
      { name: "Help Center", href: "#" },
      { name: "Safety & Security", href: "#" },
      { name: "Cancellation Policy", href: "#" },
      { name: "Verified Reviews", href: "#" },
      { name: "Contact Us", href: "#" }
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
      { name: "GDPR", href: "#" },
      { name: "Accessibility", href: "#" }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: "#", name: "Facebook" },
    { icon: Twitter, href: "#", name: "Twitter" },
    { icon: Instagram, href: "#", name: "Instagram" },
    { icon: Youtube, href: "#", name: "YouTube" }
  ];

  return (
    <footer className="bg-gradient-to-b from-background to-muted/50 border-t border-border">
      {/* Newsletter Section */}
      <div className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="travel-card bg-gradient-hero text-white p-8 md:p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 font-['Playfair_Display']">
                Never Miss a Travel Deal
              </h3>
              <p className="text-xl text-white/90 mb-8">
                Get exclusive offers, travel tips, and destination guides delivered to your inbox from Australia's newest travel platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/70"
                />
                <Button variant="secondary" className="btn-secondary whitespace-nowrap">
                  Subscribe Now
                </Button>
              </div>
              
              <p className="text-sm text-white/70 mt-4">
                Join 50,000+ monthly travellers trusted by Maku.travel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-20 px-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-travel-ocean/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 md:gap-12 lg:gap-16 items-start justify-items-center md:justify-items-start animate-fade-in">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 rounded-xl bg-gradient-primary">
                  <Globe className="h-8 w-8 text-white animate-pulse-soft" />
                </div>
                <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent font-['Playfair_Display']">
                  Maku.travel
                </span>
              </div>
              
              <p className="text-foreground/80 mb-8 leading-relaxed text-lg font-medium">
                Founded in Sydney, June 2024. Building life's travel stories through AI-powered marketplace experiences with 1.5 million+ hotels globally via Amadeus & HotelBeds APIs.
              </p>

              <div className="flex items-center mb-8 p-4 bg-gradient-to-r from-travel-sunset/10 to-travel-ocean/10 rounded-2xl border border-primary/20">
                <img
                  src={makuMascot}
                  alt="Maku Mascot"
                  className="w-16 h-16 mr-4 drop-shadow-lg"
                />
                <div>
                  <div className="font-bold text-xl text-primary">Meet Maku!</div>
                  <div className="text-secondary font-medium">Your travel companion</div>
                </div>
              </div>

              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <Button
                    key={social.name}
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-full border-2 border-primary/30 hover:border-primary hover:bg-gradient-primary hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-elegant"
                  >
                    <social.icon className="h-6 w-6" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-xl mb-6 text-primary bg-gradient-primary bg-clip-text text-transparent">
                Company
              </h4>
              <ul className="space-y-4">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-foreground/70 hover:text-primary transition-colors font-medium text-lg hover:translate-x-1 inline-block transition-transform duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Marketplaces */}
            <div>
              <h4 className="font-bold text-xl mb-6 text-secondary bg-gradient-to-r from-travel-sunset to-travel-ocean bg-clip-text text-transparent">
                Marketplaces
              </h4>
              <ul className="space-y-4">
                {footerLinks.marketplaces.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-foreground/70 hover:text-secondary transition-colors font-medium text-lg hover:translate-x-1 inline-block transition-transform duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-xl mb-6 text-travel-sunset">
                Support
              </h4>
              <ul className="space-y-4">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-foreground/70 hover:text-travel-sunset transition-colors font-medium text-lg hover:translate-x-1 inline-block transition-transform duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Legal */}
            <div>
              <h4 className="font-bold text-xl mb-6 text-travel-ocean">
                Contact
              </h4>
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-foreground/80 hover:text-travel-ocean transition-colors">
                  <div className="p-2 rounded-lg bg-travel-ocean/10 mr-3">
                    <Mail className="h-5 w-5 text-travel-ocean" />
                  </div>
                  <span className="font-medium">support@maku.travel</span>
                </div>
                <div className="flex items-center text-foreground/80 hover:text-travel-ocean transition-colors">
                  <div className="p-2 rounded-lg bg-travel-ocean/10 mr-3">
                    <Phone className="h-5 w-5 text-travel-ocean" />
                  </div>
                  <span className="font-medium">+61 2 8000 1234</span>
                </div>
                <div className="flex items-start text-foreground/80 hover:text-travel-ocean transition-colors">
                  <div className="p-2 rounded-lg bg-travel-ocean/10 mr-3">
                    <MapPin className="h-5 w-5 text-travel-ocean" />
                  </div>
                  <span className="font-medium">Level 15, 1 Macquarie Place<br />Sydney NSW 2000, Australia</span>
                </div>
              </div>

              <h5 className="font-bold text-lg mb-4 text-foreground">Legal</h5>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-foreground/60 hover:text-primary transition-colors font-medium hover:translate-x-1 inline-block transition-transform duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Bottom Section */}
      <div className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-muted-foreground text-sm">
              © 2025 Maku.travel Pty Ltd. All rights reserved. IATA accreditation applied July 15, 2025.
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-muted-foreground">All systems operational</span>
              </div>
              
              <div className="text-muted-foreground">
                Made with ❤️ for travelers
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
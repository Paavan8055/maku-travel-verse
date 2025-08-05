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
                Get exclusive offers, travel tips, and destination guides delivered to your inbox.
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
                Join 500K+ travelers saving on their dream trips
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <Globe className="h-8 w-8 text-primary animate-pulse-soft" />
                <span className="text-2xl font-bold hero-text font-['Playfair_Display']">Maku.travel</span>
              </div>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Building life's travel stories through unique marketplace experiences. 
                Your adventure awaits with Maku, your trusted travel companion.
              </p>

              <div className="flex items-center mb-4">
                <img
                  src={makuMascot}
                  alt="Maku Mascot"
                  className="w-12 h-12 mr-3"
                />
                <div>
                  <div className="font-semibold">Meet Maku!</div>
                  <div className="text-sm text-muted-foreground">Your travel companion</div>
                </div>
              </div>

              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <Button
                    key={social.name}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <social.icon className="h-5 w-5" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Marketplaces */}
            <div>
              <h4 className="font-bold text-lg mb-4">Marketplaces</h4>
              <ul className="space-y-3">
                {footerLinks.marketplaces.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-lg mb-4">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Legal */}
            <div>
              <h4 className="font-bold text-lg mb-4">Contact</h4>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-muted-foreground">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>hello@maku.travel</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-start text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                  <span>123 Travel Street<br />Adventure City, AC 12345</span>
                </div>
              </div>

              <h5 className="font-semibold mb-3">Legal</h5>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
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
              © 2024 Maku.travel. All rights reserved. Building life's travel stories worldwide.
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
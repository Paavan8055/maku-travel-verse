import { Facebook, Twitter, Instagram, Youtube, ShieldCheck, Headphones, BadgeCheck, Send, Bot, Cpu, Coins, Zap, Map, Code, BookOpen, Plug, HelpCircle, MessageCircle, Shield, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const footerLinks = {
    company: [{
      name: "About Maku.travel",
      href: "/about"
    }, {
      name: "Careers", 
      href: "/careers"
    }, {
      name: "Press",
      href: "/press"
    }],
    technology: [{
      name: "Maku AI Assistant",
      href: "/ai-assistant",
      icon: Bot
    }, {
      name: "Agentic Travel Bot",
      href: "/travel-bot",
      icon: Cpu
    }, {
      name: "Universal AI Engine",
      href: "/ai-engine",
      icon: Zap
    }, {
      name: "Interactive Roadmap",
      href: "/roadmap",
      icon: Map
    }, {
      name: "Crypto Payments",
      href: "/crypto-payments",
      icon: Coins
    }, {
      name: "Live Demo Center",
      href: "/demo",
      icon: Zap
    }],
    services: [{
      name: "Hotels & Accommodation",
      href: "/search/hotels"
    }, {
      name: "Flight Booking",
      href: "/search/flights"
    }, {
      name: "Tours & Activities",
      href: "/search/activities"
    }, {
      name: "Gift Cards",
      href: "/gift-cards"
    }, {
      name: "Travel Deals",
      href: "/deals"
    }],
    developers: [{
      name: "Developer Portal",
      href: "/developers",
      icon: Code
    }, {
      name: "API Documentation",
      href: "/api-docs",
      icon: BookOpen
    }, {
      name: "Integration Hub",
      href: "/integrations",
      icon: Plug
    }, {
      name: "Partner Portal",
      href: "/partner-portal",
      icon: ShieldCheck
    }],
    support: [{
      name: "Help Center",
      href: "/partners?tab=help",
      icon: HelpCircle
    }, {
      name: "Safety & Security",
      href: "/partners?tab=safety",
      icon: Shield
    }, {
      name: "Cancellation Policy",
      href: "/partners?tab=policies",
      icon: FileText
    }, {
      name: "Contact Us",
      href: "mailto:support@maku.travel",
      icon: Mail
    }]
  };
  const socialLinks = [{
    icon: Facebook,
    href: "https://facebook.com/maku.travel",
    name: "Facebook"
  }, {
    icon: Twitter,
    href: "https://twitter.com/maku_travel",
    name: "Twitter"
  }, {
    icon: Instagram,
    href: "https://instagram.com/maku.travel",
    name: "Instagram"
  }, {
    icon: Youtube,
    href: "https://youtube.com",
    name: "YouTube"
  }];
return <footer className="bg-primary text-primary-foreground">
      {/* Main Footer Content */}
      <div className="py-12 px-6 bg-gradient-pink-orange">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Company */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map(link => (
                  <li key={link.name}>
                    <a href={link.href} className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technology */}
            <div className="relative">
              <h4 className="font-semibold text-lg mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Technology</h4>
              <ul className="space-y-3">
                {footerLinks.technology.map(link => (
                  <li key={link.name}>
                    <a href={link.href} className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base flex items-center gap-2 group">
                      <link.icon className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Services</h4>
              <ul className="space-y-3">
                {footerLinks.services.map(link => (
                  <li key={link.name}>
                    <a href={link.href} className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Developers */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Developers</h4>
              <ul className="space-y-3">
                {footerLinks.developers.map(link => (
                  <li key={link.name}>
                    <a href={link.href} className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base flex items-center gap-2 group">
                      <link.icon className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map(link => (
                  <li key={link.name}>
                    <a href={link.href} className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base flex items-center gap-2 group">
                      <link.icon className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow / Newsletter */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Follow</h4>
              <p className="text-sm text-primary-foreground/80 mb-4">Stay connected for travel updates and exclusive deals</p>
              <div className="flex items-center gap-3 mb-6">
                {socialLinks.map(social => (
                  <a
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
              <p className="text-sm text-primary-foreground/80 mb-2">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <Input type="email" placeholder="Your email" className="bg-white/15 border-white/20 placeholder:text-white/70 text-white" />
                <Button className="bg-white/20 hover:bg-white/30 text-white" aria-label="Subscribe">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Support Section moved here for mobile */}
              <div className="mt-8 lg:hidden">
                <h4 className="font-semibold text-lg mb-4">Support</h4>
                <ul className="space-y-3">
                  {footerLinks.support.map(link => (
                    <li key={link.name}>
                      <a href={link.href} className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Support Section for desktop */}
          <div className="hidden lg:block mt-12 pt-8 border-t border-white/15">
            <div className="grid grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold text-lg mb-4">Support</h4>
                <ul className="space-y-3">
                  {footerLinks.support.map(link => (
                    <li key={link.name}>
                      <a href={link.href} className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/15">
        <div className="py-6 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-playfair font-bold">Maku</span>
                <span className="text-sm text-primary-foreground/80">2025 Maku Travel. All rights reserved.</span>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-primary-foreground/90">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /><span className="text-sm">Secure Booking</span></div>
                <div className="flex items-center gap-2"><Headphones className="h-4 w-4" /><span className="text-sm">24/7 Support</span></div>
                <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4" /><span className="text-sm">Best Price Guarantee</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};

export default Footer;

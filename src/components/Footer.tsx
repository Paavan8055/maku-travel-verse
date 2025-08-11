import { Facebook, Twitter, Instagram, Youtube, ShieldCheck, Headphones, BadgeCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const footerLinks = {
    company: [{
      name: "About Maku.travel",
      href: "#"
    }, {
      name: "Careers",
      href: "#"
    }, {
      name: "Press",
      href: "#"
    }, {
      name: "Partner Portal",
      href: "#"
    }, {
      name: "Investor Relations",
      href: "#"
    }],
    marketplaces: [{
      name: "Family Adventures",
      href: "#"
    }, {
      name: "Solo Journeys",
      href: "#"
    }, {
      name: "Pet-Friendly Travel",
      href: "#"
    }, {
      name: "Spiritual Retreats",
      href: "#"
    }, {
      name: "Travel Fund Manager",
      href: "#"
    }],
    support: [{
      name: "Help Center",
      href: "#"
    }, {
      name: "Safety & Security",
      href: "#"
    }, {
      name: "Cancellation Policy",
      href: "#"
    }, {
      name: "Verified Reviews",
      href: "#"
    }, {
      name: "Contact Us",
      href: "#"
    }],
    legal: [{
      name: "Privacy Policy",
      href: "#"
    }, {
      name: "Terms of Service",
      href: "#"
    }, {
      name: "Cookie Policy",
      href: "#"
    }, {
      name: "GDPR",
      href: "#"
    }, {
      name: "Accessibility",
      href: "#"
    }]
  };
  const socialLinks = [{
    icon: Facebook,
    href: "#",
    name: "Facebook"
  }, {
    icon: Twitter,
    href: "#",
    name: "Twitter"
  }, {
    icon: Instagram,
    href: "#",
    name: "Instagram"
  }, {
    icon: Youtube,
    href: "#",
    name: "YouTube"
  }];
return <footer className="bg-primary text-primary-foreground">
      {/* Main Footer Content */}
      <div className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-16">
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

            {/* Services */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Services</h4>
              <ul className="space-y-3">
                <li><a href="#" className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base">Hotels & Accommodation</a></li>
                <li><a href="#" className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base">Flight Booking</a></li>
                <li><a href="#" className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base">Tours & Activities</a></li>
                <li><a href="#" className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base">Car Rentals</a></li>
                <li><a href="#" className="story-link text-primary-foreground/80 hover:text-white transition-colors text-sm md:text-base">Travel Deals</a></li>
              </ul>
            </div>

            {/* Support */}
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
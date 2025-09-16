import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, Code, Database, Bot, Github, Building, 
  Users, Award, Star, ExternalLink, Cpu, Globe
} from "lucide-react";

const Acknowledgments = () => {
  const technicalContributions = [
    {
      name: "Lovable Development Platform",
      role: "Core Development Infrastructure",
      description: "Primary development platform enabling rapid full-stack development with React, TypeScript, and Tailwind CSS. Provided the foundation for our entire frontend architecture and deployment pipeline.",
      icon: Code,
      type: "Platform",
      website: "https://lovable.dev"
    },
    {
      name: "GitHub Repositories",
      role: "Version Control & Open Source Dependencies", 
      description: "Essential version control and access to thousands of open-source libraries that power our platform. From React components to utility libraries, GitHub's ecosystem made our development possible.",
      icon: Github,
      type: "Platform",
      website: "https://github.com"
    },
    {
      name: "Supabase",
      role: "Backend as a Service",
      description: "Complete backend infrastructure including PostgreSQL database, real-time subscriptions, authentication, and edge functions. Supabase enabled us to build a scalable, secure backend without managing servers.",
      icon: Database,
      type: "Backend",
      website: "https://supabase.com"
    },
    {
      name: "OpenAI ChatGPT Plugin",
      role: "AI Integration & Development Assistance",
      description: "Advanced AI capabilities powering our travel bot assistants and providing development assistance throughout the build process. ChatGPT's API integration enables intelligent travel recommendations.",
      icon: Bot,
      type: "AI Service",
      website: "https://openai.com"
    }
  ];

  const openSourceLibraries = [
    { name: "React", description: "User interface library", category: "Frontend" },
    { name: "TypeScript", description: "Type-safe JavaScript", category: "Language" },
    { name: "Tailwind CSS", description: "Utility-first CSS framework", category: "Styling" },
    { name: "Radix UI", description: "Accessible component primitives", category: "Components" },
    { name: "Framer Motion", description: "Animation library", category: "Animation" },
    { name: "React Query", description: "Data fetching and caching", category: "Data" },
    { name: "Zustand", description: "State management", category: "State" },
    { name: "React Hook Form", description: "Form handling", category: "Forms" }
  ];

  const acknowledgmentStats = [
    { label: "Open Source Libraries", value: "50+", icon: Code },
    { label: "GitHub Contributors", value: "1000+", icon: Users },
    { label: "Development Hours", value: "2000+", icon: Cpu },
    { label: "Community Support", value: "∞", icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Acknowledgments
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Recognizing the platforms, tools, and communities that made Maku.travel possible
          </p>
          <div className="flex items-center justify-center gap-4 text-lg">
            <Heart className="h-6 w-6" />
            <span>Built with gratitude • Powered by innovation • Supported by community</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {acknowledgmentStats.map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardContent className="p-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                  <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Technical Contributions */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Core Technical Contributors</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {technicalContributions.map((contribution, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <contribution.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{contribution.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">{contribution.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-primary mb-2">{contribution.role}</h4>
                    <p className="text-muted-foreground leading-relaxed">{contribution.description}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={contribution.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Platform
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Libraries */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Open Source Libraries</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-3xl mx-auto">
            Our platform stands on the shoulders of giants. These incredible open-source projects 
            form the foundation of our technology stack, each contributing essential functionality 
            that makes Maku.travel possible.
          </p>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {openSourceLibraries.map((library, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold mb-2">{library.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{library.description}</p>
                  <Badge variant="outline" className="text-xs">{library.category}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Community Impact */}
      <section className="py-16 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Community Impact</h2>
          <p className="text-xl leading-relaxed mb-8">
            Maku.travel exists because of the incredible open-source community, innovative platforms, 
            and collaborative tools that enable modern software development. We are committed to 
            giving back to these communities as we grow.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">Open Source First</h3>
              <p className="opacity-90">Contributing back to the projects that made us possible</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">Community Support</h3>
              <p className="opacity-90">Active participation in developer communities</p>
            </div>
            <div className="text-center">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">Innovation Together</h3>
              <p className="opacity-90">Building the future of travel technology collaboratively</p>
            </div>
          </div>
        </div>
      </section>

      {/* Special Thanks */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Special Thanks</h2>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-muted/50 to-muted/30">
            <CardContent className="p-8">
              <Star className="h-12 w-12 mx-auto mb-6 text-yellow-500" />
              <p className="text-lg leading-relaxed text-muted-foreground">
                To the countless developers, maintainers, and contributors who work tirelessly 
                to build and maintain the open-source ecosystem. Your dedication to making 
                powerful tools freely available enables startups like ours to turn ambitious 
                visions into reality. We are deeply grateful for your service to the global 
                developer community.
              </p>
              <div className="mt-6 text-sm text-muted-foreground/80">
                "If I have seen further, it is by standing on the shoulders of giants." - Isaac Newton
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Acknowledgments;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, 
  Briefcase, 
  Users, 
  Rocket, 
  Globe, 
  Star,
  Heart,
  Zap,
  Building2,
  Coffee,
  Wifi,
  Plane,
  DollarSign,
  Trophy,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  benefits: string[];
  equityAllocation: string;
}

const jobPositions: JobPosition[] = [
  {
    id: 'partnership-director',
    title: 'Partnership & Affiliation Director',
    department: 'Business Development',
    location: 'Sydney, Australia / Remote',
    type: 'Full-time Founding Team',
    description: 'Lead our partnerships strategy and build relationships with travel suppliers, hotels, airlines, and affiliate networks. You\'ll be instrumental in establishing Maku as a key player in the travel ecosystem.',
    requirements: [
      '5+ years experience in travel industry partnerships',
      'Proven track record with affiliate marketing programs',
      'Experience with OTA partnerships (Booking.com, Expedia, etc.)',
      'Strong negotiation and relationship building skills',
      'Understanding of travel technology and API integrations',
      'Network of contacts in travel industry preferred'
    ],
    benefits: [
      'Founding team equity (converts to MAKU tokens)',
      'Flexible Sydney office + remote work',
      'Travel allowance for industry events',
      'Unlimited vacation policy'
    ],
    equityAllocation: '0.5% - 2% founding allocation'
  },
  {
    id: 'full-stack-engineer',
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Sydney, Australia / Remote',
    type: 'Full-time Founding Team',
    description: 'Build the core platform using React, Node.js, and travel APIs. You\'ll work on everything from user interfaces to booking systems and payment processing.',
    requirements: [
      'React, TypeScript, Node.js expertise',
      'Experience with travel APIs (Amadeus, Sabre preferred)',
      'Payment processing integration experience',
      'AWS/Cloud infrastructure knowledge',
      'Startup or fast-paced environment experience',
      'Travel industry experience is a plus'
    ],
    benefits: [
      'Founding team equity (converts to MAKU tokens)',
      'Top-tier tech stack and tools',
      'Sydney office with harbor views',
      'Conference and learning budget'
    ],
    equityAllocation: '0.3% - 1.5% founding allocation'
  },
  {
    id: 'product-designer',
    title: 'Lead Product Designer',
    department: 'Design',
    location: 'Sydney, Australia / Remote',
    type: 'Full-time Founding Team',
    description: 'Shape the user experience for millions of travelers. Design intuitive booking flows, mobile apps, and create a travel platform that delights users.',
    requirements: [
      'UX/UI design expertise with travel platforms',
      'Figma, Sketch, or similar design tools',
      'Mobile-first design experience',
      'User research and testing experience',
      'Portfolio showcasing e-commerce/booking flows',
      'Understanding of accessibility and conversion optimization'
    ],
    benefits: [
      'Founding team equity (converts to MAKU tokens)',
      'Creative freedom and design leadership',
      'Latest design tools and equipment',
      'Travel inspiration budget'
    ],
    equityAllocation: '0.3% - 1.2% founding allocation'
  },
  {
    id: 'marketing-growth',
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'Sydney, Australia / Remote',
    type: 'Full-time Founding Team',
    description: 'Drive user acquisition and growth through digital marketing, content, and community building. Help establish Maku\'s brand in the competitive travel market.',
    requirements: [
      'Digital marketing expertise (SEO, SEM, Social)',
      'Travel industry marketing experience preferred',
      'Data-driven growth hacking experience',
      'Content creation and community management',
      'Influencer partnership experience',
      'Understanding of travel customer journey'
    ],
    benefits: [
      'Founding team equity (converts to MAKU tokens)',
      'Marketing budget and creative freedom',
      'Travel content creation opportunities',
      'Access to industry events and conferences'
    ],
    equityAllocation: '0.2% - 1% founding allocation'
  }
];

const Careers: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [expandedRequirements, setExpandedRequirements] = useState<{ [key: string]: boolean }>({});
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    motivation: '',
    portfolio: ''
  });

  const handleApply = (job: JobPosition) => {
    setSelectedJob(job);
    setApplicationForm(prev => ({ ...prev, position: job.title }));
  };

  const handleSubmitApplication = () => {
    // Simulate application submission
    toast.success('Application submitted! We\'ll be in touch within 48 hours.');
    setSelectedJob(null);
    setApplicationForm({
      name: '',
      email: '',
      phone: '',
      position: '',
      experience: '',
      motivation: '',
      portfolio: ''
    });
  };

  const toggleRequirements = (jobId: string) => {
    setExpandedRequirements(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-travel-sky/20 via-white to-travel-ocean/10">
      <Navbar />
      <Toaster />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-travel-ocean via-travel-forest to-travel-coral text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Join the <span className="text-travel-sunset">Founding Team</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Help us revolutionize travel technology from Sydney, Australia. 
              Build the future of travel with founding team equity that converts to MAKU tokens.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge className="bg-white/20 text-white text-lg px-4 py-2">
                <MapPin className="mr-2 h-5 w-5" />
                Sydney HQ + Remote
              </Badge>
              <Badge className="bg-white/20 text-white text-lg px-4 py-2">
                <Rocket className="mr-2 h-5 w-5" />
                Founding Team Equity (Future MAKU Tokens)
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-bounce"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-travel-sunset/30 rounded-full animate-pulse"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Open Positions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Open Founding Positions</h2>
          <div className="grid gap-6">
            {jobPositions.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{job.department}</Badge>
                        <Badge className="bg-travel-ocean/10 text-travel-ocean">
                          <MapPin className="mr-1 h-3 w-3" />
                          {job.location}
                        </Badge>
                        <Badge className="bg-travel-gold/10 text-travel-gold">
                          <Star className="mr-1 h-3 w-3" />
                          {job.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{job.description}</p>
                    </div>
                    <Button onClick={() => handleApply(job)} className="bg-gradient-to-r from-travel-ocean to-travel-forest">
                      Apply Now
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Target className="mr-2 h-4 w-4 text-travel-forest" />
                        Requirements
                      </h4>
                      <ul className="text-sm space-y-1">
                        {(expandedRequirements[job.id] ? job.requirements : job.requirements.slice(0, 3)).map((req, index) => (
                          <li key={index} className="text-muted-foreground">• {req}</li>
                        ))}
                        {job.requirements.length > 3 && (
                          <li 
                            className="text-travel-ocean font-medium cursor-pointer hover:text-travel-ocean/80 flex items-center"
                            onClick={() => toggleRequirements(job.id)}
                          >
                            {expandedRequirements[job.id] ? (
                              <>
                                <ChevronUp className="mr-1 h-3 w-3" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="mr-1 h-3 w-3" />
                                + {job.requirements.length - 3} more
                              </>
                            )}
                          </li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Trophy className="mr-2 h-4 w-4 text-travel-gold" />
                        Benefits
                      </h4>
                      <ul className="text-sm space-y-1">
                        {job.benefits.map((benefit, index) => (
                          <li key={index} className="text-muted-foreground">• {benefit}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <DollarSign className="mr-2 h-4 w-4 text-travel-coral" />
                        Equity Allocation
                      </h4>
                      <div className="bg-gradient-to-r from-travel-gold/10 to-travel-sunset/10 p-3 rounded-lg border border-travel-gold/20">
                        <p className="text-travel-gold font-semibold text-sm">{job.equityAllocation}</p>
                        <p className="text-xs text-muted-foreground mt-1">Founding shares → MAKU tokens</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Company Culture */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Join Maku?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We're building more than a travel platform - we're creating a global ecosystem that transforms how people explore the world.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Building2,
                title: 'Sydney Harbour Office',
                description: 'Work from our beautiful Sydney office with harbour views, or fully remote - your choice.',
                color: 'text-travel-ocean'
              },
              {
                icon: Rocket,
                title: 'Founding Team Equity',
                description: 'Real ownership that converts to MAKU tokens upon crypto launch. Series A potential with global ambitions.',
                color: 'text-travel-forest'
              },
              {
                icon: Globe,
                title: 'Global Impact',
                description: 'Build technology that will be used by millions of travelers worldwide.',
                color: 'text-travel-coral'
              },
              {
                icon: Zap,
                title: 'Cutting-Edge Tech',
                description: 'Work with the latest technologies, APIs, and travel industry innovations.',
                color: 'text-travel-sky'
              },
              {
                icon: Heart,
                title: 'Travel Perks',
                description: 'Vacation policy with equal split MAKU & founding team family travel allowance each year.',
                color: 'text-travel-pink'
              }
            ].map((perk, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <perk.icon className={`h-12 w-12 ${perk.color} mx-auto mb-4`} />
                  <h3 className="font-semibold text-lg mb-2">{perk.title}</h3>
                  <p className="text-muted-foreground">{perk.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Application Form Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Apply for {selectedJob.title}</CardTitle>
                <p className="text-muted-foreground">Join the Maku founding team</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <Input 
                      value={applicationForm.name}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input 
                      type="email"
                      value={applicationForm.email}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input 
                    value={applicationForm.phone}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+61 XXX XXX XXX"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Relevant Experience</label>
                  <Textarea 
                    value={applicationForm.experience}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="Tell us about your relevant experience..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Why Maku? Why This Role?</label>
                  <Textarea 
                    value={applicationForm.motivation}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, motivation: e.target.value }))}
                    placeholder="What excites you about joining our founding team?"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Portfolio/LinkedIn URL</label>
                  <Input 
                    value={applicationForm.portfolio}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, portfolio: e.target.value }))}
                    placeholder="https://linkedin.com/in/yourname or portfolio URL"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSubmitApplication} className="flex-1 bg-gradient-to-r from-travel-ocean to-travel-forest">
                    Submit Application
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedJob(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-travel-ocean/5 to-travel-forest/5 border-travel-ocean/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Don't See Your Role?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                We're always looking for exceptional talent to join our founding team. 
                If you're passionate about travel technology and want to build something incredible, let's talk.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-gradient-to-r from-travel-ocean to-travel-forest">
                  <Coffee className="mr-2 h-4 w-4" />
                  Email careers@maku.travel
                </Button>
                <Button variant="outline">
                  <Building2 className="mr-2 h-4 w-4" />
                  Visit Sydney Office
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Careers;

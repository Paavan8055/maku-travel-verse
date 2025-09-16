import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Careers - Join Our Team | Maku.travel</title>
        <meta name="description" content="Join the Maku.travel team and help shape the future of AI-powered travel." />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Join Our Journey</h1>
            <p className="text-xl text-muted-foreground">Help us revolutionize travel with AI.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Careers;
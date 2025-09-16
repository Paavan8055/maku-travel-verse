import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Press = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Press & Media | Maku.travel</title>
        <meta name="description" content="Latest news and press releases from Maku.travel." />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Press & Media</h1>
            <p className="text-xl text-muted-foreground">Stay updated with the latest news from Maku.travel.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Press;
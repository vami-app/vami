'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { MapPin, Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const options = [
    'High-Conductivity Copper',
    'Marine Grade Bronze / CuNi',
    'CNC Machining',
    'General Inquiry'
  ];
  const [selectedInterest, setSelectedInterest] = useState(options[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Your RFQ has been received. Our engineers will contact you shortly.');
      e.target.reset();
    }, 1200);
  };

  return (
    <div className="layout-main">
      <Toaster position="top-right" toastOptions={{ 
        style: {
          background: '#171717',
          color: '#fff',
          borderRadius: '12px',
        }
      }}/>
      
      <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32 w-full border-b border-border-subtle bg-surface overflow-hidden">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            
            {/* Left Pane: Contact Info */}
            <div className={`flex flex-col justify-center transition-all duration-1000 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase mb-6 block">Engineering Consultation</span>
              <h1 className="font-headline font-light text-text-primary leading-tight text-5xl sm:text-6xl lg:text-7xl text-balance mb-8">
                Let&apos;s Engineer the Future.
              </h1>
              <p className="text-text-muted text-lg sm:text-xl font-light leading-relaxed max-w-xl mb-12">
                Whether you need a custom CuNi 70/30 marine flange or high-volume C11000 copper die casting, our metallurgical experts are ready to review your specifications.
              </p>
              
              <div className={`space-y-8 border-t border-border-subtle pt-10 transition-all duration-1000 delay-200 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="flex items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-surface-muted border border-border-subtle flex items-center justify-center text-text-primary transition-transform duration-300 group-hover:scale-110">
                    <MapPin className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-text-primary">Global Headquarters</h3>
                    <p className="mt-2 text-text-muted font-light leading-relaxed">
                      123 Manufacturing Way<br />
                      New York, NY 10001<br />
                      United States
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-surface-muted border border-border-subtle flex items-center justify-center text-text-primary transition-transform duration-300 group-hover:scale-110">
                    <Mail className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-text-primary">Technical Sales</h3>
                    <p className="mt-2 text-text-muted font-light leading-relaxed">
                      <a href="mailto:sales@smalloys.com" className="hover:text-text-primary transition-colors underline underline-offset-4 decoration-gray-300 hover:decoration-black">sales@smalloys.com</a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-surface-muted border border-border-subtle flex items-center justify-center text-text-primary transition-transform duration-300 group-hover:scale-110">
                    <Phone className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-text-primary">Engineering Support</h3>
                    <p className="mt-2 text-text-muted font-light leading-relaxed">
                      <a href="tel:+15551234567" className="hover:text-text-primary transition-colors underline underline-offset-4 decoration-gray-300 hover:decoration-black">+1 (555) 123-4567</a><br/>
                      <span className="text-sm text-text-muted">Mon-Fri from 8am to 6pm EST.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Pane: RFQ Form */}
            <div className={`lg:pl-8 transition-all duration-1000 delay-300 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="bg-surface rounded-[var(--outer-radius)] p-8 sm:p-10 border border-border-subtle shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-shadow duration-500">
                <h3 className="text-2xl font-headline text-text-primary mb-8">Request a Quote</h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="first-name" className="block text-sm font-medium text-text-secondary mb-2">First name</label>
                      <input type="text" name="first-name" id="first-name" required className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm" placeholder="Jane" />
                    </div>
                    <div>
                      <label htmlFor="last-name" className="block text-sm font-medium text-text-secondary mb-2">Last name</label>
                      <input type="text" name="last-name" id="last-name" required className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm" placeholder="Doe" />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-text-secondary mb-2">Company</label>
                    <input type="text" name="company" id="company" className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm" placeholder="Acme Industries" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Work email</label>
                      <input type="email" name="email" id="email" required className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm" placeholder="jane@acme.com" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-2">Phone number</label>
                      <input type="tel" name="phone" id="phone" className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="interest" className="block text-sm font-medium text-text-secondary mb-2">Primary Interest</label>
                    
                    {/* Invisible overlay to capture clicks outside the dropdown */}
                    {isDropdownOpen && (
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                    )}
                    
                    <div className="relative z-20">
                      <input type="hidden" name="interest" value={selectedInterest} />
                      <button 
                        type="button" 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full py-3 px-4 bg-surface-muted border ${isDropdownOpen ? 'border-black ring-1 ring-black shadow-md' : 'border-border-subtle shadow-sm hover:bg-white'} rounded-xl transition-all outline-none text-left flex justify-between items-center`}
                      >
                        <span className="text-text-primary">{selectedInterest}</span>
                        <svg className={`h-4 w-4 text-text-muted transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      
                      <div className={`absolute top-full left-0 mt-2 w-full bg-surface border border-border-base rounded-xl shadow-xl overflow-hidden py-2 z-30 transition-all duration-200 origin-top ${isDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
                        {options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setSelectedInterest(option);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${selectedInterest === option ? 'text-text-primary font-medium bg-surface-muted' : 'text-text-secondary hover:bg-surface-muted hover:text-gray-900'}`}
                          >
                            {option}
                            {selectedInterest === option && (
                              <svg className="h-4 w-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-2">Project Specifications</label>
                    <textarea id="message" name="message" rows={4} required className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary resize-y shadow-sm" placeholder="Briefly describe your requirements, alloy needs, and expected volumes..."></textarea>
                  </div>
                  
                  <div className="pt-2">
                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-4 px-8 border border-transparent rounded-full shadow-md hover:shadow-lg text-base font-medium text-text-inverse bg-text-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-70 disabled:cursor-not-allowed group">
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-text-inverse" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Submit Request
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}

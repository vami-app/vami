'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { MapPin, Mail, Phone, ArrowRight, Loader2, Users } from 'lucide-react';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const metalCategories = [
    'Copper',
    'Brass',
    'Phosphor Bronze',
    'Aluminium'
  ];
  
  const formFactors = [
    'Sheets',
    'Plates',
    'Circles',
    'Ingots',
    'Custom Castings'
  ];
  
  const [selectedCategory, setSelectedCategory] = useState(metalCategories[0]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  const [selectedFactor, setSelectedFactor] = useState(formFactors[0]);
  const [isFactorOpen, setIsFactorOpen] = useState(false);

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
      toast.success('Your RFQ has been received. Our team will contact you shortly.');
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
              <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase mb-6 block">Get In Touch With Our Team</span>
              <h1 className="font-headline font-light text-text-primary leading-tight text-5xl sm:text-6xl lg:text-7xl text-balance mb-8">
                Radhey Metal Alloys LLP
              </h1>
              <p className="text-text-muted text-lg sm:text-xl font-light leading-relaxed max-w-xl mb-12">
                For direct procurement inquiries, technical calculations, or orders, reach out to our designated partners.
              </p>
              
              <div className={`space-y-8 border-t border-border-subtle pt-10 transition-all duration-1000 delay-200 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-surface-muted border border-border-subtle flex items-center justify-center text-text-primary transition-transform duration-300 group-hover:scale-110">
                    <Users className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-text-primary">Contact Persons</h3>
                    <p className="mt-2 text-text-muted font-light leading-relaxed">
                      Kevin Shah | Arth Joshi | Aditya Joshi
                    </p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-surface-muted border border-border-subtle flex items-center justify-center text-text-primary transition-transform duration-300 group-hover:scale-110">
                    <Phone className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-text-primary">Direct Phone Lines</h3>
                    <p className="mt-2 text-text-muted font-light leading-relaxed">
                      <a href="tel:+919081358107" className="hover:text-text-primary transition-colors">+91 9081358107</a><br/>
                      <a href="tel:+918469669699" className="hover:text-text-primary transition-colors">+91 8469669699</a><br/>
                      <a href="tel:+918141888799" className="hover:text-text-primary transition-colors">+91 8141888799</a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-surface-muted border border-border-subtle flex items-center justify-center text-text-primary transition-transform duration-300 group-hover:scale-110">
                    <Mail className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-text-primary">Official Email</h3>
                    <p className="mt-2 text-text-muted font-light leading-relaxed">
                      <a href="mailto:radhemetalalloysllp@gmail.com" className="hover:text-text-primary transition-colors underline underline-offset-4 decoration-gray-300 hover:decoration-black">radhemetalalloysllp@gmail.com</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-surface-muted border border-border-subtle flex items-center justify-center text-text-primary transition-transform duration-300 group-hover:scale-110">
                    <MapPin className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-text-primary">Registered Office</h3>
                    <p className="mt-2 text-text-muted font-light leading-relaxed">
                      43, Vardhmaan Nagar, Kalol<br />
                      Gandhinagar, Gujarat<br />
                      India - 382721
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
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-text-secondary mb-2">Company Name & Contact Person</label>
                    <input type="text" name="company" id="company" required className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm" placeholder="Acme Industries - Jane Doe" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
                      <input type="email" name="email" id="email" required className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm" placeholder="jane@acme.com" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-2">Mobile Number</label>
                      <input type="tel" name="phone" id="phone" required className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm" placeholder="+91 00000 00000" />
                    </div>
                  </div>
                  
                  {/* Metal Category Dropdown */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-2">Metal Category</label>
                    
                    {isCategoryOpen && (
                      <div className="fixed inset-0 z-10" onClick={() => setIsCategoryOpen(false)}></div>
                    )}
                    
                    <div className="relative z-20">
                      <input type="hidden" name="category" value={selectedCategory} />
                      <button 
                        type="button" 
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className={`w-full py-3 px-4 bg-surface-muted border ${isCategoryOpen ? 'border-black ring-1 ring-black shadow-md' : 'border-border-subtle shadow-sm hover:bg-white'} rounded-xl transition-all outline-none text-left flex justify-between items-center`}
                      >
                        <span className="text-text-primary">{selectedCategory}</span>
                        <svg className={`h-4 w-4 text-text-muted transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      
                      <div className={`absolute top-full left-0 mt-2 w-full bg-surface border border-border-base rounded-xl shadow-xl overflow-hidden py-2 z-30 transition-all duration-200 origin-top ${isCategoryOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
                        {metalCategories.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(option);
                              setIsCategoryOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${selectedCategory === option ? 'text-text-primary font-medium bg-surface-muted' : 'text-text-secondary hover:bg-surface-muted hover:text-gray-900'}`}
                          >
                            {option}
                            {selectedCategory === option && (
                              <svg className="h-4 w-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="alloy" className="block text-sm font-medium text-text-secondary mb-2">Alloy Grade Required</label>
                    <input type="text" name="alloy" id="alloy" required className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm" placeholder="e.g., ETP, C260, C52100" />
                  </div>

                  {/* Form Factor Dropdown */}
                  <div>
                    <label htmlFor="factor" className="block text-sm font-medium text-text-secondary mb-2">Form Factor</label>
                    
                    {isFactorOpen && (
                      <div className="fixed inset-0 z-10" onClick={() => setIsFactorOpen(false)}></div>
                    )}
                    
                    <div className="relative z-20">
                      <input type="hidden" name="factor" value={selectedFactor} />
                      <button 
                        type="button" 
                        onClick={() => setIsFactorOpen(!isFactorOpen)}
                        className={`w-full py-3 px-4 bg-surface-muted border ${isFactorOpen ? 'border-black ring-1 ring-black shadow-md' : 'border-border-subtle shadow-sm hover:bg-white'} rounded-xl transition-all outline-none text-left flex justify-between items-center`}
                      >
                        <span className="text-text-primary">{selectedFactor}</span>
                        <svg className={`h-4 w-4 text-text-muted transition-transform duration-300 ${isFactorOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </button>
                      
                      <div className={`absolute top-full left-0 mt-2 w-full bg-surface border border-border-base rounded-xl shadow-xl overflow-hidden py-2 z-30 transition-all duration-200 origin-top ${isFactorOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
                        {formFactors.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setSelectedFactor(option);
                              setIsFactorOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${selectedFactor === option ? 'text-text-primary font-medium bg-surface-muted' : 'text-text-secondary hover:bg-surface-muted hover:text-gray-900'}`}
                          >
                            {option}
                            {selectedFactor === option && (
                              <svg className="h-4 w-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dimensions" className="block text-sm font-medium text-text-secondary mb-2">Dimensions / Blueprints Required</label>
                    <textarea id="dimensions" name="dimensions" rows={2} required className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary resize-y shadow-sm" placeholder="Thickness, Width, Diameter..."></textarea>
                  </div>

                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-text-secondary mb-2">Order Quantity</label>
                    <input type="text" name="quantity" id="quantity" required className="block w-full py-3 px-4 bg-surface-muted border border-border-subtle rounded-xl focus:ring-black focus:border-black transition-all hover:bg-white outline-none text-text-primary shadow-sm" placeholder="In Kilograms or Metric Tons" />
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-medium text-text-secondary mb-4">Testing Documentation Required?</label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 text-sm text-text-primary cursor-pointer">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-text-primary rounded border-border-subtle focus:ring-black bg-surface-muted" />
                        <span>Company Test Certificate (TC)</span>
                      </label>
                      <label className="flex items-center space-x-3 text-sm text-text-primary cursor-pointer">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-text-primary rounded border-border-subtle focus:ring-black bg-surface-muted" />
                        <span>NABL Lab Certificate</span>
                      </label>
                      <label className="flex items-center space-x-3 text-sm text-text-primary cursor-pointer">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-text-primary rounded border-border-subtle focus:ring-black bg-surface-muted" />
                        <span>Ultrasonic Report</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-6">
                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-4 px-8 border border-transparent rounded-full shadow-md hover:shadow-lg text-base font-medium text-text-inverse bg-text-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-70 disabled:cursor-not-allowed group">
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-text-inverse" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Submit RFQ
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

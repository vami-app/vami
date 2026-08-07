"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { MapPin, Mail, Phone, ArrowRight, Loader2, Users } from "lucide-react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const metalCategories = ["Copper", "Brass", "Phosphor Bronze", "Aluminium"];
  const formFactors = [
    "Sheets",
    "Plates",
    "Circles",
    "Ingots",
    "Custom Castings",
  ];

  const [selectedCategory, setSelectedCategory] = useState(metalCategories[0]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [selectedFactor, setSelectedFactor] = useState(formFactors[0]);
  const [isFactorOpen, setIsFactorOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 50);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;

    setTimeout(() => {
      setLoading(false);
      toast.success(
        "Your RFQ has been received. Our team will contact you shortly.",
      );
      form.reset();
    }, 1200);
  };

  return (
    <div className="layout-main">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--surface-muted)",
            color: "var(--text-primary)",
            borderRadius: "12px",
            border: "1px solid var(--border-subtle)",
          },
        }}
      />

      <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32 w-full border-b border-border-subtle bg-surface overflow-hidden">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div
              className={`flex flex-col justify-center transition-all duration-1000 ease-out transform ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <span className="text-xs font-semibold text-text-muted tracking-[0.2em] uppercase mb-6 block">
                Get In Touch With Our Team
              </span>
              <h1 className="font-headline font-light text-text-primary leading-tight text-5xl sm:text-6xl lg:text-7xl text-balance mb-8">
                Radhey Metal Alloys LLP
              </h1>
              <p className="text-text-muted text-lg sm:text-xl font-light leading-relaxed max-w-xl mb-12">
                For direct procurement inquiries, technical calculations, or
                orders, reach out to our designated partners.
              </p>

              <div
                className={`space-y-8 border-t border-border-subtle pt-10 transition-all duration-1000 delay-200 ease-out transform ${
                  mounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
                <div className="flex items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-surface-muted border border-border-subtle flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110">
                    <Users className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-text-primary">
                      Contact Persons
                    </h3>
                    <p className="mt-2 text-text-muted font-light leading-relaxed">
                      Kevin Shah | Arth Joshi | Aditya Joshi
                    </p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-surface-muted border border-border-subtle flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110">
                    <Phone className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-text-primary">
                      Direct Phone Lines
                    </h3>
                    <p className="mt-2 text-text-muted font-light leading-relaxed">
                      <a
                        href="tel:+919081358107"
                        className="hover:text-text-primary transition-colors"
                      >
                        +91 9081358107
                      </a>
                      <br />
                      <a
                        href="tel:+918469669699"
                        className="hover:text-text-primary transition-colors"
                      >
                        +91 8469669699
                      </a>
                      <br />
                      <a
                        href="tel:+918141888799"
                        className="hover:text-text-primary transition-colors"
                      >
                        +91 8141888799
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-surface-muted border border-border-subtle flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110">
                    <Mail className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-text-primary">
                      Official Email
                    </h3>
                    <p className="mt-2 text-text-muted font-light leading-relaxed">
                      <a
                        href="mailto:radhemetalalloysllp@gmail.com"
                        className="hover:text-text-primary transition-colors underline underline-offset-4 decoration-border-base hover:decoration-text-primary"
                      >
                        radhemetalalloysllp@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-surface-muted border border-border-subtle flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110">
                    <MapPin className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-text-primary">
                      Registered Office
                    </h3>
                    <p className="mt-2 text-text-muted font-light leading-relaxed">
                      43, Vardhmaan Nagar, Kalol <br />
                      Gandhinagar, Gujarat <br />
                      India - 382721
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`lg:pl-8 transition-all duration-1000 delay-300 ease-out transform ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
            >
              <div className="bg-surface rounded-[var(--outer-radius)] p-8 sm:p-10 border border-border-subtle shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-shadow duration-500">
                <h3 className="text-2xl font-headline text-text-primary mb-8">
                  Request a Quote
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-text-secondary mb-2 ml-1"
                    >
                      Company Name & Contact Person
                    </label>
                    <input
                      type="text"
                      name="company"
                      id="company"
                      required
                      className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                      placeholder="Acme Industries - Jane Doe"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-text-secondary mb-2 ml-1"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                        placeholder="jane@acme.com"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-text-secondary mb-2 ml-1"
                      >
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        required
                        className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                        placeholder="+91 00000 00000"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-text-secondary mb-2 ml-1"
                    >
                      Metal Category
                    </label>

                    {isCategoryOpen && (
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsCategoryOpen(false)}
                      />
                    )}

                    <div
                      className={`relative ${isCategoryOpen ? "z-30" : "z-10"}`}
                    >
                      <input
                        type="hidden"
                        name="category"
                        value={selectedCategory}
                      />
                      <button
                        type="button"
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className={`w-full py-3.5 px-5 bg-surface/50 border ${
                          isCategoryOpen
                            ? "border-text-primary ring-1 ring-text-primary bg-surface"
                            : "border-border-subtle hover:border-border-base"
                        } rounded-lg transition-all duration-300 outline-none text-left flex justify-between items-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]`}
                      >
                        <span className="text-text-primary font-medium">
                          {selectedCategory}
                        </span>
                        <svg
                          className={`h-4 w-4 text-text-muted transition-transform duration-300 ease-out ${
                            isCategoryOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      <div
                        className={`absolute top-[calc(100%+8px)] left-0 w-full bg-surface/95 backdrop-blur-xl border border-border-base rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.08)] overflow-hidden p-2 transition-all duration-300 ease-[cubic-bezier(0.2,0.7,0.3,1)] ${
                          isCategoryOpen
                            ? "opacity-100 translate-y-0 scale-100"
                            : "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none"
                        }`}
                      >
                        <div className="space-y-1">
                          {metalCategories.map((option) => {
                            const isSelected = selectedCategory === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(option);
                                  setIsCategoryOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground font-semibold shadow-md"
                                    : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                                }`}
                              >
                                {option}
                                {isSelected && (
                                  <svg
                                    className="h-4 w-4 text-primary-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2.5"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="alloy"
                      className="block text-sm font-medium text-text-secondary mb-2 ml-1"
                    >
                      Alloy Grade Required
                    </label>
                    <input
                      type="text"
                      name="alloy"
                      id="alloy"
                      required
                      className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                      placeholder="e.g., ETP, C260, C52100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="factor"
                      className="block text-sm font-medium text-text-secondary mb-2 ml-1"
                    >
                      Form Factor
                    </label>

                    {isFactorOpen && (
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsFactorOpen(false)}
                      />
                    )}

                    <div
                      className={`relative ${isFactorOpen ? "z-30" : "z-10"}`}
                    >
                      <input
                        type="hidden"
                        name="factor"
                        value={selectedFactor}
                      />
                      <button
                        type="button"
                        onClick={() => setIsFactorOpen(!isFactorOpen)}
                        className={`w-full py-3.5 px-5 bg-surface/50 border ${
                          isFactorOpen
                            ? "border-text-primary ring-1 ring-text-primary bg-surface"
                            : "border-border-subtle hover:border-border-base"
                        } rounded-lg transition-all duration-300 outline-none text-left flex justify-between items-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]`}
                      >
                        <span className="text-text-primary font-medium">
                          {selectedFactor}
                        </span>
                        <svg
                          className={`h-4 w-4 text-text-muted transition-transform duration-300 ease-out ${
                            isFactorOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      <div
                        className={`absolute top-[calc(100%+8px)] left-0 w-full bg-surface/95 backdrop-blur-xl border border-border-base rounded-lg shadow-[0_16px_40px_rgba(0,0,0,0.08)] overflow-hidden p-2 z-30 transition-all duration-300 ease-[cubic-bezier(0.2,0.7,0.3,1)] ${
                          isFactorOpen
                            ? "opacity-100 translate-y-0 scale-100"
                            : "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none"
                        }`}
                      >
                        <div className="space-y-1">
                          {formFactors.map((option) => {
                            const isSelected = selectedFactor === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  setSelectedFactor(option);
                                  setIsFactorOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground font-semibold shadow-md"
                                    : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                                }`}
                              >
                                {option}
                                {isSelected && (
                                  <svg
                                    className="h-4 w-4 text-primary-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2.5"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="dimensions"
                      className="block text-sm font-medium text-text-secondary mb-2 ml-1"
                    >
                      Dimensions / Blueprints Required
                    </label>
                    <textarea
                      id="dimensions"
                      name="dimensions"
                      rows={2}
                      required
                      className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary resize-y shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                      placeholder="Thickness, Width, Diameter..."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="quantity"
                      className="block text-sm font-medium text-text-secondary mb-2 ml-1"
                    >
                      Order Quantity
                    </label>
                    <input
                      type="text"
                      name="quantity"
                      id="quantity"
                      required
                      className="block w-full py-3.5 px-5 bg-surface/50 border border-border-subtle rounded-lg focus:bg-surface focus:ring-1 focus:ring-text-primary focus:border-text-primary transition-all duration-300 hover:border-border-base outline-none text-text-primary shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                      placeholder="In Kilograms or Metric Tons"
                    />
                  </div>

                  <div className="pt-2 px-1">
                    <label className="block text-sm font-medium text-text-secondary mb-5">
                      Testing Documentation Required?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label className="flex items-center space-x-3 p-4 border border-border-subtle rounded-lg hover:bg-surface-subtle cursor-pointer transition-colors group">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-text-primary rounded border-border-subtle focus:ring-text-primary bg-surface/50 group-hover:bg-surface"
                        />
                        <span className="text-sm font-medium text-text-primary">
                          TC
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 p-4 border border-border-subtle rounded-lg hover:bg-surface-subtle cursor-pointer transition-colors group">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-text-primary rounded border-border-subtle focus:ring-text-primary bg-surface/50 group-hover:bg-surface"
                        />
                        <span className="text-sm font-medium text-text-primary">
                          NABL
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 p-4 border border-border-subtle rounded-lg hover:bg-surface-subtle cursor-pointer transition-colors group">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-text-primary rounded border-border-subtle focus:ring-text-primary bg-surface/50 group-hover:bg-surface"
                        />
                        <span className="text-sm font-medium text-text-primary">
                          Ultrasonic
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-4 px-8 border border-transparent rounded-lg shadow-md hover:shadow-lg text-sm uppercase tracking-wider font-semibold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Submit RFQ
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Your message has been sent. We will contact you shortly.');
      e.target.reset();
    }, 1000);
  };

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:col-span-3 lg:py-24 lg:px-8 xl:pl-12">
      <Toaster position="top-right" />
      <div className="max-w-lg mx-auto lg:max-w-none">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Get in Touch / Request Quote</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6 max-w-2xl mx-auto">
          <div>
            <label htmlFor="full-name" className="sr-only">Full name</label>
            <input type="text" name="full-name" id="full-name" autoComplete="name" className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md border" placeholder="Full name" required />
          </div>
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md border" placeholder="Email" required />
          </div>
          <div>
            <label htmlFor="phone" className="sr-only">Phone</label>
            <input type="text" name="phone" id="phone" autoComplete="tel" className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md border" placeholder="Phone" />
          </div>
          <div>
            <label htmlFor="message" className="sr-only">Message</label>
            <textarea id="message" name="message" rows={4} className="block w-full shadow-sm py-3 px-4 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border border-gray-300 rounded-md" placeholder="Your requirements or message" required defaultValue={''} />
          </div>
          <div>
            <button type="submit" disabled={loading} className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full disabled:opacity-50">
              {loading ? 'Sending...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

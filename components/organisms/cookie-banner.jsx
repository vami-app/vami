'use client';

import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Link } from '@/components/atoms/link';
import { Icon } from '@/components/atoms/icon';
import { Text } from '@/components/atoms/text';

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setTimeout(() => setShow(true), 500);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShow(false);
  };

  const dismiss = () => {
    setShow(false);
  };

  return (
    <div 
      className={`fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-background/80 backdrop-blur-xl border border-border-subtle shadow-2xl rounded-2xl p-5 sm:p-6 flex flex-col gap-4 relative">
        <Button 
          variant="ghost"
          size="icon"
          onClick={dismiss}
          className="absolute top-4 right-4 h-6 w-6 rounded-full"
          aria-label="Close"
        >
          <Icon icon={X} size="sm" />
        </Button>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-surface-muted rounded-full shrink-0">
            <Icon icon={Cookie} size="md" className="text-text-primary" />
          </div>
          <div>
            <Text as="h3" variant="cta" className="mb-1 text-sm text-text-primary">
              We value your privacy
            </Text>
            <Text variant="caption" className="leading-relaxed">
              We use essential cookies to make our site work safely. We also use analytics cookies to understand how you interact with our site so we can improve it. 
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full mt-2">
          <Button 
            onClick={accept} 
            className="flex-1 rounded-xl py-2.5"
          >
            Accept
          </Button>
          <Button 
            asChild
            variant="outline"
            className="flex-1 rounded-xl py-2.5"
          >
            <Link href="/privacy" className="hover:no-underline">
              Learn More
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

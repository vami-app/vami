export const metadata = {
  title: "Privacy Policy | Radhey Metal Alloys LLP",
  description: "Privacy Policy for Radhey Metal Alloys LLP",
};

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-16 bg-surface min-h-screen flex justify-center">
      <div className="max-w-3xl w-full px-[var(--gap)]">
        <h1 className="font-headline font-light text-text-primary mb-8 text-4xl sm:text-5xl">
          Privacy Policy
        </h1>
        
        <div className="prose prose-lg dark:prose-invert text-text-secondary font-light leading-relaxed">
          <p>
            At Radhey Metal Alloys LLP, we value your business and your privacy. Any personal or corporate data collected through our Request for Quote (RFQ) or Contact forms—including your name, phone numbers (+91 9081358107, +91 8469669699, +91 8141888799), corporate emails, and blueprint files—is strictly used to evaluate your business requirements, generate custom manufacturing price quotes, and manage our direct communication with you.
          </p>
          <p>
            We do not sell, distribute, or share your proprietary technical layouts or contact data with third-party marketing companies. All blueprint uploads for custom castings remain entirely confidential.
          </p>
          <p>
            For queries regarding your data, contact us directly at <a href="mailto:radhemetalalloysllp@gmail.com" className="text-text-primary font-medium hover:underline">radhemetalalloysllp@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Terms of Use',
  description: 'Terms of use for the Radhey Metal Alloys LLP website.',
};

export default function TermsPage() {
  return (
    <div className="layout-main">
      <article className="max-w-3xl mx-auto px-[var(--gap)] py-16 sm:py-24">
        <h1 className="font-headline text-4xl text-text-primary font-light">Terms of Use</h1>
        <div className="mt-8 space-y-4 text-text-muted font-light leading-relaxed">
          <p>
            By using this website you agree to these terms. Product information is provided for
            general guidance. Final specifications, commercial terms and delivery commitments are
            confirmed only in a written quotation from Radhey Metal Alloys LLP.
          </p>
          <p>
            You may not misuse the RFQ form, attempt unauthorized access to the admin area, or
            scrape the site in a way that impairs service.
          </p>
          <p>
            Replace this placeholder with client-approved legal terms before production launch.
          </p>
        </div>
      </article>
    </div>
  );
}

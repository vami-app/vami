export const metadata = {
  title: 'Disclaimer',
  description: 'Metallurgical and commercial disclaimer for Radhey Metal Alloys LLP.',
};

export default function DisclaimerPage() {
  return (
    <div className="layout-main">
      <article className="max-w-3xl mx-auto px-[var(--gap)] py-16 sm:py-24">
        <h1 className="font-headline text-4xl text-text-primary font-light">Disclaimer</h1>
        <div className="mt-8 space-y-4 text-text-muted font-light leading-relaxed">
          <p>
            Grades, dimensional ranges, standards and quality claims published on this website are
            subject to confirmation for each order. Do not rely on website copy alone for
            contractual specifications.
          </p>
          <p>
            References to laboratory reports describe documentation that may accompany supply when
            requested. Accreditation claims are published only when supported by verified
            certificates.
          </p>
          <p>
            Sample certificates and catalogue stubs on this site are illustrative. Binding
            commercial and metallurgical commitments are issued only through a formal quotation
            and order acknowledgement from Radhey Metal Alloys LLP.
          </p>
        </div>
      </article>
    </div>
  );
}

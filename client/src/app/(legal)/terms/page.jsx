export const metadata = {
  title: "Terms of Service — Inkwell",
  description: "Terms of Service and legal agreement for using the Inkwell publishing platform.",
};

export default function TermsOfService() {
  return (
    <article className="prose prose-indigo max-w-none rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">Terms of Service</h1>
      <p className="text-sm text-ink-faint">Last Updated: July 17, 2026</p>

      <hr className="my-6 border-gray-100" />

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">1. Acceptance of Terms</h2>
        <p className="text-ink-soft">
          Welcome to Inkwell. By accessing or using our platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
        </p>

        <h2 className="text-xl font-bold text-ink">2. User Accounts & Registration</h2>
        <p className="text-ink-soft">
          To write stories, leave comments, and interact with other authors, you must register for an account. You agree to provide accurate information (name, username, and email address) during registration. You are solely responsible for maintaining the confidentiality of your account credentials.
        </p>

        <h2 className="text-xl font-bold text-ink">3. Content Ownership & Portability</h2>
        <p className="text-ink-soft">
          <strong>Your content belongs to you.</strong> You retain full copyright and ownership of any text, images, or files you publish on Inkwell. By publishing, you grant Inkwell a non-exclusive, royalty-free, worldwide license to display and distribute your stories to readers.
        </p>
        <p className="text-ink-soft">
          We guarantee your sovereignty over your data. You can download a full archive containing all your published stories, draft posts, comments, profiles, and follower records via the Account Settings dashboard at any time.
        </p>

        <h2 className="text-xl font-bold text-ink">4. Acceptable Use Policy</h2>
        <p className="text-ink-soft">
          You agree not to upload or publish any content that:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-ink-soft">
          <li>Infringes on copyrights, trademarks, or intellectual property rights.</li>
          <li>Contains malicious software, virus code, or scripts intended to cause harm (all markup is subject to server-side HTML sanitization).</li>
          <li>Harasses, abuses, or threatens other users.</li>
          <li>Acts as spam or deceptive commercial content.</li>
        </ul>

        <h2 className="text-xl font-bold text-ink">5. Account Deletion & GDPR Compliance</h2>
        <p className="text-ink-soft">
          You have the absolute right to delete your account. You can request complete erasure of your account data or choose to anonymize your written stories to prevent breaking nested discussion threads. Upon confirming a full erasure request, all posts, comments, follows, claps, and profile records are permanently purged from our database.
        </p>

        <h2 className="text-xl font-bold text-ink">6. Limitation of Liability</h2>
        <p className="text-ink-soft">
          Inkwell is provided "as is" without warranties of any kind. We are not liable for any content posted by users or any damages resulting from your use of the platform.
        </p>

        <h2 className="text-xl font-bold text-ink">7. Governing Law</h2>
        <p className="text-ink-soft">
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the developer resides, without regard to conflict of law principles.
        </p>
      </section>
    </article>
  );
}

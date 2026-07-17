export const metadata = {
  title: "Privacy Policy — Inkwell",
  description: "Privacy Policy detailing data collection, cookies, and privacy rights on the Inkwell publishing platform.",
};

export default function PrivacyPolicy() {
  return (
    <article className="prose prose-indigo max-w-none rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">Privacy Policy</h1>
      <p className="text-sm text-ink-faint">Last Updated: July 17, 2026</p>

      <hr className="my-6 border-gray-100" />

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-ink">1. Information We Collect</h2>
        <p className="text-ink-soft">
          We collect and process only the minimal personal data necessary to operate the platform:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-ink-soft">
          <li><strong>Registration Details:</strong> Your name, username, email address, and a cryptographically hashed representation of your password.</li>
          <li><strong>User Profiles:</strong> Optional bio information and avatar image uploads.</li>
          <li><strong>User Interactions:</strong> Follows, claps, comments, bookmarks, and story publication history.</li>
        </ul>

        <h2 className="text-xl font-bold text-ink">2. Cookie Policy</h2>
        <p className="text-ink-soft">
          Inkwell does not employ third-party tracking cookies or advertising scripts. We use only standard first-party, secure, HTTP-only session cookies to manage user authentication (access and refresh tokens). These cookies are essential for maintaining your logged-in state.
        </p>

        <h2 className="text-xl font-bold text-ink">3. Third-Party Processors</h2>
        <p className="text-ink-soft">
          We work with select subprocessors to support core platform functionality:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-ink-soft">
          <li><strong>MongoDB:</strong> Primary database cluster for storing users, stories, comments, and relationships.</li>
          <li><strong>Resend / Mailtrap:</strong> E-mail dispatch services used to send critical notifications, digests, and password-reset links.</li>
        </ul>

        <h2 className="text-xl font-bold text-ink">4. Email Communication and Choice</h2>
        <p className="text-ink-soft">
          We send transactional emails (e.g. password resets, verification codes) and publication updates (e.g. notifications when an author you follow publishes a story, and weekly digests). You have full control over these notifications. You can toggle email alerts off or manage digest frequencies in your settings page, or use the one-click unsubscribe links present in every mailing.
        </p>

        <h2 className="text-xl font-bold text-ink">5. Data Retention & Portability</h2>
        <p className="text-ink-soft">
          You retain sovereign access rights to your account data. At any point, you can trigger a full ZIP export of your account. This file contains your profile metadata, a posts index, and your stories saved in both JSON and Markdown formats, as well as a index of your followers.
        </p>

        <h2 className="text-xl font-bold text-ink">6. Deletion Rights</h2>
        <p className="text-ink-soft">
          In alignment with GDPR erasure standards, you may delete your account at any time. When executing account deletion, you may choose to hard-delete all stories (full erasure) or keep your stories online with all author attributes and emails replaced by anonymous placeholder records (anonymization).
        </p>
      </section>
    </article>
  );
}

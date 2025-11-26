import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              TahOak Park Collective (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mb-3">
              <li><strong>Account Information:</strong> Name, email address, password (hashed)</li>
              <li><strong>Entity Information:</strong> Business/organization details you provide when claiming or creating listings</li>
              <li><strong>Contact Information:</strong> Email addresses provided for subscriptions, suggestions, or issue reports</li>
              <li><strong>Content:</strong> Images, descriptions, and other content you upload</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>IP address and browser information (for security and analytics)</li>
              <li>Usage data through privacy-focused analytics (self-hosted Umami)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-2">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Provide, maintain, and improve the Platform</li>
              <li>Process and manage your account and entity listings</li>
              <li>Send you email updates (if you&apos;ve subscribed with double opt-in)</li>
              <li>Respond to your inquiries and requests</li>
              <li>Protect against fraudulent or unauthorized activity</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Email Communications</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Subscriptions:</strong> We use a double opt-in process for email subscriptions.
              You must verify your email address before receiving updates. You can manage your
              preferences or unsubscribe at any time using the magic links we provide.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Transactional Emails:</strong> We send essential emails related to your account,
              entity claims, and platform notifications. These cannot be opted out of as they are
              necessary for Platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Analytics</h2>
            <p className="text-gray-700 leading-relaxed">
              We use a self-hosted, privacy-focused analytics tool (Umami) that does not use cookies
              or track personal information. We only collect aggregate data about page views and
              visitor patterns. No cookie banners are required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-2">We do not sell, trade, or rent your personal information. We may share information:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>With service providers who assist in operating the Platform (e.g., email service)</li>
              <li>When required by law or to protect our rights</li>
              <li>Entity information you choose to make public (business listings are visible to all visitors)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement reasonable security measures to protect your information, including password
              hashing (bcrypt) and secure data transmission. However, no method of transmission over
              the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Access and update your account information</li>
              <li>Delete your account (contact us to request deletion)</li>
              <li>Unsubscribe from email communications (use the unsubscribe link in emails)</li>
              <li>Request information about the data we hold about you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Platform is not intended for children under 13. We do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy, please{" "}
              <Link href="/contact" className="text-indigo-600 hover:text-indigo-800 font-medium">
                contact us
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}



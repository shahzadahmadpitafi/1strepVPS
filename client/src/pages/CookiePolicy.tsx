import HeaderClean from '@/components/HeaderClean';
import { Link } from 'wouter';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClean />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-md shadow-sm p-8">
          <h1 className="text-4xl font-bold text-black mb-2">Cookie Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: October 2025</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Cookie Policy explains how 1stRep ("we", "us", or "our") uses cookies and similar tracking technologies 
                when you visit our website. This policy is part of our Privacy Policy and should be read in conjunction with it.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We are committed to being transparent about how we use cookies and giving you control over your preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">2. What Are Cookies?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cookies are small text files that are placed on your device when you visit a website. They are widely used 
                to make websites work more efficiently and provide information to the website owners.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device after you close 
                your browser, while session cookies are deleted when you close your browser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">3. How We Use Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies for the following purposes:
              </p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-black pl-4">
                  <h3 className="text-lg font-semibold text-black mb-2">3.1 Strictly Necessary Cookies</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    These cookies are essential for the website to function properly. They enable core functionality such as:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>User authentication and session management</li>
                    <li>Shopping cart functionality</li>
                    <li>Security and fraud prevention</li>
                    <li>Remember your cookie preferences</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    <strong>Legal basis:</strong> These cookies are necessary for the performance of our contract with you 
                    and cannot be disabled.
                  </p>
                </div>

                <div className="border-l-4 border-gray-400 pl-4">
                  <h3 className="text-lg font-semibold text-black mb-2">3.2 Analytics Cookies</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    These cookies help us understand how visitors interact with our website by collecting and reporting 
                    information anonymously. We use this data to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Analyse website usage and performance</li>
                    <li>Track section views and clicks to improve content organisation</li>
                    <li>Understand which products and pages are most popular</li>
                    <li>Improve our website and user experience</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    <strong>Legal basis:</strong> We use these cookies only with your explicit consent.
                  </p>
                </div>

                <div className="border-l-4 border-gray-400 pl-4">
                  <h3 className="text-lg font-semibold text-black mb-2">3.3 Marketing Cookies</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    These cookies are used to deliver advertisements that are relevant to you and your interests. They may be used to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Show you personalised product recommendations</li>
                    <li>Remember your preferences and interests</li>
                    <li>Limit the number of times you see an advertisement</li>
                    <li>Measure the effectiveness of advertising campaigns</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    <strong>Legal basis:</strong> We use these cookies only with your explicit consent.
                  </p>
                </div>

                <div className="border-l-4 border-gray-400 pl-4">
                  <h3 className="text-lg font-semibold text-black mb-2">3.4 Functional Cookies</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    These cookies enable enhanced functionality and personalisation, such as:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Remembering your language preferences</li>
                    <li>Storing your wishlist items</li>
                    <li>Personalising content based on your browsing behaviour</li>
                    <li>Remembering your location for delivery estimates</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    <strong>Legal basis:</strong> We use these cookies only with your explicit consent.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Some cookies are placed by third-party services that appear on our pages. We use the following third-party services:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  <strong>Stripe:</strong> For secure payment processing (strictly necessary)
                </li>
                <li>
                  <strong>Analytics providers:</strong> To understand website usage (requires consent)
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                These third parties may use cookies subject to their own privacy policies. We do not control these cookies 
                and recommend reviewing the third parties' privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">5. Managing Your Cookie Preferences</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to decide whether to accept or reject cookies (except strictly necessary cookies). 
                You can exercise your cookie preferences by:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Using the cookie consent banner when you first visit our website</li>
                <li>Changing your browser settings to refuse all or some cookies</li>
                <li>Deleting cookies that have already been set</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Please note that blocking certain cookies may impact your experience on our website and limit the 
                functionality available to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">6. Browser Controls</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Most browsers allow you to control cookies through their settings. You can find out more about cookies 
                and how to manage them by visiting:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Google Chrome: Settings &gt; Privacy and security &gt; Cookies</li>
                <li>Mozilla Firefox: Options &gt; Privacy &amp; Security</li>
                <li>Safari: Preferences &gt; Privacy</li>
                <li>Microsoft Edge: Settings &gt; Privacy, search, and services</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You can also visit <a href="http://www.aboutcookies.org" className="text-black underline hover:no-underline" target="_blank" rel="noopener noreferrer">www.aboutcookies.org</a> for 
                detailed information about managing cookies on various browsers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">7. Changes to This Cookie Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our 
                business operations. We will notify you of any material changes by posting the updated policy on this page 
                with a new "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">8. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about our use of cookies, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-gray-700"><strong>Email:</strong> privacy@1strep.co.uk</p>
                <p className="text-gray-700"><strong>Address:</strong> 1stRep Ltd, United Kingdom</p>
              </div>
            </section>

            <section className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                For more information about how we process your personal data, please see our{' '}
                <Link href="/privacy-policy" className="text-black underline hover:no-underline">
                  Privacy Policy
                </Link>.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-black underline hover:no-underline" data-testid="link-back-home">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

import HeaderClean from '@/components/HeaderClean';
import { Link } from 'wouter';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClean />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-md shadow-sm p-8">
          <h1 className="text-4xl font-bold text-black mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: October 2025</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to 1stRep. We are committed to protecting your personal data and respecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
                visit our website and use our services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This policy applies to all users of our website, including customers and business resellers. 
                We are a UK-based company and comply with the UK General Data Protection Regulation (UK GDPR) and 
                the Data Protection Act 2018.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">2. Data Controller</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                1stRep Ltd is the data controller responsible for your personal data. Our contact details are:
              </p>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-gray-700"><strong>Company:</strong> 1stRep Ltd</p>
                <p className="text-gray-700"><strong>Email:</strong> privacy@1strep.co.uk</p>
                <p className="text-gray-700"><strong>Address:</strong> United Kingdom</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">3. Information We Collect</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">3.1 Information You Provide</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">We collect information that you provide directly to us:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li><strong>Account Information:</strong> Name, email address, password when you create an account</li>
                    <li><strong>Order Information:</strong> Shipping address, billing address, phone number</li>
                    <li><strong>Payment Information:</strong> Payment card details (processed securely by Stripe)</li>
                    <li><strong>Communications:</strong> Messages you send us through contact forms or customer support</li>
                    <li><strong>Reviews:</strong> Product reviews, ratings, and comments you submit</li>
                    <li><strong>Business Information:</strong> For resellers - business name, registration details, tax information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">3.2 Information Collected Automatically</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">When you use our website, we automatically collect:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                    <li><strong>Usage Data:</strong> Pages viewed, time spent on pages, click patterns</li>
                    <li><strong>Shopping Behaviour:</strong> Products viewed, items added to cart, wish list preferences</li>
                    <li><strong>Cookies:</strong> See our <Link href="/cookie-policy" className="text-black underline hover:no-underline">Cookie Policy</Link> for details</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-black mb-2">3.3 Information from Third Parties</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We may receive information from payment processors (Stripe) and delivery services to fulfill your orders.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">4. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use your personal data for the following purposes:</p>
              
              <div className="space-y-3">
                <div className="border-l-4 border-black pl-4">
                  <p className="text-gray-700"><strong>Order Processing:</strong> To process and deliver your orders, manage payments, and provide customer service</p>
                  <p className="text-sm text-gray-600 mt-1">Legal basis: Performance of contract</p>
                </div>
                
                <div className="border-l-4 border-gray-400 pl-4">
                  <p className="text-gray-700"><strong>Account Management:</strong> To create and manage your account, including reseller accounts</p>
                  <p className="text-sm text-gray-600 mt-1">Legal basis: Performance of contract</p>
                </div>
                
                <div className="border-l-4 border-gray-400 pl-4">
                  <p className="text-gray-700"><strong>Communications:</strong> To send order confirmations, shipping updates, and respond to inquiries</p>
                  <p className="text-sm text-gray-600 mt-1">Legal basis: Performance of contract and legitimate interests</p>
                </div>
                
                <div className="border-l-4 border-gray-400 pl-4">
                  <p className="text-gray-700"><strong>Marketing:</strong> To send promotional emails about new products, special offers (only with your consent)</p>
                  <p className="text-sm text-gray-600 mt-1">Legal basis: Consent (you can opt out at any time)</p>
                </div>
                
                <div className="border-l-4 border-gray-400 pl-4">
                  <p className="text-gray-700"><strong>Website Improvement:</strong> To analyse usage patterns and improve our website and services</p>
                  <p className="text-sm text-gray-600 mt-1">Legal basis: Legitimate interests and consent (for analytics cookies)</p>
                </div>
                
                <div className="border-l-4 border-gray-400 pl-4">
                  <p className="text-gray-700"><strong>Security:</strong> To detect and prevent fraud, ensure account security</p>
                  <p className="text-sm text-gray-600 mt-1">Legal basis: Legitimate interests and legal obligations</p>
                </div>
                
                <div className="border-l-4 border-gray-400 pl-4">
                  <p className="text-gray-700"><strong>Legal Compliance:</strong> To comply with legal obligations, such as tax and accounting requirements</p>
                  <p className="text-sm text-gray-600 mt-1">Legal basis: Legal obligations</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">5. Sharing Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We may share your personal data with:</p>
              
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Payment processors (Stripe), email service providers (SendGrid), delivery companies</li>
                <li><strong>Business Partners:</strong> For reseller orders, we may share information with authorised resellers</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
              
              <p className="text-gray-700 leading-relaxed mt-4">
                We do not sell your personal data to third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">6. International Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Some of our service providers may be located outside the UK. When we transfer data internationally, 
                we ensure appropriate safeguards are in place, such as Standard Contractual Clauses approved by the 
                UK Information Commissioner's Office (ICO).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">7. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We retain your personal data for as long as necessary to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Fulfil the purposes described in this policy</li>
                <li>Comply with legal obligations (e.g., tax records for 6 years)</li>
                <li>Resolve disputes and enforce our agreements</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                When we no longer need your data, we will securely delete or anonymize it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">8. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">Under UK GDPR, you have the following rights:</p>
              
              <div className="space-y-2">
                <div className="bg-gray-50 p-3 rounded border-l-4 border-black">
                  <p className="text-gray-700"><strong>Right of Access:</strong> Request a copy of your personal data</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                  <p className="text-gray-700"><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                  <p className="text-gray-700"><strong>Right to Erasure:</strong> Request deletion of your data (in certain circumstances)</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                  <p className="text-gray-700"><strong>Right to Restrict Processing:</strong> Limit how we use your data</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                  <p className="text-gray-700"><strong>Right to Data Portability:</strong> Receive your data in a portable format</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                  <p className="text-gray-700"><strong>Right to Object:</strong> Object to processing based on legitimate interests</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                  <p className="text-gray-700"><strong>Right to Withdraw Consent:</strong> Withdraw consent for marketing or cookies at any time</p>
                </div>
              </div>
              
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise any of these rights, please contact us at privacy@1strep.co.uk. We will respond within one month.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">9. Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organisational measures to protect your personal data against 
                unauthorised access, alteration, disclosure, or destruction. These include encryption, secure servers, 
                and regular security assessments. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are not directed to children under 16. We do not knowingly collect personal data from children. 
                If you believe we have collected data from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting 
                the updated policy on this page and updating the "Last updated" date. For material changes, we may also 
                send you an email notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">12. Contact Us and Complaints</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                <p className="text-gray-700"><strong>Email:</strong> privacy@1strep.co.uk</p>
                <p className="text-gray-700"><strong>Subject:</strong> Privacy Inquiry / Data Subject Request</p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) if you 
                believe we have not handled your data properly:
              </p>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
                <p className="text-gray-700"><strong>ICO Website:</strong> <a href="https://ico.org.uk" className="text-black underline hover:no-underline" target="_blank" rel="noopener noreferrer">ico.org.uk</a></p>
                <p className="text-gray-700"><strong>ICO Helpline:</strong> 0303 123 1113</p>
              </div>
            </section>

            <section className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                For information about how we use cookies, please see our{' '}
                <Link href="/cookie-policy" className="text-black underline hover:no-underline">
                  Cookie Policy
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

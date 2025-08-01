export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-10 sm:py-12">

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Privacy Policy
              </h1>
              <p className="text-gray-600 italic">
                Last updated: June 23, 2025
              </p>
            </div>

            {/* Section 1: Information Collection */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                1. Information Collection
              </h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>Information You Provide:</strong> We collect details such as your name, email, and any content you upload or edit when you create an account, use our services, or contact us for support.</p>
                <p><strong>Automated Information Collection:</strong> We automatically gather device and usage data such as IP address, browser type, ISP, pages visited, operating system, timestamps, and clickstream behavior.</p>
                <p><strong>Cookies and Tracking Technologies:</strong> KwixLab uses cookies and similar tools to improve user experience and analyze activity on our service.</p>
              </div>
            </section>

            {/* Section 2: Use of Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                2. Use of Information
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>To operate, maintain, and improve our services.</li>
                <li>To communicate with you and respond to your inquiries.</li>
                <li>To analyze usage and enhance user experience.</li>
                <li>To detect and prevent technical issues and fraud.</li>
              </ul>
            </section>

            {/* Section 3: Sharing of Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                3. Sharing of Information
              </h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>Service Providers:</strong> Your information may be shared with trusted third-party vendors who help operate our services, under strict data protection agreements.</p>
                <p><strong>Legal Obligations:</strong> We may disclose data if legally required or to comply with lawful requests from public authorities.</p>
                <p><strong>Protection of Rights and Safety:</strong> We may share information to safeguard the rights and safety of KwixLab, our users, or others.</p>
              </div>
            </section>

            {/* Section 4: Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                4. Security
              </h2>
              <p className="text-gray-700">
                We implement reasonable security measures to protect your data. However, no system is completely secure, and we cannot guarantee that transmissions or storage will be immune to breaches.
              </p>
            </section>

            {/* Section 5: International Transfers */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                5. International Transfers
              </h2>
              <p className="text-gray-700">
                Your information may be stored or processed in jurisdictions with different data protection laws than your own.
              </p>
            </section>

            {/* Section 6: Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                6. Your Rights
              </h2>
              <p className="text-gray-700">
                Depending on your location, you may have the right to access, update, delete, or restrict your personal data. Contact us to exercise any of these rights.
              </p>
            </section>

            {/* Section 7: Changes to This Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                7. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700">
                We may revise this Privacy Policy periodically. Any changes will be posted here, and the "Last Updated" date will reflect the most recent revision. We encourage you to review this page regularly.
              </p>
            </section>

            {/* Section 8: Contact Us */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                8. Contact Us
              </h2>
              <p className="text-gray-700 mb-4">
                For any questions or requests related to this Privacy Policy, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="font-medium text-gray-800 w-20">Email:</span>
                  <a href="mailto:info@kwixlab.com" className="text-blue-600 hover:text-blue-800 underline">
                    info@kwixlab.com
                  </a>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

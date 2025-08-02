export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-10 sm:py-12">

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Terms of Service
              </h1>
              <p className="text-gray-600 italic">
                Last updated: June 23, 2025
              </p>
            </div>

            {/* Section 1: Acceptance of Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700">
                By accessing and using the services provided by KwixLab, you agree to be bound by these Terms of Service ("TOS"). If you do not agree with any part of these terms, you may not use our services.
              </p>
            </section>

            {/* Section 2: Subscription & Cancellation */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                2. Subscription & Cancellation Policy
              </h2>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Cancellation Eligibility</h3>
                <p className="text-gray-700">
                  All subscribers may cancel their subscription at any time without providing a reason or obtaining approval.
                </p>
              </div>

              {/* <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 How to Cancel</h3>
                <p className="text-gray-700 mb-3">
                  To cancel your subscription:
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Visit <span className="font-mono bg-gray-100 px-2 py-1 rounded">/pricing</span></li>
                    <li>Locate the section displaying your current subscription.</li>
                    <li>Click the "Cancel" button to stop future billing.</li>
                  </ol>
                </div>
              </div> */}

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Service Continuation</h3>
                <p className="text-gray-700">
                  Your subscription will remain active until the end of the current billing cycle. You will continue to have full access during this time.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 No Further Charges</h3>
                <p className="text-gray-700">
                  Once cancellation is confirmed, no further payments will be collected.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">2.4 Data Retention</h3>
                <p className="text-gray-700">
                  Your data may be retained for potential reactivation. However, we reserve the right to delete it after cancellation. You may request permanent data removal in accordance with applicable privacy laws by contacting support.
                </p>
              </div>
            </section>

            {/* Section 3: Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                3. Contact Information
              </h2>
              <p className="text-gray-700 mb-4">
                For any questions or concerns regarding these Terms, please reach out to us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center">
                  <span className="font-medium text-gray-800 w-20">Email:</span>
                  <a href="mailto:info@kwixlab.com" className="text-blue-600 hover:text-blue-800 underline">
                    info@kwixlab.com
                  </a>
                </div>
              </div>
            </section>

            {/* Section 4: Amendments */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                4. Amendments
              </h2>
              <p className="text-gray-700 mb-4">
                KwixLab may update or revise this policy at any time. Changes will take effect once posted on our website.
              </p>
              <p className="text-gray-700">
                You are responsible for reviewing the policy periodically. The "Last Updated" date at the top reflects the most recent revision.
              </p>
            </section>

            {/* Section 5: Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                5. Governing Law
              </h2>
              <p className="text-gray-700">
                These Terms are governed by the laws of the jurisdiction in which KwixLab is incorporated, without regard to its conflict of law rules.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

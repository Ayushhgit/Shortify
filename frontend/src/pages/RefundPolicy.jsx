export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-8 sm:px-10 sm:py-12">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Refund Policy
              </h1>
              <p className="text-gray-600 italic">
                Last updated: June 23, 2025
              </p>
            </div>

            {/* Section 1: No Refunds */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                1. No Refunds
              </h2>
              <div className="space-y-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-gray-800 font-medium">
                    <strong>ALL SALES ARE FINAL.</strong> The Company does not offer refunds for any products or services under any circumstances once a transaction has been completed.
                  </p>
                </div>
                <p className="text-gray-700">
                  By making a purchase, you explicitly acknowledge and agree that you have read, understood, and accepted this strict no-refund policy.
                </p>
                <p className="text-gray-700">
                  No exceptions will be made to this no-refund policy, including but not limited to claims of dissatisfaction, accidental purchases, or changes in personal circumstances.
                </p>
              </div>
            </section>

            {/*
<section className="mb-8">
  <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
    2. Cancellation Policy
  </h2>

  <div className="mb-6">
    <h3 className="text-xl font-medium text-gray-800 mb-3">
      2.1 Eligibility:
    </h3>
    <p className="text-gray-700">
      All subscribers may cancel at any time at their choosing, no reason or approval required. You may do so in the dashboard following the steps outlined below.
    </p>
  </div>

  <div className="mb-6">
    <h3 className="text-xl font-medium text-gray-800 mb-3">
      2.2 Cancellation Process:
    </h3>
    <p className="text-gray-700 mb-3">
      To cancel your subscription, follow these steps:
    </p>
    <div className="bg-blue-50 p-4 rounded-lg">
      <ol className="list-decimal list-inside space-y-2 text-gray-700">
        <li>Go to <span className="font-mono bg-gray-100 px-2 py-1 rounded">kwixlab/pricing</span></li>
        <li>Above the plans, there will a section showing current subscription</li>
        <li>Press the "cancel" button on that section</li>
      </ol>
    </div>
  </div>

  <div className="mb-6">
    <h3 className="text-xl font-medium text-gray-800 mb-3">
      2.3 Service Continuation:
    </h3>
    <p className="text-gray-700">
      Upon cancellation, the plan will remain active until the end of the current billing cycle. The subscriber will continue to have full access to all features during this period.
    </p>
  </div>

  <div className="mb-6">
    <h3 className="text-xl font-medium text-gray-800 mb-3">
      2.4 No Additional Charges:
    </h3>
    <p className="text-gray-700">
      No further payments will be collected after the cancellation has been processed.
    </p>
  </div>

  <div className="mb-6">
    <h3 className="text-xl font-medium text-gray-800 mb-3">
      2.5 Data Retention:
    </h3>
    <p className="text-gray-700">
      Generally, data will be kept in case of reactivation. However, the Company reserves the right to delete any data upon cancellation. Please contact support if you wish to have your data removed in accordance to applicable privacy laws and our policy provisions.
    </p>
  </div>
</section>
*/}

            {/* Section 3: Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                3. Contact Information
              </h2>
              <p className="text-gray-700 mb-4">
                For any questions or concerns regarding this Refund Policy, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center">
                  <span className="font-medium text-gray-800 w-20">Email:</span>
                  <a href="mailto:support@crayo.ai" className="text-blue-600 hover:text-blue-800 underline">
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
              <div className="space-y-4">
                <p className="text-gray-700">
                  The Company reserves the right to modify this Policy at any time, effective upon posting of an updated version on our website.
                </p>
                <p className="text-gray-700">
                  You are responsible for regularly reviewing this Policy to stay informed of updates. The "Effective Date" at the beginning of this document indicates when the Policy was last revised.
                </p>
              </div>
            </section>

            {/* Section 5: Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                5. Governing Law
              </h2>
              <p className="text-gray-700">
                This Policy shall be governed by and construed in accordance with the laws of the jurisdiction in which KwixLab is registered, without regard to its conflict of law provisions.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
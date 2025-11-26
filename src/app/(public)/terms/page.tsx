export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Use</h1>
          <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using TahOak Park Collective ("the Platform"), you accept and agree to
              be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Use License</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Permission is granted to temporarily use the Platform for personal, non-commercial
              transitory viewing only. This is the grant of a license, not a transfer of title, and
              under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to reverse engineer any software contained on the Platform;</li>
              <li>remove any copyright or other proprietary notations from the materials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Image Licensing</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>By uploading images to the Platform, you grant TahOak Park Collective a
              non-exclusive, royalty-free, perpetual license to:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>Display, reproduce, and distribute the images in connection with your entity listing</li>
              <li>Use the images for promotional purposes related to the Platform</li>
              <li>Allow administrators to replace images with higher-quality or verified safe images
                  (e.g., photos taken by volunteers)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You represent and warrant that you own or have the necessary rights to grant this
              license for all images you upload. You retain ownership of your images, but grant the
              Platform the right to use them as described above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Content</h2>
            <p className="text-gray-700 leading-relaxed">
              You are responsible for all content you submit to the Platform. You agree not to submit
              any content that is illegal, harmful, threatening, abusive, or violates any third-party
              rights. Administrators reserve the right to remove any content that violates these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              The materials on TahOak Park Collective are provided on an 'as is' basis. TahOak Park
              Collective makes no warranties, expressed or implied, and hereby disclaims and negates
              all other warranties including, without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or non-infringement of intellectual
              property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitations</h2>
            <p className="text-gray-700 leading-relaxed">
              In no event shall TahOak Park Collective or its suppliers be liable for any damages
              (including, without limitation, damages for loss of data or profit, or due to business
              interruption) arising out of the use or inability to use the materials on the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Accuracy of Materials</h2>
            <p className="text-gray-700 leading-relaxed">
              The materials appearing on TahOak Park Collective could include technical, typographical,
              or photographic errors. TahOak Park Collective does not warrant that any of the materials
              on its website are accurate, complete, or current. TahOak Park Collective may make changes
              to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              TahOak Park Collective may revise these terms of service at any time without notice. By
              using this Platform, you are agreeing to be bound by the then current version of these
              terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Use, please{" "}
              <a href="/contact" className="text-indigo-600 hover:text-indigo-800 font-medium">
                contact us
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}



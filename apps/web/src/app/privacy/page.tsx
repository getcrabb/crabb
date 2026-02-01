export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-invert prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Overview</h2>
            <p className="text-gray-400">
              CRABB is designed with privacy as a core principle. The CLI scanner
              runs entirely locally on your machine and makes no network calls
              by default.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">What We Don&apos;t Collect</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li>We do not track local scans</li>
              <li>We do not collect telemetry</li>
              <li>We do not store file paths, variable names, or secret values</li>
              <li>We do not collect machine identifiers or IP addresses beyond standard server logs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">What We Collect (with --share only)</h2>
            <p className="text-gray-400 mb-4">
              When you explicitly use the <code className="text-crabb-orange">--share</code> flag,
              the following aggregated data is sent to create a score card:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2">
              <li>Your CRABB score (0-100)</li>
              <li>Your grade (A-F)</li>
              <li>Finding counts by severity (critical, high, medium, low)</li>
              <li>Finding counts by scanner (credentials, skills, permissions, network)</li>
              <li>CLI version</li>
            </ul>
            <p className="text-gray-400 mt-4">
              <strong>We never receive:</strong> actual secrets, file paths, domain names,
              variable names, or any raw finding details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Score Card Retention</h2>
            <p className="text-gray-400">
              Score cards are stored for 90 days and then automatically deleted.
              You can delete your score card at any time using the delete token
              provided when the card was created.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Website Analytics</h2>
            <p className="text-gray-400">
              We use minimal analytics to understand how the website is used.
              We track page views and referrers in aggregate. We do not use
              cookies for tracking.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Open Source</h2>
            <p className="text-gray-400">
              CRABB is fully open source. You can audit the code to verify
              our privacy practices at{' '}
              <a
                href="https://github.com/getcrabb/crabb"
                className="text-crabb-orange hover:underline"
              >
                github.com/getcrabb/crabb
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact</h2>
            <p className="text-gray-400">
              For privacy questions, open an issue on GitHub or email
              privacy@crabb.ai
            </p>
          </section>
        </div>

        <p className="text-gray-600 mt-12">
          Last updated: February 2026
        </p>
      </div>
    </main>
  );
}

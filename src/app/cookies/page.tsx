export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#05060f] px-6 py-20 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black">Cookie Policy</h1>

        <p className="mt-6 text-white/60">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-10 space-y-6 leading-7 text-white/70">
          <p>
            GamePing AI may use cookies and similar technologies to improve the
            website, remember preferences and understand how users interact with
            the service.
          </p>

          <h2 className="text-xl font-bold text-white">What cookies are</h2>
          <p>
            Cookies are small files stored on your device by your browser. They
            help websites work correctly and remember certain information.
          </p>

          <h2 className="text-xl font-bold text-white">Types of cookies we may use</h2>
          <ul className="list-disc pl-6">
            <li>Essential cookies required for login and basic functionality.</li>
            <li>Preference cookies used to remember settings or choices.</li>
            <li>Analytics cookies used to understand product usage.</li>
          </ul>

          <h2 className="text-xl font-bold text-white">Third-party services</h2>
          <p>
            Some services used by GamePing AI may set cookies or similar
            technologies, including authentication, analytics or payment tools.
          </p>

          <h2 className="text-xl font-bold text-white">Managing cookies</h2>
          <p>
            You can manage or delete cookies through your browser settings. Some
            parts of the service may not work correctly if essential cookies are
            disabled.
          </p>
        </div>
      </div>
    </main>
  );
}
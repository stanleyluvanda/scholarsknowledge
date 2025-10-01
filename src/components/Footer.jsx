// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-purple-600 bg-gradient-to-r from-purple-500 to-purple-700">
      <div className="max-w-6xl mx-auto px-4 py-10 text-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold">ScholarsKnowledge</h3>
            <p className="mt-2 text-sm">
              Connect with global universities, discover scholarships, and share academic resources.
            </p>

            {/* About / Partners / EduInfo links UNDER description */}
            <div className="mt-3 flex flex-col space-y-2 text-sm">
              <a href="/about" className="hover:text-purple-200">About</a>
              <a href="/partners" className="hover:text-purple-200">Partners</a>
              <a href="/eduinfo" className="hover:text-purple-200">EduInfo</a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Quick Links</h4>
            <ul className="mt-2 space-y-2 text-sm">
              <li><a href="/scholarship" className="hover:text-purple-200">Scholarships</a></li>
              <li><a href="/university-academic-platform" className="hover:text-purple-200">University Academic Platform</a></li>
              <li><a href="/global-academic-platform" className="hover:text-purple-200">Global Academic Platform</a></li>
              <li><a href="/student-marketplace" className="hover:text-purple-200">Student Marketplace</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Contact</h4>
            <ul className="mt-2 space-y-2 text-sm">
              <li>Email: support@scholarsknowledge.com</li>
              <li>USA • Global</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom copyright bar with blue background (same as Navbar) */}
      <div className="bg-blue-700 text-white text-center py-4">
        <p className="text-xs">
          © 2025 ScholarsKnowledge. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
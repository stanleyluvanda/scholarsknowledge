// src/pages/Contact.jsx
export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white shadow rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Get in Touch</h1>
        <p className="text-slate-600 mb-6">
          Have a question or want to partner with us? Send us a message below.
        </p>

        <form className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <input
            type="text"
            placeholder="Subject"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <textarea
            rows="5"
            placeholder="Your Message"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          ></textarea>

          <button
            type="submit"
            className="rounded-full bg-[#1a73e8] text-white px-5 py-3 font-semibold hover:opacity-90"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
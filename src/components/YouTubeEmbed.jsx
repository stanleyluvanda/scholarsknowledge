// src/components/YouTubeEmbed.jsx
export default function YouTubeEmbed({ idOrUrl, title = "Video", useNoCookie = true }) {
  const id = extractYouTubeId(idOrUrl);

  if (!id) {
    return (
      <div className="rounded-xl border p-3 text-sm text-red-600">
        Could not detect a valid YouTube Video ID from: <code className="text-red-700">{String(idOrUrl)}</code>
      </div>
    );
  }

  const base = useNoCookie ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";
  const src = `${base}/embed/${id}?rel=0&modestbranding=1`;

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full rounded-xl overflow-hidden shadow">
        <iframe
          className="w-full h-full"
          src={src}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {/* Helpful: always show the detected ID + an external link fallback */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Detected ID: <code className="font-mono">{id}</code></span>
        <a
          className="text-blue-600 hover:underline"
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noreferrer"
        >
          Open on YouTube ↗
        </a>
      </div>
    </div>
  );
}

function extractYouTubeId(input = "") {
  const s = String(input).trim();

  // Common patterns: watch?v=, youtu.be/, /embed/, /shorts/
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,           // ...watch?v=ID
    /youtu\.be\/([A-Za-z0-9_-]{11})/,      // youtu.be/ID
    /\/embed\/([A-Za-z0-9_-]{11})/,        // /embed/ID
    /\/shorts\/([A-Za-z0-9_-]{11})/,       // /shorts/ID
    /^([A-Za-z0-9_-]{11})$/,               // raw ID
  ];

  for (const rx of patterns) {
    const m = s.match(rx);
    if (m?.[1]) return m[1];
  }
  return null;
}
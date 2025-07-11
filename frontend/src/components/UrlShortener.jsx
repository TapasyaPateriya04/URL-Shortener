import axios from 'axios';
import { useState } from 'react';

function UrlShortener() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:5000/api/shorten', {
        url: originalUrl,
        expiryDate,
      });

      setShortUrl(res.data.shortUrl);
      setError('');
      setCopied(false);
    } catch (err) {
      setShortUrl('');
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-indigo-200 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">🔗 URL Shortener</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="Enter your long URL..."
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-semibold transition"
          >
            ✂️ Shorten URL
          </button>
        </form>

        {shortUrl && (
          <div className="mt-6 bg-green-50 border border-green-300 rounded-lg p-4">
            <p className="text-green-700 font-medium">✅ Your shortened URL:</p>
            <div className="flex items-center justify-between mt-2">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline break-all"
              >
                {shortUrl}
              </a>
              <button
                onClick={handleCopy}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-lg"
              >
                {copied ? '✔️ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-red-600 bg-red-100 border border-red-300 p-3 rounded-lg">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default UrlShortener;

import { useState } from 'react';
import axios from 'axios';

export default function UrlShortener() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShortUrl('');
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/shorten', {
        url: originalUrl,
        expiryDate: expiryDate || null,
      });
      setShortUrl(res.data.shortUrl);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    alert('Short URL copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-md rounded-md w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 text-center">URL Shortener</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition"
          >
            Shorten URL
          </button>
        </form>

        {shortUrl && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
            <p className="text-sm text-gray-600">Shortened URL:</p>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 font-medium break-all hover:underline"
              >
                {shortUrl}
              </a>
              <button
                onClick={handleCopy}
                className="text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 text-center text-red-600 text-sm">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
}

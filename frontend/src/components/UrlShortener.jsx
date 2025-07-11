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
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-6">🔗 Mini URL Shortener</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          placeholder="Enter your long URL"
          className="w-full p-3 border rounded shadow-sm"
          required
        />
        <input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          className="w-full p-3 border rounded shadow-sm"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Shorten URL
        </button>
      </form>

      {shortUrl && (
        <div className="mt-6 p-4 bg-green-100 rounded shadow-sm">
          <p className="text-green-800 font-semibold">✅ Your shortened URL:</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
              {shortUrl}
            </a>
            <button
              onClick={handleCopy}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-sm"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}

export default UrlShortener;

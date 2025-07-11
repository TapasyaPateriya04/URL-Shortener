import { useState } from 'react';
import axios from 'axios';
import '../index.css'; // custom styled below

export default function UrlShortener() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
 


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShortUrl('');

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
    alert('Copied to clipboard!');
  };

  return (
    <div className="custom-container">
      <h2 className="custom-heading">Mini URL Shortener</h2>

      <form onSubmit={handleSubmit} className="custom-form">
        <label>Enter URL:</label>
        <input
          type="url"
          placeholder="https://example.com"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          required
        />

        <label>Expiry Date (optional):</label>
        <input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
        />

        <button type="submit">Shorten</button>
      </form>

      {shortUrl && (
        <div className="short-url-box">
          <p>Shortened URL:</p>
          <a href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a>
          <button onClick={handleCopy}>Copy</button>
          
        </div>
      )}

      {error && <p className="error-text">❌ {error}</p>}
    </div>
  );
}

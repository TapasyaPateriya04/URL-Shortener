import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const STORAGE_KEY = 'snaplink.saved-links.v1';
const THEME_STORAGE_KEY = 'snaplink.theme.v1';
const THEMES = [
  { id: 'garden', name: 'Garden', color: '#d8fc72' },
  { id: 'after-hours', name: 'After hours', color: '#c3a5ff' },
  { id: 'blue-hour', name: 'Blue hour', color: '#8ecbff' },
  { id: 'rose', name: 'Rose', color: '#f5a9bd' },
];

function readSavedLinks() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored)
      ? stored.filter((link) => link && typeof link.shortCode === 'string' && typeof link.accessToken === 'string')
      : [];
  } catch {
    return [];
  }
}

function readTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.some((theme) => theme.id === savedTheme) ? savedTheme : 'garden';
  } catch {
    return 'garden';
  }
}

function localDateTimeValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getLinkStatus(link) {
  return link.expiryDate && new Date(link.expiryDate) <= new Date() ? 'expired' : 'active';
}

function formatDate(date) {
  if (!date) return 'Never';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    external: <><path d="M15 3h6v6" /><path d="m10 14 11-11" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M5.64 9A7 7 0 0 1 17.5 6.5L20 12M4 12l2.5 5.5A7 7 0 0 0 18.36 15" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
    wand: <><path d="m15 4 5 5" /><path d="m13 6 5 5" /><path d="m4 20 11-11" /><path d="m5 5 1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /><path d="m19 15 1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default function UrlShortener() {
  const [links, setLinks] = useState(readSavedLinks);
  const linksRef = useRef(links);
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(links.length > 0);
  const [apiOnline, setApiOnline] = useState(false);
  const [notice, setNotice] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [theme, setTheme] = useState(readTheme);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themePickerRef = useRef(null);
  const themeTriggerRef = useRef(null);

  const commitLinks = useCallback((nextLinks) => {
    linksRef.current = nextLinks;
    setLinks(nextLinks);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLinks));
      return true;
    } catch {
      setNotice({
        type: 'error',
        message: 'Your browser could not save this dashboard. Keep this tab open to manage your new link.',
      });
      return false;
    }
  }, []);

  const refreshLinks = useCallback(async () => {
    const currentLinks = linksRef.current;
    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled(currentLinks.map((link) => axios.get(
        `${API_URL}/api/urls/${encodeURIComponent(link.shortCode)}`,
        { headers: { Authorization: `Bearer ${link.accessToken}` } },
      )));
      const updatedLinks = currentLinks.map((link, index) => {
        const result = results[index];
        return result.status === 'fulfilled'
          ? { ...link, ...result.value.data, accessToken: link.accessToken }
          : link;
      });
      const saved = commitLinks(updatedLinks);
      if (!saved) return;

      const failedCount = results.filter((result) => result.status === 'rejected').length;
      if (failedCount) {
        setNotice({
          type: 'error',
          message: `Could not refresh ${failedCount} saved ${failedCount === 1 ? 'link' : 'links'}. Showing the last saved details.`,
        });
      } else if (currentLinks.length) {
        setNotice({ type: 'success', message: 'Link analytics are up to date.' });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [commitLinks]);

  useEffect(() => {
    let active = true;
    axios.get(`${API_URL}/api/health`)
      .then(() => {
        if (active) setApiOnline(true);
      })
      .catch(() => {
        if (active) setApiOnline(false);
      });

    if (linksRef.current.length) refreshLinks();
    return () => {
      active = false;
    };
  }, [refreshLinks]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(null), 5_000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      setNotice({
        type: 'error',
        message: 'Your theme will last for this visit, but your browser could not save the preference.',
      });
    }
  }, [theme]);

  useEffect(() => {
    if (!isThemeMenuOpen) return undefined;

    const selectedOption = themePickerRef.current?.querySelector('[aria-selected="true"]');
    selectedOption?.focus();

    function closeOnOutsideClick(event) {
      if (!themePickerRef.current?.contains(event.target)) {
        setIsThemeMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [isThemeMenuOpen]);

  function handleThemeMenuKeyDown(event) {
    const options = [...themePickerRef.current.querySelectorAll('[role="option"]')];
    const focusedIndex = options.indexOf(document.activeElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsThemeMenuOpen(false);
      themeTriggerRef.current?.focus();
      return;
    }

    let nextIndex;
    if (event.key === 'ArrowDown') nextIndex = (focusedIndex + 1) % options.length;
    if (event.key === 'ArrowUp') nextIndex = (focusedIndex - 1 + options.length) % options.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = options.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      options[nextIndex].focus();
    }
  }

  const totalClicks = links.reduce((total, link) => total + (Number(link.clickCount) || 0), 0);
  const visibleLinks = links.filter((link) => {
    const status = getLinkStatus(link);
    const matchesFilter = filter === 'all' || status === filter;
    const searchTerm = search.trim().toLowerCase();
    const matchesSearch = !searchTerm
      || link.originalUrl.toLowerCase().includes(searchTerm)
      || link.shortCode.toLowerCase().includes(searchTerm);
    return matchesFilter && matchesSearch;
  }).sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const response = await axios.post(`${API_URL}/api/shorten`, {
        url,
        customCode: customCode.trim() || undefined,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      });
      const createdLink = response.data;
      const saved = commitLinks([createdLink, ...linksRef.current]);
      setUrl('');
      setCustomCode('');
      setExpiryDate('');
      if (saved) setNotice({ type: 'success', message: 'Your new short link is ready.' });
      setApiOnline(true);
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.response?.data?.error || 'We could not reach the link service. Check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy(link) {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopiedCode(link.shortCode);
      window.setTimeout(() => setCopiedCode(''), 1_800);
      setNotice({ type: 'success', message: 'Short link copied to your clipboard.' });
    } catch {
      setNotice({ type: 'error', message: 'Clipboard access was blocked. Select and copy the link instead.' });
    }
  }

  async function handleDelete(link) {
    if (!window.confirm(`Delete ${link.shortUrl}? Anyone using it will no longer be redirected.`)) return;

    try {
      await axios.delete(`${API_URL}/api/urls/${encodeURIComponent(link.shortCode)}`, {
        headers: { Authorization: `Bearer ${link.accessToken}` },
      });
      const saved = commitLinks(linksRef.current.filter((savedLink) => savedLink.shortCode !== link.shortCode));
      if (saved) setNotice({ type: 'success', message: 'Short link deleted.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.response?.data?.error || 'The link could not be deleted. Please try again.',
      });
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Snaplink home">
          <span className="brand-mark"><Icon name="link" size={17} /></span>
          snaplink<span className="wordmark-period">.</span>
        </a>
        <div className="topbar-right">
          <a className="topbar-link" href="#your-links">Your links</a>
          <div className="theme-picker" ref={themePickerRef}>
            <button
              className="theme-picker-trigger"
              type="button"
              ref={themeTriggerRef}
              aria-label={`Color theme: ${THEMES.find((option) => option.id === theme).name}`}
              aria-haspopup="listbox"
              aria-expanded={isThemeMenuOpen}
              aria-controls="theme-options"
              onClick={() => setIsThemeMenuOpen((isOpen) => !isOpen)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setIsThemeMenuOpen(true);
                }
              }}
            >
              <span className="theme-picker-dot" style={{ '--theme-swatch': THEMES.find((option) => option.id === theme).color }} />
              <span>{THEMES.find((option) => option.id === theme).name}</span>
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 10 5 5 5-5" /></svg>
            </button>
            {isThemeMenuOpen && (
              <div
                className="theme-menu"
                id="theme-options"
                role="listbox"
                aria-label="Choose a color theme"
                onKeyDown={handleThemeMenuKeyDown}
              >
                {THEMES.map((option) => (
                  <button
                    className="theme-option"
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={theme === option.id}
                    onClick={() => {
                      setTheme(option.id);
                      setIsThemeMenuOpen(false);
                      themeTriggerRef.current?.focus();
                    }}
                  >
                    <span className="theme-picker-dot" style={{ '--theme-swatch': option.color }} />
                    <span>{option.name}</span>
                    {theme === option.id && <Icon name="check" size={15} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className={`service-status ${apiOnline ? 'is-online' : 'is-offline'}`}>
            <span className="status-dot" />
            {apiOnline ? 'All systems go' : 'Service offline'}
          </span>
        </div>
      </header>

      <main id="top">
        <section className="hero-grid" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> MAKE EVERY LINK COUNT</div>
            <h1 id="hero-title">Long links.<br /><span>Less baggage.</span></h1>
            <p className="hero-description">
              Turn long URLs into short, shareable links. Customize your URLs, set expiration dates, and keep track of clicks — all in one simple place.
            </p>
            <a className="hero-cta" href="#create-link">
              Shorten a link <Icon name="arrow" size={16} />
            </a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-spark spark-one">✳</div>
            <div className="hero-spark spark-two">✳</div>
            <div className="floating-link">
              <div className="floating-link-icon"><Icon name="link" size={19} /></div>
              <div className="floating-link-copy">
                <span>SHORT, SIMPLE, SHAREABLE</span>
                <strong>snaplink.io/my-link</strong>
              </div>
              <span className="floating-link-check"><Icon name="check" size={15} /></span>
            </div>
            <div className="floating-stat">
              <span className="floating-stat-icon"><Icon name="chart" size={16} /></span>
              <span><strong>On the rise</strong><small>clicks at a glance</small></span>
            </div>
            <div className="hero-orbit-dot" />
          </div>
        </section>

        <section className="workspace" id="create-link" aria-label="Create a short link">
          <div className="create-card">
            <div className="section-heading">
              <span className="section-icon"><Icon name="wand" size={17} /></span>
              <div>
                <span className="overline">LINK CREATION</span>
                <h2>Make it a short story.</h2>
                <p className="section-description">Paste a long URL. We&apos;ll make it easier to share.</p>
              </div>
            </div>
            <form className="shorten-form" onSubmit={handleSubmit}>
              <label htmlFor="url-input">Destination URL</label>
              <div className="input-wrap url-input-wrap">
                <Icon name="link" size={17} />
                <input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/your/very/long/url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  autoComplete="url"
                  required
                />
              </div>
              <div className="form-options">
                <div className="option-field">
                  <label htmlFor="alias-input">Custom alias <span>OPTIONAL</span></label>
                  <div className="input-wrap">
                    <span className="alias-prefix">/</span>
                    <input
                      id="alias-input"
                      type="text"
                      placeholder="my-link"
                      value={customCode}
                      onChange={(event) => setCustomCode(event.target.value)}
                      minLength="3"
                      maxLength="30"
                      pattern="[A-Za-z0-9_-]{3,30}"
                      title="Use 3–30 letters, numbers, hyphens, or underscores."
                    />
                  </div>
                </div>
                <div className="option-field">
                  <label htmlFor="expiry-input">Expiration date <span>OPTIONAL</span></label>
                  <div className="input-wrap date-input-wrap">
                    <input
                      id="expiry-input"
                      type="datetime-local"
                      min={localDateTimeValue(new Date(Date.now() + 60_000))}
                      value={expiryDate}
                      onChange={(event) => setExpiryDate(event.target.value)}
                    />
                  </div>
                  <span className="field-hint">Choose when your link expires</span>
                </div>
              </div>
              <button className="create-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><span className="button-spinner" /> Making your link...</> : <>Create short link <Icon name="arrow" size={17} /></>}
              </button>
              <p className="privacy-note">Your links are saved in this browser, so they&apos;re ready when you return.</p>
            </form>
          </div>

          <aside className="stats-card" aria-label="Your link statistics">
            <div className="stats-topline"><span className="overline">STATS SECTION</span><span className="stats-spark">✳</span></div>
            <h2>Small links.<br />Useful stats.</h2>
            <p>See how many links you&apos;ve created and how often they&apos;ve been clicked.</p>
            <div className="stats-divider" />
            <div className="stats-row">
              <div><span>LINKS CREATED</span><strong>{links.length.toLocaleString()}</strong></div>
              <div><span>TOTAL CLICKS</span><strong>{totalClicks.toLocaleString()}</strong></div>
            </div>
            <div className="stats-footnote"><span className="stats-live-dot" /> Statistics update as your links are used and your browser records clicks.</div>
          </aside>
        </section>

        <section className="links-section" id="your-links" aria-labelledby="links-title">
          <div className="links-heading">
            <div>
              <span className="overline">LINK COLLECTION</span>
              <h2 id="links-title">Your links, all in one place.</h2>
            </div>
            <button className="refresh-button" type="button" onClick={refreshLinks} disabled={isRefreshing || links.length === 0}>
              <Icon name="refresh" size={16} />
              <span>{isRefreshing ? 'Updating' : 'Refresh stats'}</span>
            </button>
          </div>

          <div className="links-toolbar">
            <div className="filter-tabs" role="group" aria-label="Filter links">
              {['all', 'active', 'expired'].map((option) => {
                const count = option === 'all'
                  ? links.length
                  : links.filter((link) => getLinkStatus(link) === option).length;
                const label = option === 'all' ? 'All links' : option === 'active' ? 'Active' : 'Expired';
                return (
                <button
                  className={filter === option ? 'filter-tab is-selected' : 'filter-tab'}
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                >
                  {label} · {count}
                </button>
                );
              })}
            </div>
            <label className="search-wrap">
              <span className="sr-only">Search links</span>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
              <input type="search" placeholder="Find a link..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>

          <div className="link-list">
            {visibleLinks.map((link) => {
              const status = getLinkStatus(link);
              const copied = copiedCode === link.shortCode;
              return (
                <article className="link-row" key={link.shortCode}>
                  <div className="link-avatar"><Icon name="link" size={17} /></div>
                  <div className="link-main">
                    <a className="short-link" href={link.shortUrl} target="_blank" rel="noreferrer">
                      {link.shortUrl.replace(/^https?:\/\//, '')}
                      <Icon name="external" size={13} />
                    </a>
                    <span className="original-link" title={link.originalUrl}>{link.originalUrl}</span>
                  </div>
                  <div className="link-meta">
                    <span className={`link-state state-${status}`}><span />{status}</span>
                    <span className="link-date">Added {formatDate(link.createdAt)}</span>
                  </div>
                  <div className="click-count">
                    <strong>{Number(link.clickCount || 0).toLocaleString()}</strong>
                    <span>clicks</span>
                  </div>
                  <div className="link-actions">
                    <button className="icon-button" type="button" onClick={() => handleCopy(link)} aria-label={copied ? 'Copied link' : 'Copy short link'} title={copied ? 'Copied!' : 'Copy link'}>
                      <Icon name={copied ? 'check' : 'copy'} size={17} />
                    </button>
                    <button className="icon-button delete-button" type="button" onClick={() => handleDelete(link)} aria-label="Delete link" title="Delete link">
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
            {visibleLinks.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon"><Icon name={links.length ? 'chart' : 'link'} size={22} /></div>
                <h3>{links.length ? 'No links match that search' : 'Nothing shortened yet.'}</h3>
                <p>{links.length ? 'Try a different word or switch the filter.' : 'Your first short link starts here. Paste a URL above and we’ll take it from there.'}</p>
                {!links.length && <a href="#create-link">Create your first link <Icon name="arrow" size={15} /></a>}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="wordmark footer-brand" href="#top"><span className="brand-mark"><Icon name="link" size={15} /></span>snaplink<span className="wordmark-period">.</span></a>
        <span>Less link. More living.</span>
        <a href="#create-link">Make something shorter <Icon name="arrow" size={13} /></a>
      </footer>

      {notice && (
        <div className={`toast toast-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
          <span className="toast-icon"><Icon name={notice.type === 'error' ? 'external' : 'check'} size={15} /></span>
          {notice.message}
          <button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)}>×</button>
        </div>
      )}
    </div>
  );
}

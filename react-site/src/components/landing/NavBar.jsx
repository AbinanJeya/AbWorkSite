export default function NavBar({ navOpen, navScrolled, onClose, onToggle }) {
  return (
    <nav className={`launch-nav${navScrolled ? ' launch-nav--scrolled' : ''}`} id="nav">
      <div className="launch-nav__inner">
        <a href="#hero" className="launch-nav__brand" onClick={onClose}>
          <div className="launch-nav__brand-mark">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="18"
              height="18"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <span className="launch-nav__brand-name">AbWork</span>
            <span className="launch-nav__brand-meta">Premium fitness companion</span>
          </div>
        </a>

        <div className={`launch-nav__links${navOpen ? ' is-open' : ''}`} id="navLinks">
          <a href="#proof" className="launch-nav__link" onClick={onClose}>
            Why AbWork
          </a>
          <a href="#features" className="launch-nav__link" onClick={onClose}>
            Signature Features
          </a>
          <a href="#showcase" className="launch-nav__link" onClick={onClose}>
            Experience
          </a>
          <a href="#trust" className="launch-nav__link" onClick={onClose}>
            Product Proof
          </a>
          <a href="#download" className="launch-nav__cta" onClick={onClose}>
            Download APK
          </a>
        </div>

        <button
          className={`launch-nav__toggle${navOpen ? ' is-active' : ''}`}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={navOpen ? 'true' : 'false'}
          aria-controls="navLinks"
          onClick={onToggle}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}

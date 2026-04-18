export default function FooterSection() {
  return (
    <footer className="launch-footer">
      <div className="launch-shell launch-footer__inner">
        <div className="launch-footer__brand">
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
            <strong>AbWork</strong>
            <p>Train smarter. Track everything. Keep the whole system moving together.</p>
          </div>
        </div>

        <div className="launch-footer__links">
          <a href="#proof">Why AbWork</a>
          <a href="#features">Features</a>
          <a href="#showcase">Experience</a>
          <a href="#trust">Product Proof</a>
          <a href="#download">Download APK</a>
          <a href="/privacy.html">Privacy</a>
        </div>
      </div>

      <div className="launch-footer__bottom">
        <p>&copy; 2026 AbWork. All rights reserved.</p>
      </div>
    </footer>
  );
}

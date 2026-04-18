export default function FooterSection() {
  const appIconSrc = `${import.meta.env.BASE_URL}branding/app-icon.png`;
  const privacyHref = `${import.meta.env.BASE_URL}privacy.html`;

  return (
    <footer className="launch-footer">
      <div className="launch-shell launch-footer__inner">
        <div className="launch-footer__brand">
          <div className="launch-nav__brand-mark">
            <img src={appIconSrc} alt="AbWork app icon" />
          </div>
          <div>
            <strong>AbWork</strong>
            <p>Workouts, nutrition, movement, and recovery in sync.</p>
          </div>
        </div>

        <div className="launch-footer__links">
          <a href="#proof">Why AbWork</a>
          <a href="#features">Features</a>
          <a href="#showcase">Experience</a>
          <a href="#trust">Product Proof</a>
          <a href="#download">Download APK</a>
          <a href={privacyHref}>Privacy</a>
        </div>
      </div>

      <div className="launch-footer__bottom">
        <p>&copy; 2026 AbWork. All rights reserved.</p>
      </div>
    </footer>
  );
}

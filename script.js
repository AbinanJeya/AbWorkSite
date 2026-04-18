/* ═══════════════════════════════════════════════════════════
   AbWork — Promotional Website Scripts
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ── Scroll-Triggered Animations ─────────────────────────
    const animElements = document.querySelectorAll('.animate-in');

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    };

    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger siblings slightly
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                animObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add stagger delays to feature cards, list items
    const staggerGroups = [
        '.features__grid .feature-card',
        '.ai-section__list .ai-section__list-item',
        '.stats-banner__item'
    ];

    staggerGroups.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, i) => {
            el.dataset.delay = i * 100;
        });
    });

    animElements.forEach(el => animObserver.observe(el));

    // ── Nav Scroll Effect ───────────────────────────────────
    const nav = document.getElementById('nav');

    const handleScroll = () => {
        if (window.scrollY > 50) {
            nav.classList.add('nav--scrolled');
        } else {
            nav.classList.remove('nav--scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // ── Mobile Nav Toggle ───────────────────────────────────
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    // Close mobile nav on link click
    navLinks.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    // ── Smooth Scroll for Anchor Links ──────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ── Counting Animation for Stats ────────────────────────
    const countElements = document.querySelectorAll('[data-count]');

    const countObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count, 10);
                const duration = 2000;
                const start = performance.now();

                const animate = (now) => {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    // Ease-out cubic
                    const eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.round(eased * target);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };

                requestAnimationFrame(animate);
                countObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    countElements.forEach(el => countObserver.observe(el));

    // ── Parallax on Hero Glow ───────────────────────────────
    const heroGlow = document.querySelector('.hero__bg-glow');

    if (heroGlow && window.matchMedia('(min-width: 768px)').matches) {
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 30;
            const y = (e.clientY / window.innerHeight - 0.5) * 30;
            heroGlow.style.transform = `translate(${x}px, ${y}px)`;
        }, { passive: true });
    }

    // ── Optional: Typing Effect on AI Card Message ──────────
    const aiMessage = document.querySelector('.ai-card__message');
    if (aiMessage) {
        const originalHTML = aiMessage.innerHTML;
        const originalText = aiMessage.textContent;
        
        const typeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Reset and type
                    aiMessage.textContent = '';
                    aiMessage.style.borderLeftColor = 'var(--accent)';
                    
                    let i = 0;
                    const speed = 18;
                    
                    const type = () => {
                        if (i < originalText.length) {
                            aiMessage.textContent += originalText.charAt(i);
                            i++;
                            setTimeout(type, speed);
                        } else {
                            // Restore HTML (for bold tags etc.)
                            aiMessage.innerHTML = originalHTML;
                        }
                    };
                    
                    setTimeout(type, 400);
                    typeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        typeObserver.observe(aiMessage);
    }

    // ── Interactive App Logic ───────────────────────────────
    const appUI = document.querySelector('.app-ui--screenshots');
    if (appUI) {
        const navBtns = appUI.querySelectorAll('.app-nav__btn');
        const screens = appUI.querySelectorAll('.app-screen');
        const screenOrder = ['dashboard', 'diary', 'advice', 'workout', 'profile'];
        const autoRotateMs = 3200;
        const manualPauseMs = 7000;
        let activeIndex = 0;
        let rotateTimer = null;
        let resumeTimer = null;

        const setActiveScreen = (screenName) => {
            const targetScreenId = `screen-${screenName}`;
            const nextIndex = screenOrder.indexOf(screenName);

            if (nextIndex >= 0) {
                activeIndex = nextIndex;
            }

            navBtns.forEach(btn => {
                const isActive = btn.dataset.screen === screenName;
                btn.classList.toggle('app-nav__btn--active', isActive);
                btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            screens.forEach(screen => {
                screen.classList.toggle('app-screen--active', screen.id === targetScreenId);
            });
        };

        const startAutoRotate = () => {
            clearInterval(rotateTimer);
            rotateTimer = window.setInterval(() => {
                activeIndex = (activeIndex + 1) % screenOrder.length;
                setActiveScreen(screenOrder[activeIndex]);
            }, autoRotateMs);
        };

        const pauseAndResumeAutoRotate = () => {
            clearInterval(rotateTimer);
            clearTimeout(resumeTimer);
            resumeTimer = window.setTimeout(() => {
                startAutoRotate();
            }, manualPauseMs);
        };

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setActiveScreen(btn.dataset.screen);
                pauseAndResumeAutoRotate();
            });
        });

        setActiveScreen(screenOrder[0]);
        startAutoRotate();
    }
});

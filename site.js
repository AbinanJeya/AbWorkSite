/* AbWork promotional site scripts */

document.addEventListener('DOMContentLoaded', () => {
    const animElements = document.querySelectorAll('.animate-in');

    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            const delay = Number(entry.target.dataset.delay || 0);
            window.setTimeout(() => {
                entry.target.classList.add('visible');
            }, delay);
            animObserver.unobserve(entry.target);
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
    });

    [
        '.features__grid .feature-card',
        '.ai-section__list .ai-section__list-item',
        '.stats-banner__item',
    ].forEach((selector) => {
        document.querySelectorAll(selector).forEach((element, index) => {
            element.dataset.delay = String(index * 100);
        });
    });

    animElements.forEach((element) => animObserver.observe(element));

    const nav = document.getElementById('nav');
    const handleScroll = () => {
        if (!nav) {
            return;
        }

        nav.classList.toggle('nav--scrolled', window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        navLinks.querySelectorAll('.nav__link').forEach((link) => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function handleAnchorClick(event) {
            const href = this.getAttribute('href');
            if (href === '#') {
                return;
            }

            event.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        });
    });

    const countElements = document.querySelectorAll('[data-count]');
    const countObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            const element = entry.target;
            const target = parseInt(element.dataset.count || '0', 10);
            const duration = 2000;
            const start = performance.now();

            const animate = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = String(Math.round(eased * target));

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
            countObserver.unobserve(element);
        });
    }, { threshold: 0.5 });

    countElements.forEach((element) => countObserver.observe(element));

    const heroGlow = document.querySelector('.hero__bg-glow');
    if (heroGlow && window.matchMedia('(min-width: 768px)').matches) {
        window.addEventListener('mousemove', (event) => {
            const x = (event.clientX / window.innerWidth - 0.5) * 30;
            const y = (event.clientY / window.innerHeight - 0.5) * 30;
            heroGlow.style.transform = `translate(${x}px, ${y}px)`;
        }, { passive: true });
    }

    const aiMessage = document.querySelector('.ai-card__message');
    if (aiMessage) {
        const originalHtml = aiMessage.innerHTML;
        const originalText = aiMessage.textContent || '';
        const typeObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                aiMessage.textContent = '';
                aiMessage.style.borderLeftColor = 'var(--accent)';

                let index = 0;
                const type = () => {
                    if (index < originalText.length) {
                        aiMessage.textContent += originalText.charAt(index);
                        index += 1;
                        window.setTimeout(type, 18);
                        return;
                    }

                    aiMessage.innerHTML = originalHtml;
                };

                window.setTimeout(type, 400);
                typeObserver.unobserve(entry.target);
            });
        }, { threshold: 0.5 });

        typeObserver.observe(aiMessage);
    }

    const fitaiPreview = document.querySelector('[data-fitai-preview]');
    if (!fitaiPreview) {
        return;
    }

    import('./hero-preview-controller.js')
        .then(({ createHeroPreviewController }) => {
            const screenOrder = ['dashboard', 'diary', 'advice', 'workout', 'profile'];
            const controller = createHeroPreviewController(screenOrder);
            const screenElements = new Map(
                Array.from(fitaiPreview.querySelectorAll('.fitai-screen')).map((screen) => [screen.dataset.screen, screen])
            );
            const scrollAreas = new Map(
                Array.from(screenElements.entries()).map(([screenId, screen]) => [
                    screenId,
                    screen.querySelector('.fitai-screen__scroll') || screen,
                ])
            );
            const navButtons = Array.from(fitaiPreview.querySelectorAll('.fitai-nav__button'));
            const autoRotateMs = 3200;
            let activeScreenId = controller.getActiveScreen();
            let rotateTimer = null;

            const syncNavState = (screenId) => {
                navButtons.forEach((button) => {
                    const isActive = button.dataset.screenTarget === screenId;
                    button.classList.toggle('fitai-nav__button--active', isActive);
                    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                });
            };

            const renderScreen = (screenId) => {
                const previousScrollArea = scrollAreas.get(activeScreenId);
                if (previousScrollArea) {
                    controller.setScrollPosition(activeScreenId, previousScrollArea.scrollTop);
                }

                activeScreenId = screenId;

                screenElements.forEach((screen, id) => {
                    screen.classList.toggle('fitai-screen--active', id === screenId);
                });

                syncNavState(screenId);

                const nextScrollArea = scrollAreas.get(screenId);
                if (nextScrollArea) {
                    nextScrollArea.scrollTop = controller.getScrollPosition(screenId);
                }
            };

            const stopAutoRotate = () => {
                if (!controller.isAutoRotateEnabled()) {
                    return;
                }

                controller.recordInteraction();
                clearInterval(rotateTimer);
                rotateTimer = null;
            };

            const startAutoRotate = () => {
                if (!controller.isAutoRotateEnabled()) {
                    return;
                }

                clearInterval(rotateTimer);
                rotateTimer = window.setInterval(() => {
                    renderScreen(controller.advance());
                }, autoRotateMs);
            };

            navButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    stopAutoRotate();
                    renderScreen(controller.select(button.dataset.screenTarget));
                });
            });

            scrollAreas.forEach((scrollArea, screenId) => {
                scrollArea.addEventListener('scroll', () => {
                    controller.setScrollPosition(screenId, scrollArea.scrollTop);
                    if (screenId === activeScreenId && scrollArea.scrollTop > 0) {
                        stopAutoRotate();
                    }
                }, { passive: true });
            });

            ['pointerdown', 'touchstart', 'wheel'].forEach((eventName) => {
                fitaiPreview.addEventListener(eventName, (event) => {
                    const target = event.target;
                    if (!(target instanceof Element)) {
                        stopAutoRotate();
                        return;
                    }

                    if (target.closest('.fitai-screen__scroll') || target.closest('.fitai-nav__button')) {
                        stopAutoRotate();
                    }
                }, { passive: true });
            });

            renderScreen(activeScreenId);
            startAutoRotate();
        })
        .catch((error) => {
            console.error('Failed to initialize FitAI preview', error);
        });
});

import { useEffect } from 'react';

export function useLandingEffects(setNavScrolled) {
  useEffect(() => {
    const cleanups = [];

    const animObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const delay = Number(entry.target.dataset.delay || 0);
          const timerId = window.setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);

          cleanups.push(() => window.clearTimeout(timerId));
          animObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    [
      '.features__grid .feature-card',
      '.ai-section__list .ai-section__list-item',
      '.stats-banner__item',
    ].forEach((selector) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        element.dataset.delay = String(index * 100);
      });
    });

    document.querySelectorAll('.animate-in').forEach((element) => {
      animObserver.observe(element);
    });
    cleanups.push(() => animObserver.disconnect());

    const handleScroll = () => {
      setNavScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    cleanups.push(() => window.removeEventListener('scroll', handleScroll));

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      const handleAnchorClick = (event) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') {
          return;
        }

        const target = document.querySelector(href);
        if (!target) {
          return;
        }

        event.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      };

      anchor.addEventListener('click', handleAnchorClick);
      cleanups.push(() => anchor.removeEventListener('click', handleAnchorClick));
    });

    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const element = entry.target;
          const target = Number.parseInt(element.dataset.count || '0', 10);
          const duration = 2000;
          const start = performance.now();

          const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = String(Math.round(eased * target));

            if (progress < 1) {
              window.requestAnimationFrame(animate);
            }
          };

          window.requestAnimationFrame(animate);
          countObserver.unobserve(element);
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('[data-count]').forEach((element) => {
      countObserver.observe(element);
    });
    cleanups.push(() => countObserver.disconnect());

    const heroGlow = document.querySelector('.hero__bg-glow');
    let handleMouseMove = null;

    if (heroGlow && window.matchMedia('(min-width: 768px)').matches) {
      handleMouseMove = (event) => {
        const x = (event.clientX / window.innerWidth - 0.5) * 30;
        const y = (event.clientY / window.innerHeight - 0.5) * 30;
        heroGlow.style.transform = `translate(${x}px, ${y}px)`;
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      cleanups.push(() => window.removeEventListener('mousemove', handleMouseMove));
    }

    const aiMessage = document.querySelector('.ai-card__message');
    if (aiMessage && aiMessage.dataset.typed !== 'true') {
      const originalHtml = aiMessage.innerHTML;
      const originalText = aiMessage.textContent || '';

      const typeObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            aiMessage.dataset.typed = 'true';
            aiMessage.textContent = '';
            aiMessage.style.borderLeftColor = 'var(--accent)';

            let index = 0;
            const timers = [];

            const type = () => {
              if (index < originalText.length) {
                aiMessage.textContent += originalText.charAt(index);
                index += 1;
                const timerId = window.setTimeout(type, 18);
                timers.push(timerId);
                return;
              }

              aiMessage.innerHTML = originalHtml;
            };

            const startTimer = window.setTimeout(type, 400);
            timers.push(startTimer);
            cleanups.push(() => timers.forEach((timerId) => window.clearTimeout(timerId)));
            typeObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.5 }
      );

      typeObserver.observe(aiMessage);
      cleanups.push(() => typeObserver.disconnect());
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [setNavScrolled]);
}

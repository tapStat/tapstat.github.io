// Scroll-linked motion with GSAP ScrollTrigger, on the pages that load it. Transform only; skipped
// entirely for people who ask for reduced motion, and the page is complete without it.
(() => {
  if (!window.gsap || !window.ScrollTrigger || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();

  mm.add('(min-width: 961px)', () => {
    // Hero: the phone drifts up and the pace panel lags behind as the page scrolls away.
    const stage = document.querySelector('.stage');
    if (stage) {
      const st = { trigger: stage, start: 'top top', end: 'bottom top', scrub: 0.6 };
      gsap.to('.stage .phone', { yPercent: -12, rotate: 0, ease: 'none', scrollTrigger: st });
      gsap.to('.stage .pace', { yPercent: 18, ease: 'none', scrollTrigger: st });
    }
    // The two figures slide towards each other as the comparison scrolls through.
    gsap.utils.toArray('.versus').forEach(v => {
      const [a, b] = v.querySelectorAll('b');
      const st = { trigger: v, start: 'top bottom', end: 'bottom 40%', scrub: 0.6 };
      gsap.fromTo(a, { xPercent: -30 }, { xPercent: 0, ease: 'none', scrollTrigger: st });
      gsap.fromTo(b, { xPercent: 30 }, { xPercent: 0, ease: 'none', scrollTrigger: st });
    });
    // Feature phones float a little against their panels.
    gsap.utils.toArray('.feature-media .phone').forEach(p => {
      gsap.fromTo(p, { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: p.parentElement, scrub: 0.8 } });
    });
  });

  // The name in the footer slides home as you reach the end of the page.
  const word = document.querySelector('.foot-word');
  if (word) gsap.fromTo(word, { xPercent: -6 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 } });
})();

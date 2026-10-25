// tapStat website: small progressive enhancements. Every page works without this file.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Header: hide while scrolling down, come back on the way up.
  const top = document.querySelector('.top');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    top.classList.toggle('is-scrolled', y > 8);
    top.classList.toggle('is-hidden', y > 320 && y > lastY && !top.querySelector('.menu[open]'));
    lastY = y;
  }, { passive: true });

  // Entrances: the parts of each section rise in turn as it enters. Things already on screen stay put.
  const parts = [
    '.section-head > *', '.split-head > *', '.claims > *', '.versus > div', '.feature > *', '.story-step',
    '.table-wrap', '.plans > *', '.calc > *', '.faq details', '.cta', '.public > *', '.trust > *',
    '.log article', '.col', '.post-list > a', '.grid > .card', '.prose > h2', '.prose > figure',
    '.prose > .table-wrap', '.prose > .note', '.prose > .steps', '.prose > .faq'
  ].join(',');
  if (!still && 'IntersectionObserver' in window) {
    const els = [...document.querySelectorAll(parts)].filter(el => !el.closest('.hero') && el.getBoundingClientRect().top > innerHeight * 0.92);
    const io = new IntersectionObserver(entries => {
      let i = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.style.setProperty('--d', `${Math.min(i++, 6) * 75}ms`);
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => { el.classList.add('reveal'); io.observe(el); });
  }

  // The "works with" strip becomes a slow marquee.
  const strip = document.querySelector('.strip');
  if (strip && !still) {
    const ul = strip.querySelector('ul');
    [...ul.children].forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); ul.append(c); });
    strip.classList.add('is-marquee');
  }

  // Buttons lean towards the pointer a little.
  if (fine && !still) {
    document.querySelectorAll('.btn').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--bx', `${(e.clientX - r.left - r.width / 2) * 0.18}px`);
        b.style.setProperty('--by', `${(e.clientY - r.top - r.height / 2) * 0.3}px`);
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
    });
  }

  // Article contents: mark the section being read.
  const toc = document.querySelector('.toc');
  if (toc) {
    const links = new Map([...toc.querySelectorAll('a')].map(a => [a.hash.slice(1), a]));
    const seen = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) {
        links.forEach(a => a.classList.remove('is-active'));
        links.get(e.target.id)?.classList.add('is-active');
      }
    }, { rootMargin: '-20% 0px -70% 0px' });
    links.forEach((_, id) => { const h = document.getElementById(id); if (h) seen.observe(h); });
  }

  // The live pace panel: drag through a demo day and watch today's pace against last week.
  const pace = document.querySelector('[data-pace]');
  if (pace) {
    // Share of a day's sales per hour for a typical web store, and a demo day 11% ahead of last week.
    const W = [1.2, .8, .5, .4, .4, .6, 1.2, 2.2, 3.4, 4.3, 4.8, 5.1, 5.4, 5.3, 5.2, 5.3, 5.5, 5.7, 6, 6.8, 7.6, 7.4, 5.6, 3.3];
    const sum = W.reduce((a, b) => a + b);
    const LAST = 4120, AOV = 54;
    const lift = h => 1.11 + 0.06 * Math.sin(h * 0.9);
    const cumLast = [0], cumToday = [0];
    W.forEach((w, h) => { cumLast.push(cumLast[h] + LAST * w / sum); cumToday.push(cumToday[h] + LAST * w / sum * lift(h)); });
    const at = (arr, t) => { const i = Math.floor(t), f = t - i; return i >= 24 ? arr[24] : arr[i] + (arr[i + 1] - arr[i]) * f; };
    const X = t => (t / 24 * 320).toFixed(1), Y = v => (120 - v / (LAST * 1.3) * 112).toFixed(1);
    const line = (arr, from, to, k = 1) => {
      let d = '';
      for (let t = from; t <= to + 1e-6; t += 0.25) d += `${d ? 'L' : 'M'}${X(t)} ${Y(at(arr, t) * k)}`;
      return d;
    };
    const eur = n => '€' + Math.round(n).toLocaleString('en-US');
    const $ = s => pace.querySelector(s);
    const input = $('input');
    $('.l-last').setAttribute('d', line(cumLast, 0, 24));
    const draw = t => {
      t = Math.max(0.25, Math.min(24, t));
      const now = at(cumToday, t), then = at(cumLast, t), k = now / then;
      const today = line(cumToday, 0, t);
      $('.l-today').setAttribute('d', today);
      $('.a-today').setAttribute('d', `${today}L${X(t)} 120L0 120Z`);
      $('.l-proj').setAttribute('d', t < 24 ? `M${X(t)} ${Y(now)}` + line(cumLast, t, 24, k).replace(/^M/, 'L') : '');
      $('.dot').setAttribute('cx', X(t)); $('.dot').setAttribute('cy', Y(now));
      const hh = String(Math.floor(t) % 24).padStart(2, '0') + ':' + String(Math.round((t % 1) * 60) % 60).padStart(2, '0');
      $('[data-now]').textContent = eur(now);
      $('[data-time]').textContent = t >= 24 ? 'end of day' : hh;
      const pct = (k - 1) * 100;
      const delta = $('.pace-delta');
      delta.textContent = `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%`;
      delta.classList.toggle('is-down', pct < 0);
      $('[data-proj]').textContent = eur(LAST * k);
      $('[data-orders]').textContent = Math.round(now / AOV);
      input.setAttribute('aria-valuetext', `${hh}: ${eur(now)} so far, ${pct.toFixed(1)}% against last Tuesday`);
    };
    input.addEventListener('input', () => draw(+input.value));
    draw(+input.value);
    // Play the morning once when the panel comes into view.
    if (!still) {
      const target = +input.value;
      const play = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        play.disconnect();
        const t0 = performance.now(), dur = 1800;
        const step = now => {
          const p = Math.min(1, (now - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
          const t = 0.25 + (target - 0.25) * eased;
          input.value = t; draw(t);
          if (p < 1 && !pace.dataset.touched) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.4 });
      input.addEventListener('pointerdown', () => { pace.dataset.touched = '1'; }, { once: true });
      play.observe(pace);
    }
  }

  // Scroll story: the step in the middle of the screen picks the phone on the sticky stage.
  const story = document.querySelector('.story');
  if (story) {
    const steps = [...story.querySelectorAll('.story-step')];
    const phones = [...story.querySelectorAll('.story-stage .phone')];
    const so = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const i = steps.indexOf(e.target);
      steps.forEach((s, j) => s.classList.toggle('is-active', i === j));
      phones.forEach((p, j) => p.classList.toggle('is-active', i === j));
    }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => so.observe(s));
  }

  // Figures that count up when they come into view: <b data-count="12">12</b>
  if (!still) {
    const counters = document.querySelectorAll('[data-count]');
    const co = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      co.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / 1200);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    counters.forEach(el => co.observe(el));
  }
})();

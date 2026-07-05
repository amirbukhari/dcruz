// D'Cruz Guitars — interactions

(function () {
  "use strict";

  // Sticky header background on scroll
  const header = document.getElementById("siteHeader");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile navigation
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Scroll-reveal
  const reveals = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIO = "IntersectionObserver" in window;

  if (reduceMotion || !hasIO) {
    reveals.forEach((el) => el.classList.add("visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => revealObserver.observe(el));
  }

  // Active-section highlight in the nav (scroll spy)
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (hasIO && sections.length) {
    const setActive = (id) => {
      navLinks.forEach((link) =>
        link.classList.toggle("active", link.getAttribute("href") === "#" + id)
      );
    };
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      // Band across the upper-middle of the viewport, below the fixed header
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((section) => spy.observe(section));
  }

  // ---- Finish switcher: swap the hero guitar + shift the page glow ----
  const heroGuitar = document.getElementById("heroGuitar");
  const heroDisc = document.querySelector(".hero-disc");
  const finishName = document.getElementById("finishName");
  const swatches = Array.from(document.querySelectorAll(".swatch"));

  const glowRGBA = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  };
  const setGlow = (hex) => {
    if (heroDisc) heroDisc.style.background =
      `radial-gradient(circle, ${glowRGBA(hex, 0.28)}, transparent 68%)`;
  };

  // preload finish images so swaps are instant
  swatches.forEach((s) => { const i = new Image(); i.src = s.dataset.img; });

  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      if (swatch.classList.contains("is-active")) return;
      swatches.forEach((s) => {
        s.classList.toggle("is-active", s === swatch);
        s.setAttribute("aria-pressed", String(s === swatch));
      });
      if (finishName) finishName.textContent = swatch.dataset.name;
      setGlow(swatch.dataset.glow);
      if (heroGuitar) {
        heroGuitar.classList.add("swapping");
        const src = swatch.dataset.img;
        const done = () => {
          heroGuitar.src = src;
          heroGuitar.alt = "D’Cruz " + swatch.dataset.name + " partscaster — click to strum";
          requestAnimationFrame(() => heroGuitar.classList.remove("swapping"));
        };
        // wait for the fade-out, then swap
        setTimeout(done, reduceMotion ? 0 : 200);
      }
    });
  });

  // ---- Pointer tilt on the hero guitar (skipped for reduced motion / touch) ----
  const stage = document.getElementById("heroStage");
  if (stage && heroGuitar && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      heroGuitar.style.transform =
        `rotate(3deg) rotateY(${px * 16}deg) rotateX(${-py * 12}deg)`;
    });
    stage.addEventListener("pointerleave", () => {
      heroGuitar.style.transform = "rotate(3deg)";
    });
  }

  // ---- Click to strum: synthesize an open chord with the Web Audio API ----
  let audioCtx = null;
  const strumHint = document.getElementById("strumHint");
  // E major shape (E A E G# B E), frequencies in Hz
  const CHORD = [82.41, 123.47, 164.81, 207.65, 246.94, 329.63];
  const pluck = (ctx, freq, when, dur) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(3200, when);
    filt.frequency.exponentialRampToValueAtTime(900, when + dur);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.22, when + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    osc.start(when); osc.stop(when + dur);
  };
  const strum = () => {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t0 = audioCtx.currentTime;
      CHORD.forEach((f, i) => pluck(audioCtx, f, t0 + i * 0.045, 1.6));
    } catch (e) { /* audio unavailable — ignore */ }
    if (stage && !reduceMotion) {
      if (heroGuitar) heroGuitar.style.transform = ""; // let the keyframe shake show
      stage.classList.remove("strum");
      void stage.offsetWidth; // restart animation
      stage.classList.add("strum");
    }
    if (strumHint) strumHint.textContent = "♪";
  };
  if (stage) {
    stage.addEventListener("click", strum);
    stage.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); strum(); }
    });
    stage.setAttribute("tabindex", "0");
    stage.setAttribute("role", "button");
    stage.setAttribute("aria-label", "Strum the guitar");
  }

  // ---- Count-up hero stats when they scroll into view ----
  const stats = Array.from(document.querySelectorAll(".hero-stats dt"));
  if (stats.length && hasIO && !reduceMotion) {
    const animateCount = (el) => {
      const raw = el.textContent.trim();
      const m = raw.match(/(\D*)(\d+)(.*)/);
      if (!m) return;
      const [, pre, numStr, post] = m;
      const target = parseInt(numStr, 10);
      const dur = 900;
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(target * eased) + post;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const statObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { animateCount(entry.target); statObs.unobserve(entry.target); }
      });
    }, { threshold: 1 });
    stats.forEach((s) => statObs.observe(s));
  }
})();

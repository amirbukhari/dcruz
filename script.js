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
      navLinks.forEach((link) => {
        const on = link.getAttribute("href") === "#" + id;
        link.classList.toggle("active", on);
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
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

  // ---- Finish switcher: swap the hero guitar + tint the ambient glow ----
  const heroGuitar = document.getElementById("heroGuitar");
  const heroDisc = document.querySelector(".hero-disc");
  const finishName = document.getElementById("finishName");
  const swatches = Array.from(document.querySelectorAll(".swatch"));

  const hexToRGBA = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  };
  const setGlow = (hex) => {
    if (heroDisc && hex)
      heroDisc.style.background = `radial-gradient(circle, ${hexToRGBA(hex, 0.18)}, transparent 66%)`;
  };
  const activeSwatch = document.querySelector(".swatch.is-active");
  if (activeSwatch) setGlow(activeSwatch.dataset.glow);

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
        setTimeout(() => {
          heroGuitar.src = src;
          heroGuitar.alt = "D\u2019Cruz " + swatch.dataset.name + " partscaster";
          requestAnimationFrame(() => heroGuitar.classList.remove("swapping"));
        }, reduceMotion ? 0 : 180);
      }
    });
  });

  // ---- Enquiry form: build a prefilled email (static site, no backend) ----
  // TODO: set this to the real D'Cruz inbox.
  const ENQUIRY_EMAIL = "hello@dcruzguitars.com";
  const form = document.getElementById("enquireForm");
  const note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // Use element IDs — `form.name` resolves to the form's name attribute, not the field.
      const name = document.getElementById("ef-name").value.trim();
      const email = document.getElementById("ef-email").value.trim();
      const msg = document.getElementById("ef-msg").value.trim();
      if (!name || !email || !msg) {
        if (note) note.textContent = "Please fill in your name, email, and what you\u2019re after.";
        return;
      }
      const subject = encodeURIComponent(`Build enquiry from ${name}`);
      const body = encodeURIComponent(`${msg}\n\n\u2014 ${name}\n${email}`);
      window.location.href = `mailto:${ENQUIRY_EMAIL}?subject=${subject}&body=${body}`;
      if (note) note.textContent = "Opening your email app\u2026 if nothing happens, email " + ENQUIRY_EMAIL;
    });
  }

  // ---- Catalogue filter ----
  const filterBtns = Array.from(document.querySelectorAll(".filter-btn"));
  const catCards = Array.from(document.querySelectorAll("#guitars .card"));
  if (filterBtns.length && catCards.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.dataset.filter;
        filterBtns.forEach((b) => {
          const on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", String(on));
        });
        catCards.forEach((card) => {
          const show = f === "all" || card.dataset.cat === f;
          card.hidden = !show;
        });
      });
    });
  }

  // ---- Keyboard arrow-key nav for the finish swatches ----
  if (swatches.length) {
    swatches.forEach((sw, i) => {
      sw.addEventListener("keydown", (e) => {
        let j = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % swatches.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + swatches.length) % swatches.length;
        if (j !== null) {
          e.preventDefault();
          swatches[j].focus();
          swatches[j].click();
        }
      });
    });
  }

  // ---- Quick-view lightbox ----
  const lightbox = document.getElementById("lightbox");
  if (lightbox && catCards.length) {
    const lbImg = document.getElementById("lbImg");
    const lbName = document.getElementById("lbName");
    const lbPrice = document.getElementById("lbPrice");
    const lbTag = document.getElementById("lbTag");
    const lbGlow = document.getElementById("lbGlow");
    const lbClose = lightbox.querySelector(".lightbox-close");
    let lastFocus = null;

    const openLB = (card) => {
      const img = card.querySelector(".card-guitar");
      const name = card.querySelector("h3");
      const price = card.querySelector(".price");
      const tag = card.querySelector(".tag");
      const cv = card.querySelector(".card-visual");
      if (img) { lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; }
      lbName.textContent = name ? name.textContent : "";
      lbPrice.textContent = price ? price.textContent : "";
      lbTag.textContent = tag ? tag.textContent : "";
      lbTag.hidden = !tag;
      lbGlow.style.setProperty("--cardglow", (cv && cv.style.getPropertyValue("--cardglow")) || "#c89b5a");
      lastFocus = document.activeElement;
      lightbox.hidden = false;
      document.body.classList.add("lb-open");
      lbClose.focus();
    };
    const closeLB = () => {
      lightbox.hidden = true;
      document.body.classList.remove("lb-open");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    lightbox.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeLB));
    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") { closeLB(); return; }
      if (e.key === "Tab") {
        const f = lightbox.querySelectorAll("button, a[href]");
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // add a zoom button over each card image
    catCards.forEach((card) => {
      const cv = card.querySelector(".card-visual");
      if (!cv) return;
      const name = card.querySelector("h3");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card-zoom";
      btn.setAttribute("aria-label", "View " + (name ? name.textContent : "guitar") + " larger");
      btn.innerHTML = '<span>View<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></span>';
      btn.addEventListener("click", () => openLB(card));
      cv.appendChild(btn);
    });
  }
})();

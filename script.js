// D'Cruz Guitars — interactions

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsInert = "inert" in HTMLElement.prototype;

  // Sticky header, scroll progress, back-to-top — one rAF-throttled handler
  const header = document.getElementById("siteHeader");
  const mainEl = document.querySelector("main");
  const progressBar = document.getElementById("progressBar");
  const toTop = document.getElementById("toTop");
  const footer = document.querySelector(".site-footer");
  let footerInView = false;

  let scrollTick = false;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 24);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    }
    if (toTop) {
      toTop.classList.toggle("visible", y > window.innerHeight * 1.5 && !footerInView);
    }
    scrollTick = false;
  };
  const requestScroll = () => {
    if (!scrollTick) {
      scrollTick = true;
      requestAnimationFrame(onScroll);
    }
  };
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", () => {
      // Long smooth scrolls feel sluggish — jump instantly from deep in the page.
      const behavior = reduceMotion || window.scrollY > 4000 ? "auto" : "smooth";
      window.scrollTo({ top: 0, behavior });
      const brand = document.querySelector(".brand");
      if (brand) brand.focus({ preventScroll: true });
    });
  }

  if (footer && "IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      footerInView = entries[0].isIntersecting;
      requestScroll();
    }).observe(footer);
  }

  // Pause ambient animations (marquee, hero float) while they're off-screen
  if ("IntersectionObserver" in window) {
    const animRoots = [document.querySelector(".strip"), document.querySelector(".hero-visual")].filter(Boolean);
    if (animRoots.length) {
      const animIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle("in-view", entry.isIntersecting));
      });
      animRoots.forEach((el) => animIO.observe(el));
    }
  }

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile navigation
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  const setMenu = (open) => {
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    // Keep assistive tech inside the open menu (scroll is locked anyway)
    if (supportsInert && mainEl && footer) {
      mainEl.inert = open;
      footer.inert = open;
    }
  };
  toggle.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (!menu.classList.contains("open")) return;
    if (e.key === "Escape") {
      setMenu(false);
      toggle.focus();
      return;
    }
    if (e.key === "Tab") {
      // Trap focus in the open menu: toggle button + menu links
      const focusables = [toggle].concat(Array.from(menu.querySelectorAll("a[href]")));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener("click", (e) => {
    if (menu.classList.contains("open") && !e.target.closest(".nav")) setMenu(false);
  });
  const desktopQuery = window.matchMedia("(min-width: 821px)");
  const onDesktop = (e) => { if (e.matches) setMenu(false); };
  if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", onDesktop);
  else desktopQuery.addListener(onDesktop);

  // Move focus to in-page anchor targets for keyboard and screen-reader users
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  });

  // Scrollspy — highlight the section currently in view
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const spySections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  // Sections without a nav entry clear the highlight instead of leaving it stale.
  const clearSections = ["top", "promise", "partners", "enquire"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ("IntersectionObserver" in window && spySections.length) {
    const setActive = (id) => {
      navLinks.forEach((link) => {
        const on = id !== null && link.getAttribute("href") === "#" + id;
        link.classList.toggle("active", on);
        if (on) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setActive(clearSections.includes(entry.target) ? null : entry.target.id);
        });
      },
      // Band across the upper-middle of the viewport, below the fixed header
      { rootMargin: "-45% 0px -50% 0px" }
    );
    spySections.concat(clearSections).forEach((section) => spy.observe(section));
  }

  // Scroll-reveal
  const reveals = document.querySelectorAll(".reveal");
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

  // ---- Build-strip marquee: pause control + viewport-aware length ----
  const stripTrack = document.querySelector(".strip-track");
  const stripPause = document.getElementById("stripPause");
  if (stripTrack && !reduceMotion) {
    // The keyframe loops on translateX(-50%), so copies must be appended in
    // pairs to keep the halfway point seamless.
    const firstGroup = stripTrack.querySelector(".strip-inner");
    const ensureCopies = () => {
      if (!firstGroup) return;
      let guard = 0;
      while (
        stripTrack.scrollWidth < window.innerWidth * 2.2 &&
        stripTrack.children.length < 12 &&
        guard < 4
      ) {
        for (let i = 0; i < 2; i++) {
          const clone = firstGroup.cloneNode(true);
          clone.classList.add("strip-copy");
          clone.setAttribute("aria-hidden", "true");
          stripTrack.appendChild(clone);
        }
        guard++;
      }
    };
    ensureCopies();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(ensureCopies, 250);
    }, { passive: true });
  }
  if (stripPause) {
    stripPause.addEventListener("click", () => {
      const paused = stripTrack.classList.toggle("paused");
      stripPause.setAttribute("aria-pressed", String(paused));
      stripPause.setAttribute("aria-label", paused ? "Resume scrolling ticker" : "Pause scrolling ticker");
    });
  }

  // ---- Finish switcher: swap the hero guitar + tint the ambient glow ----
  const heroGuitar = document.getElementById("heroGuitar");
  const heroDisc = document.querySelector(".hero-disc");
  const finishName = document.getElementById("finishName");
  const finishView = document.getElementById("finishView");
  const swatches = Array.from(document.querySelectorAll(".swatch"));

  const hexToRGBA = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  };
  // Single source of truth: the CSS var the stylesheet already reads.
  const setGlow = (hex) => {
    if (heroDisc && hex) heroDisc.style.setProperty("--hero-glow", hexToRGBA(hex, 0.18));
  };
  const activeSwatch = document.querySelector(".swatch.is-active");
  if (activeSwatch) setGlow(activeSwatch.dataset.glow);

  // Preload the alternate finishes once the browser is idle — not during
  // initial page load, where they compete with critical resources.
  const preloadFinishes = () => {
    swatches.forEach((s) => { const i = new Image(); i.src = s.dataset.img; });
  };
  if ("requestIdleCallback" in window) requestIdleCallback(preloadFinishes, { timeout: 4000 });
  else setTimeout(preloadFinishes, 2500);

  let swapTimer;
  const selectSwatch = (swatch) => {
    if (swatch.classList.contains("is-active")) return;
    swatches.forEach((s) => {
      const on = s === swatch;
      s.classList.toggle("is-active", on);
      s.setAttribute("aria-checked", String(on));
      s.tabIndex = on ? 0 : -1;
    });
    if (finishName) finishName.textContent = swatch.dataset.name;
    if (finishView && swatch.dataset.target) finishView.href = swatch.dataset.target;
    setGlow(swatch.dataset.glow);
    if (!heroGuitar) return;

    heroGuitar.classList.add("swapping");
    // Debounced: arrow-key traversal shouldn't fire a decode per step
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      const src = swatch.dataset.img;
      const alt = "Electric guitar in " + swatch.dataset.name + " finish";
      const loader = new Image();
      loader.src = src;
      // Wait for both the fade-out AND the new image to be ready, so the
      // stage never shows a blank gap on slow connections.
      const fade = new Promise((r) => setTimeout(r, reduceMotion ? 0 : 160));
      const ready = loader.decode ? loader.decode().catch(() => {}) : Promise.resolve();
      Promise.all([fade, ready]).then(() => {
        if (!swatch.classList.contains("is-active")) return; // superseded by a later pick
        heroGuitar.src = src;
        heroGuitar.alt = alt;
        requestAnimationFrame(() => heroGuitar.classList.remove("swapping"));
      });
    }, 120);
  };

  // Shared roving-tabindex arrow-key navigation for radio-style button groups
  const radioKeys = (buttons, activate) => {
    buttons.forEach((btn, i) => {
      btn.addEventListener("keydown", (e) => {
        let j = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % buttons.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + buttons.length) % buttons.length;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = buttons.length - 1;
        if (j !== null) {
          e.preventDefault();
          buttons[j].focus();
          activate(buttons[j]);
        }
      });
    });
  };

  swatches.forEach((swatch) => swatch.addEventListener("click", () => selectSwatch(swatch)));
  radioKeys(swatches, selectSwatch);

  // ---- Enquiry form: prefill from cards, validate per field, mailto handoff ----
  // Single source: the visible "prefer your own mail app" link.
  // TODO: hello@dcruzguitars.com is a placeholder — set the real inbox in the
  // form-alt link, the footer link, and the JSON-LD block.
  const altLink = document.querySelector(".form-alt a[href^='mailto:']");
  const ENQUIRY_EMAIL = altLink ? altLink.href.replace(/^mailto:/, "").split("?")[0] : "hello@dcruzguitars.com";
  const form = document.getElementById("enquireForm");
  const note = document.getElementById("formNote");
  const msgField = document.getElementById("ef-msg");
  const msgCount = document.getElementById("msgCount");
  const submitBtn = document.getElementById("efSubmit");

  // Live regions get their roles after first paint so their initial
  // content isn't announced as an update on page load.
  const filterCount = document.getElementById("filterCount");
  requestAnimationFrame(() => {
    if (note) { note.setAttribute("role", "status"); note.setAttribute("aria-live", "polite"); }
    if (filterCount) { filterCount.setAttribute("role", "status"); filterCount.setAttribute("aria-live", "polite"); }
  });

  // "Enquire" links carry the model they came from — prefill the message.
  const PREFILL = /^Hi — I’m interested in the .+\.\s*$/;
  document.querySelectorAll("[data-model]").forEach((link) => {
    link.addEventListener("click", () => {
      if (!msgField || !link.dataset.model) return;
      const value = msgField.value.trim();
      // Fill when empty, or replace an untouched prefill from another model
      if (!value || PREFILL.test(msgField.value)) {
        msgField.value = "Hi — I’m interested in the " + link.dataset.model + ". ";
        msgField.dispatchEvent(new Event("input"));
      }
    });
  });

  if (form) {
    const fields = [
      { el: document.getElementById("ef-name"), err: document.getElementById("ef-name-err") },
      { el: document.getElementById("ef-email"), err: document.getElementById("ef-email-err") },
      { el: msgField, err: document.getElementById("ef-msg-err") },
    ];
    const validateField = (f) => {
      const filled = f.el.value.trim().length > 0;
      const ok = filled && (f.el.type !== "email" || f.el.validity.valid);
      f.err.hidden = ok;
      f.el.setAttribute("aria-invalid", String(!ok));
      return ok;
    };
    fields.forEach((f) => {
      f.el.addEventListener("blur", () => { if (f.el.value.trim()) validateField(f); });
      f.el.addEventListener("input", () => {
        if (!f.err.hidden) validateField(f);
        if (note) note.classList.remove("error", "success");
        if (submitBtn && submitBtn.disabled) submitBtn.disabled = false;
      });
    });

    if (msgField && msgCount) {
      const max = msgField.getAttribute("maxlength") || "1200";
      msgField.addEventListener("input", () => {
        const len = msgField.value.length;
        msgCount.hidden = len === 0;
        msgCount.textContent = len + " / " + max;
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const results = fields.map(validateField);
      const firstInvalid = fields[results.indexOf(false)];
      if (firstInvalid) {
        if (note) {
          note.textContent = "Almost there — fix the highlighted field" + (results.filter((r) => !r).length > 1 ? "s" : "") + " above.";
          note.classList.add("error");
          note.classList.remove("success");
        }
        firstInvalid.el.focus();
        return;
      }
      const name = fields[0].el.value.trim();
      const email = fields[1].el.value.trim();
      const msg = fields[2].el.value.trim();
      const subject = encodeURIComponent(`Build enquiry from ${name}`);
      const body = encodeURIComponent(`${msg}\n\n— ${name}\n${email}`);
      window.location.href = `mailto:${ENQUIRY_EMAIL}?subject=${subject}&body=${body}`;
      if (note) {
        note.textContent = "Opening your email app… if nothing happens, write to " + ENQUIRY_EMAIL + " directly.";
        note.classList.add("success");
        note.classList.remove("error");
      }
      // Guard against double drafts; editing any field re-enables
      if (submitBtn) submitBtn.disabled = true;
    });
  }

  // ---- Catalogue filter (feature included, count announced, URL synced) ----
  const filterBtns = Array.from(document.querySelectorAll(".filter-btn"));
  const catCards = Array.from(document.querySelectorAll("#guitars .card"));
  const feature = document.querySelector("#guitars .feature");

  const applyFilter = (f, updateURL) => {
    filterBtns.forEach((b) => {
      const on = b.dataset.filter === f;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    let shown = 0;
    catCards.forEach((card) => {
      const show = f === "all" || card.dataset.cat === f;
      card.hidden = !show;
      if (show) shown++;
    });
    if (feature) {
      const showFeature = f === "all" || feature.dataset.cat === f;
      feature.hidden = !showFeature;
      if (showFeature) shown++;
    }
    if (filterCount) {
      const total = catCards.length + (feature ? 1 : 0);
      filterCount.textContent = shown === total ? "Showing all " + total + " guitars" : "Showing " + shown + " of " + total + " guitars";
    }
    if (updateURL && "replaceState" in history) {
      const url = f === "all" ? location.pathname + location.hash : location.pathname + "?filter=" + f + location.hash;
      history.replaceState(history.state, "", url);
    }
  };

  if (filterBtns.length && catCards.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => applyFilter(btn.dataset.filter, true));
    });
    radioKeys(filterBtns, (btn) => applyFilter(btn.dataset.filter, true));
    // Restore a shared/bookmarked filter
    const param = new URLSearchParams(location.search).get("filter");
    if (param && filterBtns.some((b) => b.dataset.filter === param)) applyFilter(param, false);
    else applyFilter("all", false);
  }

  // ---- Quick-view lightbox ----
  const lightbox = document.getElementById("lightbox");
  if (lightbox && catCards.length) {
    const lbImg = document.getElementById("lbImg");
    const lbName = document.getElementById("lbName");
    const lbPrice = document.getElementById("lbPrice");
    const lbTag = document.getElementById("lbTag");
    const lbGlow = document.getElementById("lbGlow");
    const lbDesc = document.getElementById("lbDesc");
    const lbSpecs = document.getElementById("lbSpecs");
    const lbEnquire = document.getElementById("lbEnquire");
    const lbClose = lightbox.querySelector(".lightbox-close");
    const lbPrev = lightbox.querySelector(".lightbox-prev");
    const lbNext = lightbox.querySelector(".lightbox-next");
    let lastFocus = null;
    let current = null;

    const items = feature ? [feature].concat(catCards) : catCards;
    const visibleItems = () => items.filter((el) => !el.hidden);

    const setLbImage = (src, alt, instant) => {
      if (instant) {
        lbImg.src = src;
        lbImg.alt = alt;
        return;
      }
      lbImg.classList.add("lb-swapping");
      const loader = new Image();
      loader.src = src;
      const ready = loader.decode ? loader.decode().catch(() => {}) : Promise.resolve();
      const fade = new Promise((r) => setTimeout(r, reduceMotion ? 0 : 140));
      Promise.all([ready, fade]).then(() => {
        lbImg.src = src;
        lbImg.alt = alt;
        requestAnimationFrame(() => lbImg.classList.remove("lb-swapping"));
      });
    };

    const fillLB = (item, instant) => {
      current = item;
      const img = item.querySelector("img");
      const name = item.querySelector("h3");
      const price = item.querySelector(".price");
      const tag = item.querySelector(".tag");
      const visual = item.querySelector(".card-visual, .feature-media");
      const desc = item.querySelector(".card-body > p, .feature-body > p");
      const specs = item.querySelector(".specs");
      // Full-resolution source for the large view (srcset may have chosen small)
      if (img) setLbImage(img.dataset.full || img.currentSrc || img.src, img.alt, instant);
      lbName.textContent = name ? name.textContent : "";
      lbPrice.textContent = price ? price.textContent : "";
      lbTag.textContent = tag ? tag.textContent : "";
      lbTag.hidden = !tag;
      lbDesc.textContent = desc ? desc.textContent : "";
      lbSpecs.innerHTML = specs ? specs.innerHTML : "";
      lbGlow.style.setProperty("--cardglow", (visual && visual.style.getPropertyValue("--cardglow")) || "#c89b5a");
      const enquireLink = item.querySelector("[data-model]");
      if (lbEnquire && enquireLink) lbEnquire.dataset.model = enquireLink.dataset.model;
      const many = visibleItems().length > 1;
      lbPrev.hidden = !many;
      lbNext.hidden = !many;
    };

    const setPageInert = (on) => {
      if (!supportsInert) return;
      [header, mainEl, footer, toTop].forEach((el) => { if (el) el.inert = on; });
    };

    const openLB = (item) => {
      fillLB(item, true);
      lastFocus = document.activeElement;
      lightbox.hidden = false;
      document.body.classList.add("lb-open");
      setPageInert(true);
      lbClose.focus();
      // Back button (esp. Android) should close the modal, not leave the site
      if (history.pushState && !(history.state && history.state.dcruzLb)) {
        history.pushState({ dcruzLb: true }, "");
      }
    };
    const hideLB = (restoreFocus) => {
      lightbox.hidden = true;
      document.body.classList.remove("lb-open");
      setPageInert(false);
      if (restoreFocus && lastFocus && lastFocus.focus) lastFocus.focus();
    };
    let restoreOnPop = true;
    window.addEventListener("popstate", () => {
      if (!lightbox.hidden) {
        hideLB(restoreOnPop);
        restoreOnPop = true;
      }
    });
    const closeLB = (restoreFocus = true) => {
      if (history.state && history.state.dcruzLb) {
        restoreOnPop = restoreFocus;
        history.back(); // popstate handler hides the lightbox
      } else {
        hideLB(restoreFocus);
      }
    };
    const step = (dir) => {
      const list = visibleItems();
      if (!list.length) return;
      const idx = Math.max(0, list.indexOf(current));
      fillLB(list[(idx + dir + list.length) % list.length], false);
    };

    lightbox.querySelectorAll("[data-close]").forEach((el) =>
      el.addEventListener("click", () => {
        // The Enquire CTA navigates to the form — restoring focus to the
        // originating card (or navigating history back) would fight that jump.
        if (el.tagName === "A") {
          if (history.state && history.state.dcruzLb) history.replaceState(null, "");
          hideLB(false);
        } else {
          closeLB(true);
        }
      })
    );
    lbPrev.addEventListener("click", () => step(-1));
    lbNext.addEventListener("click", () => step(1));

    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") { closeLB(); return; }
      if (e.key === "ArrowLeft") { step(-1); return; }
      if (e.key === "ArrowRight") { step(1); return; }
      if (e.key === "Tab") {
        const f = Array.from(lightbox.querySelectorAll("button, a[href]")).filter((el) => !el.hidden);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // add a zoom button over each visual (cards and the flagship feature)
    items.forEach((item) => {
      const visual = item.querySelector(".card-visual, .feature-media");
      if (!visual) return;
      const name = item.querySelector("h3");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card-zoom";
      btn.setAttribute("aria-label", "View " + (name ? name.textContent : "guitar") + " larger");
      btn.innerHTML = '<span>View<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></span>';
      btn.addEventListener("click", () => openLB(item));
      visual.appendChild(btn);
    });
  }
})();

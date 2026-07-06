// D'Cruz Guitars — interactions
//
// Organized as init functions, called in order at the bottom:
//   initChrome        sticky header, scroll progress, back-to-top
//   initMenu          mobile navigation (trap, scrim, inert)
//   initAnchors       in-page anchor focus + pre-jump hooks
//   initSpy           scrollspy
//   initReveal        scroll-reveal animations
//   initMarquee       build-strip ticker
//   initFilter        catalogue filter (returns applyFilter for others)
//   initFinishPicker  hero guitar switcher
//   initForm          enquiry form validation + mailto handoff
//   initLightbox      quick-view dialog

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsInert = "inert" in HTMLElement.prototype;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const header = $("#siteHeader");
  const mainEl = $("main");
  const footer = $(".site-footer");
  const toTop = $("#toTop");

  // Later modules can prepare a target (e.g. clear a filter) before an anchor jump lands.
  const anchorJumpHooks = [];

  // Shared roving-tabindex arrow-key navigation for radio-style button groups
  function radioKeys(buttons, activate) {
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
  }

  /* ---------- chrome: sticky header, progress, back-to-top ---------- */

  let footerInView = false;

  function initChrome() {
    const progressBar = $("#progressBar");
    let tick = false;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle("scrolled", y > 24);
      if (progressBar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
      }
      if (toTop) toTop.classList.toggle("visible", y > window.innerHeight * 1.5 && !footerInView);
      tick = false;
    };
    const request = () => {
      if (!tick) { tick = true; requestAnimationFrame(onScroll); }
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", () => {
        // Long smooth scrolls feel sluggish — jump instantly from deep in the page.
        const behavior = reduceMotion || window.scrollY > 4000 ? "auto" : "smooth";
        window.scrollTo({ top: 0, behavior });
        const brand = $(".brand");
        if (brand) brand.focus({ preventScroll: true });
      });
    }
    if (footer && "IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        footerInView = entries[0].isIntersecting;
        request();
      }).observe(footer);
    }

    // Pause ambient animations (marquee, hero float) while off-screen
    if ("IntersectionObserver" in window) {
      const roots = [$(".strip"), $(".hero-visual")].filter(Boolean);
      if (roots.length) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => e.target.classList.toggle("in-view", e.isIntersecting));
        });
        roots.forEach((el) => io.observe(el));
      }
    }

    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------- mobile navigation ---------- */

  function initMenu() {
    const toggle = $("#navToggle");
    const menu = $("#navMenu");
    const setMenu = (open) => {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
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
        // Trap focus in the open menu: brand, toggle, then menu links
        const focusables = [$(".brand"), toggle].concat($$("a[href]", menu)).filter(Boolean);
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
  }

  /* ---------- in-page anchors ---------- */

  function initAnchors() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        anchorJumpHooks.forEach((hook) => hook(target));
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ---------- scrollspy ---------- */

  function initSpy() {
    const navLinks = $$(".nav-links a");
    const spySections = navLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    // Sections without a nav entry clear the highlight instead of leaving it stale.
    const clearSections = ["top", "promise", "partners", "enquire"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!("IntersectionObserver" in window) || !spySections.length) return;

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

  /* ---------- scroll-reveal ---------- */

  function initReveal() {
    const reveals = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- build-strip marquee ---------- */

  function initMarquee() {
    const strip = $(".strip");
    const track = $(".strip-track");
    const pause = $("#stripPause");
    if (!track) return;

    if (!reduceMotion) {
      const firstGroup = $(".strip-inner", track);
      const PX_PER_SECOND = 90;
      const sync = () => {
        if (!firstGroup) return;
        let changed = false;
        let guard = 0;
        // Copies go in pairs: the keyframe loops on translateX(-50%).
        while (track.scrollWidth < window.innerWidth * 2.2 && track.children.length < 12 && guard < 4) {
          for (let i = 0; i < 2; i++) {
            const clone = firstGroup.cloneNode(true);
            clone.classList.add("strip-copy");
            clone.setAttribute("aria-hidden", "true");
            track.appendChild(clone);
          }
          changed = true;
          guard++;
        }
        // Constant speed regardless of track width — and restart cleanly if
        // the geometry changed, since resizing mid-flight visibly jumps.
        const duration = track.scrollWidth / 2 / PX_PER_SECOND;
        const durationStr = duration.toFixed(1) + "s";
        if (changed || track.style.animationDuration !== durationStr) {
          track.style.animation = "none";
          void track.offsetWidth; // reflow to reset the animation
          track.style.animation = "";
          track.style.animationDuration = durationStr;
        }
      };
      sync();
      let timer;
      window.addEventListener("resize", () => {
        clearTimeout(timer);
        timer = setTimeout(sync, 250);
      }, { passive: true });
    }
    if (pause && strip) {
      pause.addEventListener("click", () => {
        const paused = track.classList.toggle("paused");
        pause.setAttribute("aria-pressed", String(paused));
        pause.setAttribute("aria-label", paused ? "Resume scrolling ticker" : "Pause scrolling ticker");
      });
    }
  }

  /* ---------- catalogue filter ---------- */

  function initFilter() {
    const filterBtns = $$(".filter-btn");
    const catCards = $$("#guitars .card");
    const feature = $("#guitars .feature");
    const filterCount = $("#filterCount");
    const baseTitle = document.title;
    if (!filterBtns.length || !catCards.length) return { applyFilter: () => {} };

    const countFor = (f) =>
      f === "all"
        ? catCards.length + (feature ? 1 : 0)
        : catCards.filter((c) => c.dataset.cat === f).length + (feature && feature.dataset.cat === f ? 1 : 0);

    // Show counts up front so a one-item view ("Vintage") isn't a surprise
    filterBtns.forEach((b) => { b.textContent += " (" + countFor(b.dataset.filter) + ")"; });

    let urlTimer;
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
      const TITLES = { partscaster: "Partscasters", custom: "Custom builds", vintage: "Vintage" };
      document.title = f === "all" || !TITLES[f] ? baseTitle : TITLES[f] + " — D'Cruz Guitars";
      if (updateURL && "replaceState" in history) {
        // Debounced: arrow-key cycling shouldn't write history state per keypress
        clearTimeout(urlTimer);
        urlTimer = setTimeout(() => {
          const url = f === "all" ? location.pathname + location.hash : location.pathname + "?filter=" + f + location.hash;
          history.replaceState(history.state, "", url);
        }, 300);
      }
    };

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => applyFilter(btn.dataset.filter, true));
    });
    radioKeys(filterBtns, (btn) => applyFilter(btn.dataset.filter, true));

    // Live-region roles attach after first paint so restoring a shared
    // filter below doesn't get announced as an update on page load.
    requestAnimationFrame(() => {
      if (filterCount) {
        filterCount.setAttribute("role", "status");
        filterCount.setAttribute("aria-live", "polite");
      }
    });

    // Restore a shared/bookmarked filter, and bring the catalogue into view
    const param = new URLSearchParams(location.search).get("filter");
    if (param && filterBtns.some((b) => b.dataset.filter === param)) {
      applyFilter(param, false);
      if (!location.hash) {
        const guitars = $("#guitars");
        if (guitars) {
          try { guitars.scrollIntoView({ behavior: "instant", block: "start" }); }
          catch (err) { guitars.scrollIntoView(true); }
        }
      }
    } else {
      applyFilter("all", false);
    }

    // Anchor jumps (finish picker, deep links) may target a filter-hidden
    // card — clear the filter so the jump actually lands somewhere.
    anchorJumpHooks.push((target) => {
      if (target.hidden && target.dataset && target.dataset.cat) applyFilter("all", true);
    });

    return { applyFilter };
  }

  /* ---------- finish picker ---------- */

  function initFinishPicker() {
    const heroGuitar = $("#heroGuitar");
    const heroDisc = $(".hero-disc");
    const finishName = $("#finishName");
    const finishView = $("#finishView");
    const swatches = $$(".swatch");
    if (!swatches.length) return;

    const hexToRGBA = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    };
    // Single source of truth: the CSS var the stylesheet already reads.
    const setGlow = (hex) => {
      if (heroDisc && hex) heroDisc.style.setProperty("--hero-glow", hexToRGBA(hex, 0.18));
    };
    const active = $(".swatch.is-active");
    if (active) setGlow(active.dataset.glow);

    // Preload alternate finishes once the browser is idle — not during
    // initial page load, where they compete with critical resources.
    const preload = () => swatches.forEach((s) => { const i = new Image(); i.src = s.dataset.img; });
    if ("requestIdleCallback" in window) requestIdleCallback(preload, { timeout: 4000 });
    else setTimeout(preload, 2500);

    let swapTimer;
    const select = (swatch) => {
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
        // Wait for both the fade-out AND the new image, so the stage never
        // shows a blank gap on slow connections.
        const fade = new Promise((r) => setTimeout(r, reduceMotion ? 0 : 160));
        const ready = loader.decode ? loader.decode().catch(() => {}) : Promise.resolve();
        Promise.all([fade, ready]).then(() => {
          if (!swatch.classList.contains("is-active")) return; // superseded
          heroGuitar.src = src;
          heroGuitar.alt = alt;
          requestAnimationFrame(() => heroGuitar.classList.remove("swapping"));
        });
      }, 120);
    };

    swatches.forEach((s) => s.addEventListener("click", () => select(s)));
    radioKeys(swatches, select);
  }

  /* ---------- enquiry form ---------- */

  function initForm() {
    // Single source: the visible "prefer your own mail app" link.
    // TODO: hello@dcruzguitars.com is a placeholder — set the real inbox in
    // the form-alt link, the footer link, and the JSON-LD block.
    const altLink = $(".form-alt a[href^='mailto:']");
    const ENQUIRY_EMAIL = altLink ? altLink.href.replace(/^mailto:/, "").split("?")[0] : "hello@dcruzguitars.com";
    const form = $("#enquireForm");
    const note = $("#formNote");
    const msgField = $("#ef-msg");
    const msgCount = $("#msgCount");
    const submitBtn = $("#efSubmit");
    const SUBMIT_LABEL = submitBtn ? submitBtn.textContent : "";

    requestAnimationFrame(() => {
      if (note) { note.setAttribute("role", "status"); note.setAttribute("aria-live", "polite"); }
    });

    // "Enquire" links carry the model they came from — prefill the message.
    const PREFILL = /^Hi — I’m interested in the .+\.\s*$/;
    $$("[data-model]").forEach((link) => {
      link.addEventListener("click", () => {
        if (!msgField || !link.dataset.model) return;
        const value = msgField.value.trim();
        // Fill when empty, or replace an untouched prefill from another model
        if (!value || PREFILL.test(msgField.value)) {
          msgField.value = "Hi — I’m interested in the " + link.dataset.model + ". ";
          msgField.dispatchEvent(new Event("input"));
        }
        // Land ready to type, not just at the section wrapper
        msgField.focus({ preventScroll: true });
      });
    });

    if (!form) return;
    const fields = [
      { el: $("#ef-name"), err: $("#ef-name-err") },
      { el: $("#ef-email"), err: $("#ef-email-err") },
      { el: msgField, err: $("#ef-msg-err") },
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
        if (submitBtn && submitBtn.disabled) {
          submitBtn.disabled = false;
          submitBtn.textContent = SUBMIT_LABEL;
        }
      });
    });

    if (msgField && msgCount) {
      const max = parseInt(msgField.getAttribute("maxlength") || "1200", 10);
      msgField.addEventListener("input", () => {
        const len = msgField.value.length;
        msgCount.hidden = len === 0;
        msgCount.textContent = len + " / " + max;
        // Only chatty for screen readers when the limit is actually near
        if (max - len <= 100) {
          msgCount.setAttribute("role", "status");
          msgCount.setAttribute("aria-live", "polite");
        } else {
          msgCount.removeAttribute("role");
          msgCount.removeAttribute("aria-live");
        }
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
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Draft opened — edit to send again";
      }
    });
  }

  /* ---------- quick-view lightbox ---------- */

  function initLightbox() {
    const lightbox = $("#lightbox");
    const catCards = $$("#guitars .card");
    const feature = $("#guitars .feature");
    if (!lightbox || !catCards.length) return;

    const lbImg = $("#lbImg");
    const lbName = $("#lbName");
    const lbPrice = $("#lbPrice");
    const lbTag = $("#lbTag");
    const lbGlow = $("#lbGlow");
    const lbDesc = $("#lbDesc");
    const lbSpecs = $("#lbSpecs");
    const lbCount = $("#lbCount");
    const lbEnquire = $("#lbEnquire");
    const lbClose = $(".lightbox-close", lightbox);
    const lbPrev = $(".lightbox-prev", lightbox);
    const lbNext = $(".lightbox-next", lightbox);
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
      const img = $("img", item);
      const name = $("h3", item);
      const price = $(".price", item);
      const tag = $(".tag", item);
      const visual = $(".card-visual, .feature-media", item);
      const desc = $(".card-body > p, .feature-body > p", item);
      const specs = $(".specs", item);
      // Full-resolution source for the large view (srcset may have chosen small)
      if (img) setLbImage(img.dataset.full || img.currentSrc || img.src, img.alt, instant);
      lbName.textContent = name ? name.textContent : "";
      lbPrice.textContent = price ? price.textContent : "";
      lbTag.textContent = tag ? tag.textContent : "";
      lbTag.hidden = !tag;
      lbDesc.textContent = desc ? desc.textContent : "";
      lbSpecs.innerHTML = specs ? specs.innerHTML : "";
      lbGlow.style.setProperty("--cardglow", (visual && visual.style.getPropertyValue("--cardglow")) || "#c89b5a");
      const enquireLink = $("[data-model]", item);
      if (lbEnquire && enquireLink) lbEnquire.dataset.model = enquireLink.dataset.model;
      const list = visibleItems();
      const many = list.length > 1;
      if (lbCount) {
        lbCount.hidden = !many;
        lbCount.textContent = many ? (list.indexOf(item) + 1) + " of " + list.length : "";
      }
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
      // Back button (esp. Android) should close the modal, not leave the
      // site — and the hash makes the open guitar shareable.
      if (history.pushState && !(history.state && history.state.dcruzLb)) {
        history.pushState({ dcruzLb: true }, "", "#" + item.id);
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
      if (history.state && history.state.dcruzLb) {
        history.replaceState(history.state, "", "#" + current.id);
      }
    };

    $$("[data-close]", lightbox).forEach((el) =>
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

    // Touch swipe between guitars
    if (lbGlow) {
      lbGlow.style.touchAction = "pan-y";
      let startX = null;
      lbGlow.addEventListener("pointerdown", (e) => { startX = e.clientX; }, { passive: true });
      lbGlow.addEventListener("pointerup", (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 44) step(dx > 0 ? -1 : 1);
      }, { passive: true });
    }

    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") { closeLB(); return; }
      if (e.key === "ArrowLeft") { step(-1); return; }
      if (e.key === "ArrowRight") { step(1); return; }
      if (e.key === "Tab") {
        const f = $$("button, a[href]", lightbox).filter((el) => !el.hidden);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // add a zoom button over each visual (cards and the flagship feature)
    items.forEach((item) => {
      const visual = $(".card-visual, .feature-media", item);
      if (!visual) return;
      const name = $("h3", item);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card-zoom";
      btn.setAttribute("aria-label", "View " + (name ? name.textContent : "guitar") + " larger");
      btn.innerHTML = '<span>View<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></span>';
      btn.addEventListener("click", () => openLB(item));
      visual.appendChild(btn);
    });
  }

  /* ---------- boot ---------- */

  initChrome();
  initMenu();
  initAnchors();
  initSpy();
  initReveal();
  initMarquee();
  initFilter();
  initFinishPicker();
  initForm();
  initLightbox();
})();

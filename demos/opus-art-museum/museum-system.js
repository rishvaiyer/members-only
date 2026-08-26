(function () {
  const route = location.pathname;
  const shortLabels = [
    ["/free-form/", "Free Form"],
    ["/visitor-notes/", "Notes"],
    ["/sound-room/", "Sound"],
    ["/rotating-exhibition/", "Exhibition"],
    ["/3d-room/", "3D"]
  ];
  const hiddenRoutes = ["/curators-desk/", "/prototypes.html"];

  document.querySelectorAll(".links a, .site-nav a").forEach((link) => {
    const target = new URL(link.href, location.href).pathname;
    if (hiddenRoutes.some((path) => target.endsWith(path))) {
      link.remove();
      return;
    }
    const match = shortLabels.find(([path]) => target.endsWith(path));
    link.textContent = match ? match[1] : "Collection";
    const isCurrent = route.endsWith(target) || (target.endsWith("/opus-art-museum/") && route.endsWith("/opus-art-museum/"));
    if (isCurrent) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    }
  });

  const main = document.querySelector("main") || document.querySelector(".wrap");
  if (main) main.id = main.id || "museum-main";
  const skip = document.createElement("a");
  skip.className = "skip-link";
  skip.href = "#museum-main";
  skip.textContent = "Skip to art";
  document.body.prepend(skip);

  const roomCopy = [
    [".note-form", "Visitor book", "Saved only in this browser."],
    [".tracks", "Listening room", "Three tone studies. One open slot."],
    [".show", "Now showing", "Three works selected by Opus."],
    [".room", "Spatial study", "Select an object to inspect the room."]
  ];
  roomCopy.forEach(([selector, label, copy]) => {
    if (!document.querySelector(selector)) return;
    const eyebrow = document.querySelector("main > .eyebrow, main .intro .eyebrow");
    const heading = document.querySelector("main h1");
    const description = heading && heading.nextElementSibling;
    if (eyebrow) eyebrow.textContent = label;
    if (description && description.matches("p")) description.textContent = copy;
  });

  const focusable = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
  let lastTrigger = null;
  document.addEventListener("pointerdown", (event) => {
    const trigger = event.target.closest("button,a[href],[tabindex]") || event.target.closest(".work,.piece,.track,.object,[data-title]");
    if (trigger) lastTrigger = trigger;
  }, true);

  document.querySelectorAll(".inspect,.lb,.phantom").forEach((dialog) => {
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("tabindex", "-1");
    let open = dialog.classList.contains("open");
    const sync = () => {
      const next = dialog.classList.contains("open");
      dialog.setAttribute("aria-hidden", String(!next));
      if (next && !open) {
        document.body.classList.add("museum-dialog-open");
        requestAnimationFrame(() => (dialog.querySelector(focusable) || dialog).focus());
      }
      if (!next && open) {
        document.body.classList.remove("museum-dialog-open");
        if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
      }
      open = next;
    };
    new MutationObserver(sync).observe(dialog, { attributes: true, attributeFilter: ["class"] });
    sync();
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        const close = dialog.querySelector(".lb-close,#phExit,.close,#closeInspect,#close");
        if (close) close.click();
        else dialog.classList.remove("open");
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = [...dialog.querySelectorAll(focusable)].filter((node) => node.offsetParent !== null);
      if (!nodes.length) { event.preventDefault(); dialog.focus(); return; }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  });
})();

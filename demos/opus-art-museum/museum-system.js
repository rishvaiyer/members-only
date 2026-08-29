(function () {
  /* ------------------------------------------------------------------
     One nav, defined once, rebuilt on every page.

     This used to relabel whatever links a page already had, matching on
     absolute paths like "/free-form/". That broke the moment the museum
     was served under a base path: the GitHub Pages copy was published
     with a find-and-replace of "/" -> "/rishva-portfolio/", every path
     in the table stopped matching, and all nine links fell through to
     the "Collection" default. Hence nine identical "Collection" tabs.

     Nothing here compares absolute paths any more. The base is derived
     from where "opus-art-museum" sits in the current pathname, so the
     same files work at a domain root, under /demos/, or under any
     project sub-path, with no build step rewriting anything.
     ------------------------------------------------------------------ */

  var ROOMS = [
    ["rotating-exhibition", "Rotating Exhibition", "A handful of works, reshuffled"],
    ["free-form", "Free Form", "Work that would not sit in a frame"],
    ["sound-room", "Sound Room", "Tone studies, played on request"],
    ["3d-room", "3D Room", "A room you can look around"],
    ["curators-desk", "Curator’s Desk", "Notes on how the museum runs"],
    ["visitor-notes", "Visitor Notes", "Leave a line in the book"],
    ["your-turn", "Your Turn", "Make something yourself"],
    ["prototypes.html", "Studies", "Prototypes and dead ends"]
  ];

  var segments = location.pathname.split("/").filter(Boolean);
  var anchor = segments.lastIndexOf("opus-art-museum");
  var current = "collection";
  var root = "./";

  if (anchor !== -1) {
    var after = segments.slice(anchor + 1);
    var file = after.length && /\.html?$/i.test(after[after.length - 1]) ? after.pop() : "";
    root = after.length ? new Array(after.length + 1).join("../") : "./";
    if (file && file.toLowerCase().indexOf("index") !== 0) current = file;
    else if (after.length) current = after[after.length - 1];
  } else if (segments.length) {
    /* Opened outside a folder called opus-art-museum (a file:// preview, a
       renamed deploy). Fall back to the last segment and a relative root that
       matches whatever the page's own links already assume. */
    var existing = document.querySelector('.site-nav a[href^="../"], .links a[href^="../"]');
    root = existing ? "../" : "./";
    current = /\.html?$/i.test(segments[segments.length - 1])
      ? segments[segments.length - 1]
      : segments[segments.length - 1];
    if (current.toLowerCase().indexOf("index") === 0) current = "collection";
  }

  var isRoom = ROOMS.some(function (room) { return room[0] === current; });
  if (!isRoom) current = "collection";

  function buildNav(host) {
    host.textContent = "";
    host.setAttribute("aria-label", "Museum pages");
    /* Subpages host the nav in a .links bar that sets overflow-x:auto, which
       would clip the dropdown. Tagging every host .site-nav lets one rule set
       style and overflow for the index and the rooms alike. */
    host.classList.add("site-nav");

    var collection = document.createElement("a");
    collection.className = "site-link";
    collection.href = root;
    collection.textContent = "Collection";
    if (current === "collection") {
      collection.classList.add("active");
      collection.setAttribute("aria-current", "page");
    }
    host.appendChild(collection);

    var wrap = document.createElement("div");
    wrap.className = "rooms";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "site-link rooms-btn";
    button.id = "roomsBtn";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-controls", "roomsMenu");
    button.innerHTML = 'Rooms<svg class="chev" width="9" height="6" viewBox="0 0 9 6" aria-hidden="true"><path d="M1 1l3.5 4L8 1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (current !== "collection") button.classList.add("active");

    var menu = document.createElement("div");
    menu.className = "rooms-menu";
    menu.id = "roomsMenu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-labelledby", "roomsBtn");
    menu.hidden = true;

    ROOMS.forEach(function (room) {
      var link = document.createElement("a");
      link.setAttribute("role", "menuitem");
      link.href = root + room[0] + (/\.html?$/i.test(room[0]) ? "" : "/");
      link.innerHTML = "<b></b><span></span>";
      link.querySelector("b").textContent = room[1];
      link.querySelector("span").textContent = room[2];
      if (room[0] === current) {
        link.classList.add("is-current");
        link.setAttribute("aria-current", "page");
      }
      menu.appendChild(link);
    });

    wrap.appendChild(button);
    wrap.appendChild(menu);
    host.appendChild(wrap);
    return { button: button, menu: menu, wrap: wrap };
  }

  function wireMenu(parts) {
    var button = parts.button;
    var menu = parts.menu;
    var items = function () { return [].slice.call(menu.querySelectorAll("a")); };

    function open() {
      menu.hidden = false;
      button.setAttribute("aria-expanded", "true");
    }
    function close(refocus) {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
      if (refocus) button.focus();
    }
    function isOpen() { return !menu.hidden; }

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (isOpen()) close(false);
      else { open(); }
    });

    button.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
        var first = items()[0];
        if (first) first.focus();
      }
    });

    menu.addEventListener("keydown", function (event) {
      var list = items();
      var at = list.indexOf(document.activeElement);
      if (event.key === "Escape") { event.preventDefault(); close(true); }
      else if (event.key === "ArrowDown") { event.preventDefault(); (list[at + 1] || list[0]).focus(); }
      else if (event.key === "ArrowUp") { event.preventDefault(); (list[at - 1] || list[list.length - 1]).focus(); }
      else if (event.key === "Home") { event.preventDefault(); list[0].focus(); }
      else if (event.key === "End") { event.preventDefault(); list[list.length - 1].focus(); }
      else if (event.key === "Tab") { close(false); }
    });

    document.addEventListener("click", function (event) {
      if (isOpen() && !parts.wrap.contains(event.target)) close(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) close(true);
    });
  }

  var host = document.querySelector(".site-nav") || document.querySelector("nav.links") || document.querySelector(".links") || document.querySelector('nav[aria-label="Museum pages"]');
  if (host) host.removeAttribute("style");
  if (host) wireMenu(buildNav(host));

  var main = document.querySelector("main") || document.querySelector(".wrap");
  if (main) main.id = main.id || "museum-main";
  var skip = document.createElement("a");
  skip.className = "skip-link";
  skip.href = "#museum-main";
  skip.textContent = "Skip to art";
  document.body.prepend(skip);

  var roomCopy = [
    [".note-form", "Visitor book", "Saved only in this browser."],
    [".tracks", "Listening room", "Three tone studies. One open slot."],
    [".show", "Now showing", "Three works selected by Opus."],
    [".room", "Spatial study", "Select an object to inspect the room."]
  ];
  roomCopy.forEach(function (entry) {
    if (!document.querySelector(entry[0])) return;
    var eyebrow = document.querySelector("main > .eyebrow, main .intro .eyebrow");
    var heading = document.querySelector("main h1");
    var description = heading && heading.nextElementSibling;
    if (eyebrow) eyebrow.textContent = entry[1];
    if (description && description.matches("p")) description.textContent = entry[2];
  });

  var focusable = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var lastTrigger = null;
  document.addEventListener("pointerdown", function (event) {
    var trigger = event.target.closest("button,a[href],[tabindex]") || event.target.closest(".work,.piece,.track,.object,[data-title]");
    if (trigger) lastTrigger = trigger;
  }, true);

  document.querySelectorAll(".inspect,.lb,.phantom").forEach(function (dialog) {
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("tabindex", "-1");
    var open = dialog.classList.contains("open");
    var sync = function () {
      var next = dialog.classList.contains("open");
      dialog.setAttribute("aria-hidden", String(!next));
      if (next && !open) {
        document.body.classList.add("museum-dialog-open");
        requestAnimationFrame(function () { (dialog.querySelector(focusable) || dialog).focus(); });
      }
      if (!next && open) {
        document.body.classList.remove("museum-dialog-open");
        if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
      }
      open = next;
    };
    new MutationObserver(sync).observe(dialog, { attributes: true, attributeFilter: ["class"] });
    sync();
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        var close = dialog.querySelector(".lb-close,#phExit,.close,#closeInspect,#close");
        if (close) close.click();
        else dialog.classList.remove("open");
        return;
      }
      if (event.key !== "Tab") return;
      var nodes = [].slice.call(dialog.querySelectorAll(focusable)).filter(function (node) { return node.offsetParent !== null; });
      if (!nodes.length) { event.preventDefault(); dialog.focus(); return; }
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  });
})();

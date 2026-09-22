(() => {

  const tocs = [
    ...document.querySelectorAll(".wa-toc")
  ];

  if (!tocs.length) return;


  /* =======================================================
     OVERFLOW CUE
     ======================================================= */

  function updateOverflowCue(toc) {

    const body =
      toc.querySelector(".wa-toc__body");

    const scroller =
      toc.querySelector(".wa-toc__scroll");

    if (!body || !scroller) return;

    const hasMore =
      scroller.scrollTop +
      scroller.clientHeight <
      scroller.scrollHeight - 4;

    body.classList.toggle(
      "has-more",
      hasMore
    );

  }


  /* =======================================================
     KEEP ACTIVE LINK VISIBLE INSIDE TOC ONLY
     ======================================================= */

    function keepLinkVisible(toc, link) {

        const scroller =
            toc.querySelector(".wa-toc__scroll");

        if (!scroller || !link) return;


        /*
         * If the first TOC item is active,
         * restore the TOC to its true beginning.
         */
        const firstLink =
            scroller.querySelector("[data-toc-target]");

        if (link === firstLink) {

            scroller.scrollTop = 0;

            updateOverflowCue(toc);

            return;
        }


        const linkRect =
            link.getBoundingClientRect();

        const scrollRect =
            scroller.getBoundingClientRect();

        const padding = 24;


        if (
            linkRect.top <
            scrollRect.top + padding
        ) {

            const distance =
                (scrollRect.top + padding) -
                linkRect.top;

            scroller.scrollTop =
                Math.max(
                    0,
                    scroller.scrollTop - distance
                );

        }

        else if (
            linkRect.bottom >
            scrollRect.bottom - padding
        ) {

            const distance =
                linkRect.bottom -
                (scrollRect.bottom - padding);

            scroller.scrollTop =
                Math.min(
                    scroller.scrollHeight -
                    scroller.clientHeight,
                    scroller.scrollTop + distance
                );

        }


        updateOverflowCue(toc);

    }


  /* =======================================================
     ACTIVE SECTION
     ======================================================= */

  tocs.forEach(toc => {

    const links = [
      ...toc.querySelectorAll(
        "[data-toc-target]"
      )
    ];

    if (!links.length) {
      updateOverflowCue(toc);
      return;
    }


    const items =
      links
        .map(link => ({
          link,

          section:
            document.getElementById(
              link.dataset.tocTarget
            )
        }))
        .filter(item => item.section);


    function activate(id) {

      let activeLink = null;

      links.forEach(link => {

        const active =
          link.dataset.tocTarget === id;

        link.classList.toggle(
          "is-active",
          active
        );

        if (active) {

          activeLink = link;

          link.setAttribute(
            "aria-current",
            "location"
          );

        } else {

          link.removeAttribute(
            "aria-current"
          );

        }

      });


      if (activeLink) {
        keepLinkVisible(
          toc,
          activeLink
        );
      }

    }


    function updateActive() {

      const readingLine =
        window.innerHeight * 0.22;

      let current =
        items[0] || null;


      for (const item of items) {

        const rect =
          item.section.getBoundingClientRect();

        if (
          rect.top <= readingLine
        ) {
          current = item;
        } else {
          break;
        }

      }


      if (current) {
        activate(
          current.section.id
        );
      }

    }


    let ticking = false;


    function requestUpdate() {

      if (ticking) return;

      ticking = true;

      requestAnimationFrame(() => {

        updateActive();

        updateOverflowCue(toc);

        ticking = false;

      });

    }


    window.addEventListener(
      "scroll",
      requestUpdate,
      { passive: true }
    );


    const scroller =
      toc.querySelector(
        ".wa-toc__scroll"
      );

    if (scroller) {

      scroller.addEventListener(
        "scroll",
        () => updateOverflowCue(toc),
        { passive: true }
      );

    }


    updateActive();

    updateOverflowCue(toc);

  });


  /* =======================================================
     FRAMEWORK NAV LINKS OPEN THEIR DETAILS
     ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const link =
        event.target.closest(
          ".wa-toc--framework [data-toc-target]"
        );

      if (!link) return;

      const target =
        document.getElementById(
          link.dataset.tocTarget
        );

      if (
        target &&
        target.tagName === "DETAILS"
      ) {
        target.open = true;
      }

    }
  );


  /* =======================================================
     RESIZE
     ======================================================= */

  window.addEventListener(
    "resize",
    () => {

      tocs.forEach(
        updateOverflowCue
      );

    }
  );

})();
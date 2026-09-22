/* =========================================================
   TOPBAR
   - hide down / show up
   - mobile navigation
   ========================================================= */

(() => {

    const topbar = document.querySelector(".topbar-wrap");

    if (!topbar) return;


    /* =====================================================
       MOBILE MENU
       ===================================================== */

    const menuButton =
        topbar.querySelector(".nav__menu-button");

    const mobileMenu =
        topbar.querySelector(".nav-mobile");


    function closeMenu() {

        if (!menuButton || !mobileMenu) return;

        menuButton.setAttribute("aria-expanded", "false");

        mobileMenu.hidden = true;

    }


    function openMenu() {

        if (!menuButton || !mobileMenu) return;

        topbar.classList.remove("is-hidden");

        menuButton.setAttribute("aria-expanded", "true");

        mobileMenu.hidden = false;

    }


    if (menuButton && mobileMenu) {

        menuButton.addEventListener("click", () => {

            const isOpen =
                menuButton.getAttribute("aria-expanded") === "true";

            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }

        });


        mobileMenu.addEventListener("click", (event) => {

            if (event.target.closest("a")) {
                closeMenu();
            }

        });


        document.addEventListener("keydown", (event) => {

            if (event.key === "Escape") {

                closeMenu();

                menuButton.focus();

            }

        });


        document.addEventListener("click", (event) => {

            const isOpen =
                menuButton.getAttribute("aria-expanded") === "true";

            if (
                isOpen &&
                !topbar.contains(event.target)
            ) {
                closeMenu();
            }

        });


        const desktopQuery =
            window.matchMedia("(min-width: 981px)");

        desktopQuery.addEventListener("change", (event) => {

            if (event.matches) {
                closeMenu();
            }

        });

    }


    /* =====================================================
       HIDE DOWN / SHOW UP
       ===================================================== */

    let lastY = window.scrollY;
    let ticking = false;

    const topZone = 80;
    const movementThreshold = 8;


    function updateTopbar() {

        const currentY = window.scrollY;
        const movement = currentY - lastY;

        const menuOpen =
            menuButton &&
            menuButton.getAttribute("aria-expanded") === "true";


        /*
         * Never hide while the mobile menu is open.
         */
        if (menuOpen) {

            topbar.classList.remove("is-hidden");

            lastY = currentY;
            ticking = false;

            return;

        }


        /*
         * Always show near the top.
         */
        if (currentY <= topZone) {

            topbar.classList.remove("is-hidden");

            lastY = currentY;
            ticking = false;

            return;

        }


        /*
         * Ignore tiny movements.
         */
        if (Math.abs(movement) < movementThreshold) {

            ticking = false;

            return;

        }


        /*
         * Down = hide.
         * Up = show.
         */
        if (movement > 0) {

            topbar.classList.add("is-hidden");

        } else {

            topbar.classList.remove("is-hidden");

        }


        lastY = currentY;
        ticking = false;

    }


    window.addEventListener(
        "scroll",
        () => {

            if (ticking) return;

            ticking = true;

            requestAnimationFrame(updateTopbar);

        },
        { passive: true }
    );

})();
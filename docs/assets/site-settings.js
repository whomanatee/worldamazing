(() => {
    "use strict";


    /* =========================================================
       WORLD AMAZING SETTINGS
       ========================================================= */

    const STORAGE_KEY = "wa.settings.v2";


    const DEFAULTS = {
        lensFlare: {
            enabled: false,
            frequency: "rare",
            intensity: "subtle"
        }
    };


    let flareTimer = null;
    let styleElement = null;


    /* =========================================================
       STORAGE
       ========================================================= */

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }


    function mergeSettings(saved = {}) {
        return {
            ...clone(DEFAULTS),
            ...saved,

            lensFlare: {
                ...DEFAULTS.lensFlare,
                ...(saved.lensFlare || {})
            }
        };
    }


    function getSettings() {
        try {
            const saved =
                JSON.parse(
                    localStorage.getItem(STORAGE_KEY) || "{}"
                );

            return mergeSettings(saved);
        }

        catch {
            return clone(DEFAULTS);
        }
    }


    function writeSettings(settings) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );
        }

        catch {
            /* localStorage unavailable */
        }
    }


    function setSettings(partial) {
        const current = getSettings();

        const next = mergeSettings({
            ...current,
            ...partial,

            lensFlare: {
                ...current.lensFlare,
                ...(partial.lensFlare || {})
            }
        });


        writeSettings(next);

        restartFlareScheduler();


        window.dispatchEvent(
            new CustomEvent(
                "wa:settingschange",
                {
                    detail: clone(next)
                }
            )
        );


        return next;
    }


    function resetSettings() {
        writeSettings(
            clone(DEFAULTS)
        );

        restartFlareScheduler();


        window.dispatchEvent(
            new CustomEvent(
                "wa:settingschange",
                {
                    detail: clone(DEFAULTS)
                }
            )
        );
    }


    /* =========================================================
       HELPERS
       ========================================================= */

    function randomBetween(min, max) {
        return (
            min +
            Math.random() * (max - min)
        );
    }


    function randomInt(min, max) {
        return Math.floor(
            randomBetween(min, max + 1)
        );
    }


    function choose(items) {
        return items[
            Math.floor(
                Math.random() * items.length
            )
        ];
    }


    function chance(probability) {
        return Math.random() < probability;
    }


    function clamp(value, min, max) {
        return Math.max(
            min,
            Math.min(max, value)
        );
    }


    /* =========================================================
       EFFECT CSS
       ========================================================= */

    function ensureStyles() {
        if (styleElement) {
            return;
        }


        styleElement =
            document.createElement("style");


        styleElement.id =
            "wa-site-settings-styles";


        styleElement.textContent = `
      /* =====================================================
         EVENT ROOT
         ===================================================== */

      .wa-flare-event {
        position: fixed;
        inset: 0;

        z-index: 99999;

        overflow: hidden;

        pointer-events: none;

        mix-blend-mode: screen;
      }


      /* =====================================================
         INDIVIDUAL SOURCE
         ===================================================== */

      .wa-flare-source {
        position: absolute;
        inset: 0;

        opacity: 0;

        animation:
          waFlareSource
          var(--flare-duration)
          cubic-bezier(.2,.65,.3,1)
          var(--flare-delay)
          forwards;
      }


      .wa-flare-core,
      .wa-flare-bloom,
      .wa-flare-halo,
      .wa-flare-beam,
      .wa-flare-ghost {
        position: absolute;

        pointer-events: none;
      }


      /* =====================================================
         CORE
         ===================================================== */

      .wa-flare-core {
        left: var(--flare-x);
        top: var(--flare-y);

        width: var(--core-size);
        height: var(--core-size);

        border-radius: 50%;

        transform:
          translate(-50%, -50%)
          scale(var(--flare-scale));

        background:
          radial-gradient(
            circle,
            rgba(255,255,255,1) 0%,
            rgba(255,255,255,0.98) 12%,
            rgba(202,235,255,0.92) 34%,
            rgba(139,211,255,0.46) 58%,
            transparent 76%
          );

        filter:
          blur(var(--core-blur));

        box-shadow:
          0 0 18px rgba(255,255,255,0.95),
          0 0 55px rgba(202,235,255,0.82),
          0 0 130px rgba(139,211,255,0.48),
          0 0 260px rgba(139,211,255,0.22);
      }


      /* =====================================================
         LARGE BLOOM
         ===================================================== */

      .wa-flare-bloom {
        left: var(--flare-x);
        top: var(--flare-y);

        width: var(--bloom-size);
        height: var(--bloom-size);

        border-radius: 50%;

        transform:
          translate(-50%, -50%)
          scale(var(--flare-scale));

        background:
          radial-gradient(
            circle,
            rgba(255,255,255,0.8) 0%,
            rgba(221,242,255,0.5) 12%,
            rgba(139,211,255,0.22) 28%,
            rgba(185,247,207,0.09) 46%,
            transparent 70%
          );

        filter:
          blur(var(--bloom-blur));
      }


      /* =====================================================
         HUGE SOFT HALO
         ===================================================== */

      .wa-flare-halo {
        left: var(--flare-x);
        top: var(--flare-y);

        width: var(--halo-size);
        height: var(--halo-size);

        border-radius: 50%;

        transform:
          translate(-50%, -50%)
          scale(var(--flare-scale));

        background:
          radial-gradient(
            circle,
            rgba(255,255,255,0.2),
            rgba(139,211,255,0.09) 20%,
            rgba(185,247,207,0.035) 40%,
            transparent 70%
          );

        filter: blur(14px);
      }


      /* =====================================================
         BEAM
         ===================================================== */

      .wa-flare-beam {
        left: var(--flare-x);
        top: var(--flare-y);

        width: var(--beam-length);
        height: var(--beam-height);

        transform:
          translateY(-50%)
          rotate(var(--beam-angle));

        transform-origin: left center;

        background:
          linear-gradient(
            90deg,
            rgba(255,255,255,0.92),
            rgba(210,238,255,0.7) 4%,
            rgba(139,211,255,0.34) 11%,
            rgba(185,247,207,0.14) 24%,
            rgba(139,211,255,0.06) 42%,
            transparent 72%
          );

        filter:
          blur(var(--beam-blur));

        box-shadow:
          0 0 8px rgba(255,255,255,0.35);
      }


      /* =====================================================
         GHOSTS
         ===================================================== */

      .wa-flare-ghost {
        left: var(--ghost-x);
        top: var(--ghost-y);

        width: var(--ghost-size);
        height: var(--ghost-size);

        border-radius: 50%;

        transform:
          translate(-50%, -50%)
          scale(var(--ghost-scale));

        opacity: var(--ghost-opacity);

        border:
          var(--ghost-border)
          solid
          rgba(185,247,207,0.2);

        background:
          radial-gradient(
            circle,
            rgba(255,255,255,0.08),
            rgba(139,211,255,0.055) 34%,
            rgba(185,247,207,0.025) 56%,
            transparent 72%
          );

        box-shadow:
          inset 0 0 24px rgba(139,211,255,0.07),
          0 0 30px rgba(139,211,255,0.025);
      }


      .wa-flare-ghost--ring {
        background: transparent;

        border:
          2px solid
          rgba(139,211,255,0.15);

        box-shadow:
          inset 0 0 24px rgba(185,247,207,0.05),
          0 0 34px rgba(139,211,255,0.035);
      }


      /* =====================================================
         FULL VIEWPORT FLASH
         ===================================================== */

      .wa-flare-fullflash {
        position: absolute;
        inset: 0;

        opacity: 0;

        background:
          radial-gradient(
            circle at var(--flash-x) var(--flash-y),
            rgba(255,255,255,0.9),
            rgba(184,226,255,0.34) 18%,
            rgba(139,211,255,0.12) 38%,
            transparent 68%
          );

        animation:
          waFullFlash
          var(--flash-duration)
          ease-out
          var(--flash-delay)
          forwards;
      }


      /* =====================================================
         HORIZONTAL ANAMORPHIC STREAK
         ===================================================== */

      .wa-flare-streak {
        position: absolute;

        left: -15vw;
        top: var(--streak-y);

        width: 130vw;
        height: var(--streak-height);

        opacity: 0;

        background:
          linear-gradient(
            90deg,
            transparent,
            rgba(139,211,255,0.08) 17%,
            rgba(255,255,255,0.85) 48%,
            rgba(185,247,207,0.14) 58%,
            transparent 84%
          );

        filter:
          blur(var(--streak-blur));

        animation:
          waStreak
          var(--streak-duration)
          ease-out
          var(--streak-delay)
          forwards;
      }


      /* =====================================================
         ANIMATION
         ===================================================== */

      @keyframes waFlareSource {

        0% {
          opacity: 0;
          transform:
            translateX(
              calc(var(--source-drift) * -1)
            );
        }

        12% {
          opacity:
            var(--flare-opacity);
        }

        38% {
          opacity:
            var(--flare-opacity);
        }

        72% {
          opacity:
            calc(var(--flare-opacity) * 0.55);
        }

        100% {
          opacity: 0;
          transform:
            translateX(
              var(--source-drift)
            );
        }

      }


      @keyframes waFullFlash {

        0% {
          opacity: 0;
        }

        15% {
          opacity: var(--flash-opacity);
        }

        38% {
          opacity: calc(var(--flash-opacity) * 0.75);
        }

        100% {
          opacity: 0;
        }

      }


      @keyframes waStreak {

        0% {
          opacity: 0;
          transform: scaleX(0.7);
        }

        15% {
          opacity: var(--streak-opacity);
        }

        55% {
          opacity: calc(var(--streak-opacity) * 0.7);
          transform: scaleX(1);
        }

        100% {
          opacity: 0;
          transform: scaleX(1.08);
        }

      }


      @media (prefers-reduced-motion: reduce) {

        .wa-flare-event {
          display: none !important;
        }

      }
    `;


        document.head.appendChild(
            styleElement
        );
    }


    /* =========================================================
       INTENSITY PROFILES
       ========================================================= */

    const PROFILES = {

        subtle: {
            sources: [1, 2],
            scale: [0.9, 1.8],
            opacity: [0.38, 0.58],
            bloom: [130, 260],
            halo: [280, 520],
            beamHeight: [1, 2.5],
            duration: [1200, 1800],
            ghosts: [2, 4],
            fullFlashChance: 0,
            streakChance: 0.12,
            eventTypes: [
                "sweep",
                "single",
                "double"
            ]
        },


        cinematic: {
            sources: [1, 3],
            scale: [1.3, 3.6],
            opacity: [0.62, 0.92],
            bloom: [220, 560],
            halo: [420, 950],
            beamHeight: [2, 5],
            duration: [1500, 2400],
            ghosts: [3, 6],
            fullFlashChance: 0.12,
            streakChance: 0.4,
            eventTypes: [
                "sweep",
                "double",
                "constellation",
                "impact",
                "ghoststorm"
            ]
        },


        jj: {
            sources: [2, 6],
            scale: [2, 12],
            opacity: [0.82, 1],
            bloom: [420, 1500],
            halo: [700, 2400],
            beamHeight: [3, 14],
            duration: [1700, 3200],
            ghosts: [4, 10],
            fullFlashChance: 0.58,
            streakChance: 0.82,
            eventTypes: [
                "sweep",
                "double",
                "constellation",
                "impact",
                "cascade",
                "ghoststorm",
                "maximum"
            ]
        }

    };


    /* =========================================================
       SOURCE GEOMETRY
       ========================================================= */

    function edgeSource(preferredSide = null) {
        const side =
            preferredSide ||
            choose([
                "left",
                "right",
                "top"
            ]);


        if (side === "left") {
            return {
                x: randomBetween(-6, 12),
                y: randomBetween(8, 88)
            };
        }


        if (side === "right") {
            return {
                x: randomBetween(88, 106),
                y: randomBetween(8, 88)
            };
        }


        return {
            x: randomBetween(8, 92),
            y: randomBetween(-5, 14)
        };
    }


    function calculateAngle(x, y) {
        const sourceX =
            window.innerWidth * (x / 100);

        const sourceY =
            window.innerHeight * (y / 100);


        const targetX =
            window.innerWidth *
            randomBetween(0.35, 0.65);

        const targetY =
            window.innerHeight *
            randomBetween(0.35, 0.65);


        return (
            Math.atan2(
                targetY - sourceY,
                targetX - sourceX
            ) *
            180 /
            Math.PI
        );
    }


    /* =========================================================
       CREATE SOURCE
       ========================================================= */

    function createFlareSource({
        intensity,
        source,
        delay = 0,
        scaleMultiplier = 1,
        ghostHeavy = false,
        huge = false
    }) {

        const profile =
            PROFILES[intensity];


        const element =
            document.createElement("div");


        element.className =
            "wa-flare-source";


        const rawScale =
            randomBetween(
                profile.scale[0],
                profile.scale[1]
            );


        const scale =
            rawScale *
            scaleMultiplier;


        const opacity =
            randomBetween(
                profile.opacity[0],
                profile.opacity[1]
            );


        const duration =
            randomBetween(
                profile.duration[0],
                profile.duration[1]
            );


        const bloomSize =
            randomBetween(
                profile.bloom[0],
                profile.bloom[1]
            ) *
            (
                huge
                    ? randomBetween(1.4, 2.4)
                    : 1
            );


        const haloSize =
            randomBetween(
                profile.halo[0],
                profile.halo[1]
            ) *
            (
                huge
                    ? randomBetween(1.4, 2.2)
                    : 1
            );


        const beamHeight =
            randomBetween(
                profile.beamHeight[0],
                profile.beamHeight[1]
            );


        const beamLength =
            randomBetween(
                120,
                intensity === "jj"
                    ? 220
                    : 170
            );


        const angle =
            calculateAngle(
                source.x,
                source.y
            );


        element.style.setProperty(
            "--flare-x",
            `${source.x}%`
        );

        element.style.setProperty(
            "--flare-y",
            `${source.y}%`
        );

        element.style.setProperty(
            "--flare-scale",
            scale.toFixed(2)
        );

        element.style.setProperty(
            "--flare-opacity",
            opacity.toFixed(2)
        );

        element.style.setProperty(
            "--flare-duration",
            `${Math.round(duration)}ms`
        );

        element.style.setProperty(
            "--flare-delay",
            `${Math.round(delay)}ms`
        );

        element.style.setProperty(
            "--core-size",
            `${randomBetween(8, 16)}px`
        );

        element.style.setProperty(
            "--core-blur",
            `${randomBetween(0.2, 1.4)}px`
        );

        element.style.setProperty(
            "--bloom-size",
            `${Math.round(bloomSize)}px`
        );

        element.style.setProperty(
            "--bloom-blur",
            `${randomBetween(4, 16)}px`
        );

        element.style.setProperty(
            "--halo-size",
            `${Math.round(haloSize)}px`
        );

        element.style.setProperty(
            "--beam-height",
            `${beamHeight.toFixed(1)}px`
        );

        element.style.setProperty(
            "--beam-length",
            `${beamLength.toFixed(0)}vw`
        );

        element.style.setProperty(
            "--beam-angle",
            `${angle.toFixed(2)}deg`
        );

        element.style.setProperty(
            "--beam-blur",
            `${randomBetween(0.4, 2.4)}px`
        );

        element.style.setProperty(
            "--source-drift",
            `${randomBetween(0.5, 3.5)}vw`
        );


        element.innerHTML = `
      <div class="wa-flare-halo"></div>
      <div class="wa-flare-bloom"></div>
      <div class="wa-flare-beam"></div>
      <div class="wa-flare-core"></div>
    `;


        const ghostCount =
            ghostHeavy
                ? profile.ghosts[1] + 3
                : randomInt(
                    profile.ghosts[0],
                    profile.ghosts[1]
                );


        addGhosts(
            element,
            source,
            ghostCount,
            intensity,
            ghostHeavy
        );


        return {
            element,
            totalDuration:
                duration + delay
        };
    }


    /* =========================================================
       GHOST CHAIN
       ========================================================= */

    function addGhosts(
        sourceElement,
        source,
        count,
        intensity,
        ghostHeavy
    ) {

        const oppositeX =
            100 - source.x;

        const oppositeY =
            100 - source.y;


        for (
            let index = 0;
            index < count;
            index += 1
        ) {

            const t =
                randomBetween(
                    0.18,
                    ghostHeavy
                        ? 1.4
                        : 1.08
                );


            const ghost =
                document.createElement("div");


            ghost.className =
                "wa-flare-ghost";


            if (
                ghostHeavy ||
                chance(0.35)
            ) {
                ghost.classList.add(
                    "wa-flare-ghost--ring"
                );
            }


            const x =
                source.x +
                (oppositeX - source.x) * t;


            const y =
                source.y +
                (oppositeY - source.y) * t;


            let size =
                randomBetween(18, 110);


            if (
                intensity === "cinematic" &&
                chance(0.24)
            ) {
                size =
                    randomBetween(140, 340);
            }


            if (
                intensity === "jj" &&
                chance(0.42)
            ) {
                size =
                    randomBetween(220, 820);
            }


            if (
                ghostHeavy &&
                chance(0.45)
            ) {
                size *=
                    randomBetween(1.8, 3.5);
            }


            ghost.style.setProperty(
                "--ghost-x",
                `${x}%`
            );

            ghost.style.setProperty(
                "--ghost-y",
                `${y}%`
            );

            ghost.style.setProperty(
                "--ghost-size",
                `${Math.round(size)}px`
            );

            ghost.style.setProperty(
                "--ghost-scale",
                randomBetween(
                    0.7,
                    intensity === "jj"
                        ? 2.4
                        : 1.5
                ).toFixed(2)
            );

            ghost.style.setProperty(
                "--ghost-opacity",
                randomBetween(
                    0.18,
                    intensity === "jj"
                        ? 0.72
                        : 0.48
                ).toFixed(2)
            );

            ghost.style.setProperty(
                "--ghost-border",
                chance(0.45)
                    ? "2px"
                    : "1px"
            );


            sourceElement.appendChild(
                ghost
            );
        }
    }


    /* =========================================================
       FULL FLASH
       ========================================================= */

    function addFullFlash(
        root,
        {
            delay = 0,
            intensity = "cinematic",
            huge = false
        } = {}
    ) {

        const flash =
            document.createElement("div");


        flash.className =
            "wa-flare-fullflash";


        flash.style.setProperty(
            "--flash-x",
            `${randomBetween(10, 90)}%`
        );

        flash.style.setProperty(
            "--flash-y",
            `${randomBetween(5, 85)}%`
        );

        flash.style.setProperty(
            "--flash-delay",
            `${Math.round(delay)}ms`
        );

        flash.style.setProperty(
            "--flash-duration",
            `${Math.round(
                randomBetween(
                    500,
                    huge
                        ? 1300
                        : 900
                )
            )
            }ms`
        );

        flash.style.setProperty(
            "--flash-opacity",
            (
                intensity === "jj"
                    ? randomBetween(
                        huge ? 0.7 : 0.45,
                        huge ? 1 : 0.82
                    )
                    : randomBetween(0.22, 0.46)
            ).toFixed(2)
        );


        root.appendChild(
            flash
        );
    }


    /* =========================================================
       HORIZONTAL STREAK
       ========================================================= */

    function addStreak(
        root,
        {
            delay = 0,
            intensity = "cinematic",
            huge = false
        } = {}
    ) {

        const streak =
            document.createElement("div");


        streak.className =
            "wa-flare-streak";


        streak.style.setProperty(
            "--streak-y",
            `${randomBetween(8, 92)}%`
        );

        streak.style.setProperty(
            "--streak-height",
            `${randomBetween(
                huge ? 5 : 1.5,
                huge ? 22 : 7
            ).toFixed(1)
            }px`
        );

        streak.style.setProperty(
            "--streak-blur",
            `${randomBetween(
                0.6,
                huge ? 4 : 2
            ).toFixed(1)
            }px`
        );

        streak.style.setProperty(
            "--streak-delay",
            `${Math.round(delay)}ms`
        );

        streak.style.setProperty(
            "--streak-duration",
            `${Math.round(
                randomBetween(
                    600,
                    huge
                        ? 1600
                        : 1100
                )
            )
            }ms`
        );

        streak.style.setProperty(
            "--streak-opacity",
            (
                intensity === "jj"
                    ? randomBetween(0.6, 1)
                    : randomBetween(0.25, 0.7)
            ).toFixed(2)
        );


        root.appendChild(
            streak
        );
    }


    /* =========================================================
       EVENT RECIPES
       ========================================================= */

    function buildEvent(
        root,
        intensity,
        type,
        preview = false
    ) {

        const profile =
            PROFILES[intensity];


        let maxDuration = 0;


        function addSource(options = {}) {
            const result =
                createFlareSource({
                    intensity:
                        intensity === "jj"
                            ? "cinematic"
                            : intensity,
                    source:
                        options.source ||
                        edgeSource(
                            options.side || null
                        ),
                    delay:
                        options.delay || 0,
                    scaleMultiplier:
                        options.scaleMultiplier || 1,
                    ghostHeavy:
                        options.ghostHeavy || false,
                    huge:
                        options.huge || false
                });


            root.appendChild(
                result.element
            );


            maxDuration =
                Math.max(
                    maxDuration,
                    result.totalDuration
                );
        }


        /* -------------------------------------------------------
           SINGLE
           ------------------------------------------------------- */

        if (type === "single") {

            addSource({
                scaleMultiplier:
                    preview ? 1.25 : 1
            });

        }


        /* -------------------------------------------------------
           SWEEP
           ------------------------------------------------------- */

        if (type === "sweep") {

            addSource({
                huge:
                    intensity !== "subtle",
                scaleMultiplier:
                    intensity === "jj"
                        ? randomBetween(1.2, 2.2)
                        : 1
            });


            if (
                chance(profile.streakChance)
            ) {
                addStreak(
                    root,
                    {
                        intensity,
                        huge:
                            intensity === "jj"
                    }
                );
            }

        }


        /* -------------------------------------------------------
           DOUBLE CATCH
           ------------------------------------------------------- */

        if (type === "double") {

            addSource({
                side: "left",
                scaleMultiplier:
                    preview ? 1.25 : 1
            });


            addSource({
                side: "right",
                delay:
                    randomBetween(80, 320),
                scaleMultiplier:
                    intensity === "jj"
                        ? randomBetween(1, 1.7)
                        : 1
            });

        }


        /* -------------------------------------------------------
           CONSTELLATION
           ------------------------------------------------------- */

        if (type === "constellation") {

            const count =
                intensity === "jj"
                    ? randomInt(4, 5)
                    : randomInt(2, 3);


            for (
                let i = 0;
                i < count;
                i += 1
            ) {

                addSource({
                    delay:
                        randomBetween(0, 500),
                    scaleMultiplier:
                        randomBetween(0.7, 1.25)
                });

            }

        }


        /* -------------------------------------------------------
           IMPACT
           ------------------------------------------------------- */

        if (type === "impact") {

            addSource({
                huge: true,
                scaleMultiplier:
                    intensity === "jj"
                        ? randomBetween(1.8, 3.2)
                        : randomBetween(1.2, 1.8)
            });


            if (
                chance(
                    intensity === "jj"
                        ? 0.85
                        : 0.35
                )
            ) {
                addFullFlash(
                    root,
                    {
                        intensity,
                        huge:
                            intensity === "jj"
                    }
                );
            }


            if (
                chance(profile.streakChance)
            ) {
                addStreak(
                    root,
                    {
                        intensity,
                        huge:
                            intensity === "jj"
                    }
                );
            }

        }


        /* -------------------------------------------------------
           CASCADE
           ------------------------------------------------------- */

        if (type === "cascade") {

            const count =
                randomInt(3, 6);


            for (
                let i = 0;
                i < count;
                i += 1
            ) {

                addSource({
                    delay:
                        i *
                        randomBetween(120, 310),

                    scaleMultiplier:
                        i === 0
                            ? randomBetween(1.5, 2.5)
                            : randomBetween(0.7, 1.5),

                    huge:
                        i === 0
                });

            }


            if (chance(0.7)) {
                addStreak(
                    root,
                    {
                        intensity,
                        delay: 120,
                        huge: true
                    }
                );
            }

        }


        /* -------------------------------------------------------
           GHOST STORM
           ------------------------------------------------------- */

        if (type === "ghoststorm") {

            const count =
                intensity === "jj"
                    ? randomInt(2, 4)
                    : randomInt(1, 2);


            for (
                let i = 0;
                i < count;
                i += 1
            ) {

                addSource({
                    delay:
                        randomBetween(0, 350),

                    ghostHeavy: true,

                    scaleMultiplier:
                        randomBetween(1, 1.8)
                });

            }

        }


        /* -------------------------------------------------------
           MAXIMUM J.J.
           ------------------------------------------------------- */

        if (type === "maximum") {

            const count =
                randomInt(4, 7);


            for (
                let i = 0;
                i < count;
                i += 1
            ) {

                addSource({
                    delay:
                        randomBetween(0, 850),

                    scaleMultiplier:
                        randomBetween(1.4, 3.6),

                    huge:
                        chance(0.65),

                    ghostHeavy:
                        chance(0.5)
                });

            }


            addFullFlash(
                root,
                {
                    intensity: "jj",
                    delay:
                        randomBetween(0, 220),
                    huge: true
                }
            );


            addStreak(
                root,
                {
                    intensity: "jj",
                    delay:
                        randomBetween(0, 180),
                    huge: true
                }
            );


            if (chance(0.7)) {
                addStreak(
                    root,
                    {
                        intensity: "jj",
                        delay:
                            randomBetween(220, 620),
                        huge: true
                    }
                );
            }


            maxDuration =
                Math.max(
                    maxDuration,
                    4200
                );
        }


        /* -------------------------------------------------------
           GENERAL EXTRAS
           ------------------------------------------------------- */

        if (
            type !== "maximum" &&
            chance(profile.fullFlashChance)
        ) {

            addFullFlash(
                root,
                {
                    intensity,
                    delay:
                        randomBetween(0, 280),
                    huge:
                        intensity === "jj" &&
                        chance(0.45)
                }
            );

        }


        return maxDuration;
    }


    /* =========================================================
       CHOOSE EVENT TYPE
       ========================================================= */

    function chooseEventType(
        intensity,
        preview = false
    ) {

        /*
          Preview intentionally demonstrates a more exciting
          example than the statistical average.
        */

        if (intensity === "jj") {
            return "constellation"; // hack
        }

        if (preview) {

            if (intensity === "cinematic") {
                return chance(0.5)
                    ? "impact"
                    : "double";
            }

            return "sweep";
        }

        return choose(
            PROFILES[intensity].eventTypes
        );
    }


    /* =========================================================
       PLAY EVENT
       ========================================================= */

    function playLensFlare({
        force = false,
        preview = false
    } = {}) {

        const settings =
            getSettings();


        if (
            !force &&
            !settings.lensFlare.enabled
        ) {
            return;
        }


        if (
            !force &&
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            return;
        }


        ensureStyles();


        const intensity =
            settings.lensFlare.intensity;


        const root =
            document.createElement("div");


        root.className =
            "wa-flare-event";


        root.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.appendChild(
            root
        );


        const type =
            chooseEventType(
                intensity,
                preview
            );


        const duration =
            buildEvent(
                root,
                intensity,
                type,
                preview
            );


        /*
          Leave enough time for delayed cascade elements
          to complete before removing the event.
        */

        window.setTimeout(() => {
            root.remove();
        }, Math.max(
            duration + 700,
            3000
        ));
    }


    /* =========================================================
       SCHEDULER
       ========================================================= */

    function getDelay(frequency) {
        const ranges = {

            rare: [
                90000,
                180000
            ],

            occasional: [
                42000,
                95000
            ],

            chaotic: [
                12000,
                32000
            ]

        };


        const range =
            ranges[frequency] ||
            ranges.occasional;


        return randomBetween(
            range[0],
            range[1]
        );
    }


    function scheduleNextFlare() {
        clearTimeout(
            flareTimer
        );


        const settings =
            getSettings();


        if (
            !settings.lensFlare.enabled
        ) {
            return;
        }


        if (
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            return;
        }


        flareTimer =
            window.setTimeout(() => {

                playLensFlare();

                scheduleNextFlare();

            }, getDelay(
                settings.lensFlare.frequency
            ));
    }


    function restartFlareScheduler() {
        clearTimeout(
            flareTimer
        );

        scheduleNextFlare();
    }


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.WASettings = {

        get() {
            return clone(
                getSettings()
            );
        },


        set(partial) {
            return clone(
                setSettings(partial)
            );
        },


        reset() {
            resetSettings();

            return clone(
                getSettings()
            );
        },


        previewLensFlare() {
            playLensFlare({
                force: true,
                preview: true
            });
        }

    };


    /* =========================================================
       START
       ========================================================= */

    function init() {
        ensureStyles();

        scheduleNextFlare();
    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );

    }

    else {
        init();
    }

})();
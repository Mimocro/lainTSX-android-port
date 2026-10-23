// Default key bindings from read_key_mappings in lainTSX/src/engine.ts
(() => {
    const LAYOUT_KEY = "lainTSX-touch-layout";
    const OPACITY_KEY = "lainTSX-touch-opacity";
    const LONG_PRESS_MS = 800;
    const S = 56, G = 6;
    const buttons = [
        { key: "ArrowUp",    label: "▲", left: 20 + S + G, bottom: 20 + 2 * (S + G) },
        { key: "ArrowLeft",  label: "◀", left: 20,         bottom: 20 + S + G },
        { key: "ArrowRight", label: "▶", left: 20 + 2 * (S + G), bottom: 20 + S + G },
        { key: "ArrowDown",  label: "▼", left: 20 + S + G, bottom: 20 },
        { key: "d", label: "△", right: 20 + S + G, bottom: 20 + 2 * (S + G) },
        { key: "s", label: "□", right: 20 + 2 * (S + G), bottom: 20 + S + G },
        { key: "x", label: "○", right: 20,         bottom: 20 + S + G },
        { key: "z", label: "✕", right: 20 + S + G, bottom: 20 },
        { key: "w", label: "L1", left: 20,  top: 16, cls: "shoulder" },
        { key: "e", label: "L2", left: 90,  top: 16, cls: "shoulder" },
        { key: "q", label: "R2", right: 90, top: 16, cls: "shoulder" },
        { key: "r", label: "R1", right: 20, top: 16, cls: "shoulder" },
        { key: "c", label: "SEL", left: "calc(50% - 70px)", bottom: 12, cls: "small" },
        { key: "v", label: "START", left: "calc(50% + 6px)", bottom: 12, cls: "small" },
    ];

    const send = (type, key) => window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
    const px = (v) => (typeof v === "number" ? v + "px" : v);
    const load = (k, fallback) => {
        try {
            return JSON.parse(localStorage.getItem(k)) ?? fallback;
        } catch {
            return fallback;
        }
    };

    let layout = load(LAYOUT_KEY, {});
    let editing = false;

    const pad = document.createElement("div");
    pad.id = "touch-pad";

    const place = (el, b) => {
        const pos = layout[b.key];
        for (const side of ["left", "right", "top", "bottom"]) {
            el.style[side] = pos ? "" : b[side] !== undefined ? px(b[side]) : "";
        }
        if (pos) {
            el.style.left = pos.x * 100 + "vw";
            el.style.top = pos.y * 100 + "vh";
        }
    };

    const elements = buttons.map((b) => {
        const el = document.createElement("button");
        el.textContent = b.label;
        if (b.cls) el.className = b.cls;
        place(el, b);

        let held = false;
        let drag = null;

        const release = () => {
            if (!held) return;
            held = false;
            el.classList.remove("on");
            send("keyup", b.key);
        };

        el.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            if (editing) {
                el.setPointerCapture(e.pointerId);
                const r = el.getBoundingClientRect();
                drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
                return;
            }
            if (held) return;
            held = true;
            el.classList.add("on");
            send("keydown", b.key);
        });
        el.addEventListener("pointermove", (e) => {
            if (!drag) return;
            layout[b.key] = {
                x: (e.clientX - drag.dx) / window.innerWidth,
                y: (e.clientY - drag.dy) / window.innerHeight,
            };
            place(el, b);
        });
        const up = (e) => {
            e.preventDefault();
            if (drag) {
                drag = null;
                localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
                return;
            }
            release();
        };
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
        el.addEventListener("pointerleave", (e) => {
            if (!drag) up(e);
        });
        el.addEventListener("contextmenu", (e) => e.preventDefault());
        pad.appendChild(el);
        return { el, b, release };
    });

    const panel = document.createElement("div");
    panel.id = "touch-edit";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0.05";
    slider.max = "1";
    slider.step = "0.05";
    panel.appendChild(slider);

    const setOpacity = (v) => {
        pad.style.opacity = v;
        slider.value = v;
    };
    setOpacity(load(OPACITY_KEY, 1));
    slider.addEventListener("input", () => {
        pad.style.opacity = slider.value;
        localStorage.setItem(OPACITY_KEY, slider.value);
    });

    const gear = document.createElement("button");
    gear.id = "touch-gear";
    gear.textContent = "⚙";

    const setEditing = (on) => {
        editing = on;
        for (const { release } of elements) release();
        pad.classList.toggle("editing", on);
        panel.classList.toggle("on", on);
        gear.classList.toggle("on", on);
    };

    const reset = () => {
        layout = {};
        localStorage.removeItem(LAYOUT_KEY);
        localStorage.removeItem(OPACITY_KEY);
        for (const { el, b } of elements) place(el, b);
        setOpacity(1);
    };

    let pressTimer = null;
    gear.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        pressTimer = setTimeout(() => {
            pressTimer = null;
            reset();
        }, LONG_PRESS_MS);
    });
    gear.addEventListener("pointerup", (e) => {
        e.preventDefault();
        if (pressTimer === null) return;
        clearTimeout(pressTimer);
        pressTimer = null;
        setEditing(!editing);
    });
    gear.addEventListener("pointercancel", () => {
        clearTimeout(pressTimer);
        pressTimer = null;
    });
    gear.addEventListener("contextmenu", (e) => e.preventDefault());

    document.body.append(pad, panel, gear);
})();

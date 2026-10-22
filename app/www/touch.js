// Default key bindings from read_key_mappings in lainTSX/src/engine.ts
(() => {
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

    const pad = document.createElement("div");
    pad.id = "touch-pad";

    for (const b of buttons) {
        const el = document.createElement("button");
        el.textContent = b.label;
        if (b.cls) el.className = b.cls;
        for (const side of ["left", "right", "top", "bottom"]) {
            if (b[side] !== undefined) el.style[side] = px(b[side]);
        }

        let held = false;
        const down = (e) => {
            e.preventDefault();
            if (held) return;
            held = true;
            el.classList.add("on");
            send("keydown", b.key);
        };
        const up = (e) => {
            e.preventDefault();
            if (!held) return;
            held = false;
            el.classList.remove("on");
            send("keyup", b.key);
        };
        el.addEventListener("pointerdown", down);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
        el.addEventListener("pointerleave", up);
        el.addEventListener("contextmenu", (e) => e.preventDefault());
        pad.appendChild(el);
    }

    document.body.appendChild(pad);
})();

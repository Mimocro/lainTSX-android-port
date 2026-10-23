(() => {
    const media = new Set();
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
        media.add(this);
        return play.apply(this, arguments);
    };

    let suspended = [];
    window.lainPause = () => {
        suspended = [...media].filter((m) => !m.paused);
        suspended.forEach((m) => m.pause());
    };
    window.lainResume = () => {
        suspended.forEach((m) => m.play().catch(() => {}));
        suspended = [];
    };
})();

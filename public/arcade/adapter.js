// Arcane cabinet integration. Loaded before each game's own scripts.
(() => {
    const forwarded = new WeakSet();
    const held = new Map();
    const specials = { 8:'Backspace',9:'Tab',13:'Enter',16:'ShiftLeft',17:'ControlLeft',18:'AltLeft',27:'Escape',32:'Space',37:'ArrowLeft',38:'ArrowUp',39:'ArrowRight',40:'ArrowDown' };
    function send(type, init) {
        const e = new KeyboardEvent(type, init);
        forwarded.add(e);
        (document.activeElement || document.body).dispatchEvent(e);
    }
    function key(e) {
        if (forwarded.has(e)) return;
        const vk = e.keyCode;
        // The original Invaders menu is pointer-only; expose its existing Play action.
        if (vk === 13 && e.type === 'keydown' && !e.repeat && location.pathname.includes('/space_Invaders/')) {
            const play = document.getElementById('play');
            if (play) { e.preventDefault(); e.stopImmediatePropagation(); play.click(); return; }
        }
        const code = specials[vk] || (vk >= 65 && vk <= 90 ? 'Key' + String.fromCharCode(vk) : vk >= 48 && vk <= 57 ? 'Digit' + (vk - 48) : e.code);
        const init = { key: specials[vk]?.replace('Left','').replace('Right','') || e.key, code, keyCode: vk, which: vk, shiftKey:e.shiftKey, ctrlKey:e.ctrlKey, altKey:e.altKey, repeat:e.repeat, bubbles:true, cancelable:true };
        // Use the actual arrow key name, not the modifier-side normalization.
        if (vk >= 37 && vk <= 40) init.key = specials[vk];
        if (vk === 32) init.key = ' ';
        e.stopImmediatePropagation();
        if ([32,37,38,39,40].includes(vk)) e.preventDefault();
        if (e.type === 'keydown') held.set(vk, init); else held.delete(vk);
        send(e.type, init);
    }
    window.addEventListener('keydown', key, true);
    window.addEventListener('keyup', key, true);
    window.addEventListener('blur', () => { for (const init of held.values()) send('keyup', {...init, repeat:false}); held.clear(); });
    window.addEventListener('load', () => {
        window.parent.postMessage('arcade-loaded', location.origin);
        window.focus();
    });
    window.addEventListener('error', () => window.parent.postMessage('arcade-failed', location.origin));
})();

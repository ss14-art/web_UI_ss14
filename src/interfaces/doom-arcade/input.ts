import { nativeKeyCode } from '$lib/nativeKeys';

/** SDL consumes DOM code (physical key), which the embedded CEF host mislabels.
 * Normalize only arcade input; never relay movement into SS14's native bindings.
 */
export function installArcadeInput(canvas: HTMLCanvasElement, playing: () => boolean): () => void {
    const forwarded = new WeakSet<Event>();
    const held = new Map<number, KeyboardEventInit>();
    const special: Record<number, string> = {
        8: 'Backspace', 9: 'Tab', 13: 'Enter', 16: 'ShiftLeft', 17: 'ControlLeft',
        18: 'AltLeft', 32: 'Space', 37: 'ArrowLeft', 38: 'ArrowUp',
        39: 'ArrowRight', 40: 'ArrowDown',
    };
    function send(type: string, init: KeyboardEventInit): void {
        const event = new KeyboardEvent(type, init);
        forwarded.add(event);
        canvas.dispatchEvent(event);
    }
    function release(): void {
        for (const init of held.values()) send('keyup', { ...init, repeat: false });
        held.clear();
    }
    function key(event: KeyboardEvent): void {
        if (forwarded.has(event) || !playing() || document.activeElement !== canvas) return;
        const code = special[event.keyCode] ?? nativeKeyCode(event);
        if (!code) return;
        const init: KeyboardEventInit = {
            key: event.key, code, keyCode: event.keyCode, which: event.keyCode,
            shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, altKey: event.altKey,
            metaKey: event.metaKey, repeat: event.repeat, bubbles: true, cancelable: true,
        };
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.type === 'keydown') held.set(event.keyCode, init);
        else held.delete(event.keyCode);
        send(event.type, init);
    }
    window.addEventListener('keydown', key, true);
    window.addEventListener('keyup', key, true);
    window.addEventListener('blur', release);
    canvas.addEventListener('blur', release);
    return () => {
        release();
        window.removeEventListener('keydown', key, true);
        window.removeEventListener('keyup', key, true);
        window.removeEventListener('blur', release);
        canvas.removeEventListener('blur', release);
    };
}

import { novaBridge } from './novaBridge';

/** CEF receives SDL scancodes as Windows native scancodes from the host. Its DOM
 * `code` can therefore be wrong (SDL F1=58 becomes Windows CapsLock). The host's
 * WindowsKeyCode is mapped explicitly from Robust.Key and remains authoritative.
 * Deliberately use keyCode here, only at this embedded-browser compatibility boundary.
 */
export function nativeKeyCode(event: KeyboardEvent): string {
    const vk = event.keyCode;
    if (vk >= 112 && vk <= 135) return `F${vk - 111}`;
    if (vk >= 65 && vk <= 90) return `Key${String.fromCharCode(vk)}`;
    if (vk >= 48 && vk <= 57) return `Digit${vk - 48}`;
    const special: Record<number, string> = {
        27: 'Escape', 192: 'Backquote', 219: 'BracketLeft', 221: 'BracketRight',
        186: 'Semicolon', 222: 'Quote', 188: 'Comma', 190: 'Period',
        191: 'Slash', 220: 'Backslash', 189: 'Minus', 187: 'Equal',
        45: 'Insert', 46: 'Delete', 36: 'Home', 35: 'End', 33: 'PageUp', 34: 'PageDown',
    };
    // Do not reinterpret modifiers, Tab, Space or Enter using their broken scancode.
    if (vk) return special[vk] ?? '';
    return event.code; // Non-CEF test/preview environments without a virtual-key value.
}

/** Keep text editing/navigation in CEF; dispatch physical shortcuts through the game's own bindings. */
export function installNativeKeys(): () => void {
    const handler = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.repeat || event.isComposing) return;
        const target = event.target as HTMLElement | null;
        const editing = target?.closest('input, textarea, select, [contenteditable="true"]');
        const code = nativeKeyCode(event);
        const global = /^(F([1-9]|1[0-9]|2[0-4])|Backquote)$/.test(code);
        if (editing && !global) return;
        if (!global && !/^(Key[A-Z]|Digit[0-9]|Escape|BracketLeft|BracketRight|Semicolon|Quote|Comma|Period|Slash|Backslash|Minus|Equal|Insert|Delete|Home|End|PageUp|PageDown)$/.test(code)) return;
        event.preventDefault();
        const modifiers = Number(event.shiftKey) | Number(event.ctrlKey) << 1 | Number(event.altKey) << 2 | Number(event.metaKey) << 3;
        void novaBridge.invoke('native-key', { code, modifiers }).catch(() => {});
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
}

// Pinned, local EmulatorJS 4.2.3 + mGBA. No native filesystem or console access.
window.EJS_player = '#game';
window.EJS_core = 'gba';
window.EJS_gameUrl = './firered.gba';
window.EJS_pathtodata = './data/';
window.EJS_gameName = 'Arcane-FireRed';
window.EJS_gameID = 1;
window.EJS_startOnLoaded = true;
window.EJS_threads = false;
window.EJS_forceLegacyCores = true;
// EmulatorJS settings stay local to this embedded page. SRAM itself is persisted
// by the native client bridge, not IndexedDB or the browser profile.
window.EJS_disableDatabases = true;
window.EJS_disableLocalStorage = true;
window.EJS_disableAutoLang = false; // 4.2.3 loader: false prevents automatic locale fetch.
window.EJS_language = 'en-US';
window.EJS_volume = 0.4;
window.EJS_defaultControls = {0: {
    0:{value:'x'}, 8:{value:'z'}, 2:{value:'shift'}, 3:{value:'enter'},
    4:{value:'up arrow'}, 5:{value:'down arrow'}, 6:{value:'left arrow'}, 7:{value:'right arrow'},
    10:{value:'a'}, 11:{value:'s'}
},1:{},2:{},3:{}};
window.EJS_Buttons = {saveState:false,loadState:false,saveSavFiles:false,loadSavFiles:false,
    netplay:false,fullscreen:false,screenshot:false,screenRecord:false,cacheManager:false};
const SAVE_INTERVAL_MS = 60_000;
const MAX_SAVE_BYTES = 1_048_576;
let initialSave = null;
let saveTimer;
let savePending = false;
let saveRequest = 0;
const pendingFlushIds = [];

const bootTimeout = setTimeout(() => parent.postMessage('arcade-failed', location.origin), 60000);

function decodeSave(encoded) {
    if (typeof encoded !== 'string' || encoded.length === 0 || encoded.length > 1_400_000) return null;
    try {
        const binary = atob(encoded);
        if (binary.length === 0 || binary.length > MAX_SAVE_BYTES) return null;
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    } catch { return null; }
}

function encodeSave(bytes) {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000)
        binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
    return btoa(binary);
}

function applyInitialSave() {
    const save = initialSave;
    initialSave = null;
    if (!save) {
        parent.postMessage({type:'arcade-save-load-status', loaded:false, bytes:0}, location.origin);
        return;
    }
    try {
        const manager = window.EJS_emulator.gameManager;
        const path = manager.getSaveFilePath();
        if (!path || save.length > MAX_SAVE_BYTES) throw new Error('Invalid SRAM path or size.');
        manager.FS.writeFile(path, save);
        manager.loadSaveFiles();
        parent.postMessage({type:'arcade-save-load-status', loaded:true, bytes:save.length}, location.origin);
    } catch (error) {
        console.warn('Could not load the local FireRed save', error);
        parent.postMessage({type:'arcade-save-error'}, location.origin);
    }
}

function collectSave(requestId) {
    if (savePending) {
        if (requestId) pendingFlushIds.push(requestId);
        return;
    }
    try {
        const bytes = window.EJS_emulator?.gameManager?.getSaveFile();
        if (!bytes || bytes.length === 0 || bytes.length > MAX_SAVE_BYTES) {
            parent.postMessage({type:'arcade-save-error'}, location.origin);
            if (requestId) parent.postMessage({type:'arcade-save-ack', requestId, saved:false}, location.origin);
            return;
        }
        savePending = true;
        const id = requestId ?? `autosave-${++saveRequest}`;
        parent.postMessage({type:'arcade-save-update', requestId:id, save:encodeSave(bytes)}, location.origin);
    } catch (error) {
        console.warn('Could not read FireRed SRAM', error);
        parent.postMessage({type:'arcade-save-error'}, location.origin);
        if (requestId) parent.postMessage({type:'arcade-save-ack', requestId, saved:false}, location.origin);
        for (const pendingId of pendingFlushIds.splice(0))
            parent.postMessage({type:'arcade-save-ack', requestId:pendingId, saved:false}, location.origin);
    }
}

window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || !event.data) return;
    if (event.data.type === 'arcade-load-save') {
        initialSave = decodeSave(event.data.save);
        if (event.data.save !== null && initialSave === null) {
            parent.postMessage({type:'arcade-save-error'}, location.origin);
            parent.postMessage('arcade-failed', location.origin);
            return;
        }
        const script = document.createElement('script');
        script.src = './data/loader.js';
        script.onerror = () => { clearTimeout(bootTimeout); parent.postMessage('arcade-failed', location.origin); };
        document.head.appendChild(script);
    } else if (event.data.type === 'arcade-load-save-error') {
        clearTimeout(bootTimeout);
        parent.postMessage('arcade-failed', location.origin);
    } else if (event.data.type === 'arcade-flush-save' && typeof event.data.requestId === 'string') {
        collectSave(event.data.requestId);
    } else if (event.data.type === 'arcade-save-result' && typeof event.data.requestId === 'string') {
        savePending = false;
        if (event.data.requestId.startsWith('flush-'))
            parent.postMessage({type:'arcade-save-ack', requestId:event.data.requestId, saved:event.data.saved === true}, location.origin);
        for (const requestId of pendingFlushIds.splice(0))
            parent.postMessage({type:'arcade-save-ack', requestId, saved:event.data.saved === true}, location.origin);
    }
});

window.EJS_onGameStart = () => {
    clearTimeout(bootTimeout);
    applyInitialSave();
    parent.postMessage('arcade-loaded', location.origin);
    saveTimer = setInterval(() => collectSave(), SAVE_INTERVAL_MS);
    setTimeout(() => collectSave(), 3000);
};

parent.postMessage({type:'arcade-load-save-request'}, location.origin);
window.addEventListener('pagehide', () => {
    clearTimeout(bootTimeout);
    clearInterval(saveTimer);
    collectSave();
}, {once:true});

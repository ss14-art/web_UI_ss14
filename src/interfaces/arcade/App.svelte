<script lang="ts">
    import { onMount } from 'svelte';
    import { novaBridge } from '$lib/novaBridge';
    import { faPlay, faRightFromBracket, faRotateRight } from '@fortawesome/free-solid-svg-icons';
    import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
    type State = { game: string; title: string; start: string; close: string; loading: string; ready: string; failed: string; retry: string; controls: string };
    const games = ['asteroids', 'flappy_bird', 'pacman', 'prince_of_persia', 'snake_game', 'space_Invaders', 'nu_pogodi', 'firered'];
    let state = $state<State | null>(null);
    let phase = $state<'idle' | 'loading' | 'playing' | 'failed'>('idle');
    let saveLoadFailed = $state(false);
    let saveError = $state(false);
    let frame = $state<HTMLIFrameElement>();
    let mounted = true;
    let timer: number | undefined;
    let saveTask: Promise<boolean> = Promise.resolve(true);
    let flushSequence = 0;
    const flushWaiters = new Map<string, (saved: boolean) => void>();
    function fail() { if (mounted) { phase = 'failed'; window.clearTimeout(timer); } }
    function play() {
        if (!state) return;
        phase = 'loading';
        timer = window.setTimeout(fail, 20000);
    }
    function persistFireRedSave(save: string, requestId?: string) {
        const task = saveTask.then(async () => {
            const result = await novaBridge.invoke('firered-save-write', { save });
            const saved = result.success === true;
            if (saved) saveError = false;
            return saved;
        }).catch(error => {
            console.error('FireRed save: bridge write did not complete.', error);
            return false;
        });
        saveTask = task;
        void task.then(saved => {
            if (requestId && frame?.contentWindow) {
                frame.contentWindow.postMessage({ type: 'arcade-save-result', requestId, saved }, location.origin);
            }
        });
        return task;
    }

    function requestFireRedFlush(): Promise<boolean> {
        if (!frame?.contentWindow || phase !== 'playing') return saveTask;
        const requestId = `flush-${Date.now()}-${++flushSequence}`;
        return new Promise(resolve => {
            const timeout = window.setTimeout(() => {
                flushWaiters.delete(requestId);
                resolve(false);
            }, 12000);
            flushWaiters.set(requestId, saved => { window.clearTimeout(timeout); resolve(saved); });
            frame?.contentWindow?.postMessage({ type: 'arcade-flush-save', requestId }, location.origin);
        });
    }

    async function close() {
        if (state?.game === 'firered' && !await requestFireRedFlush()) {
            saveError = true;
            console.error('FireRed save: close cancelled because the final local save was not confirmed.');
            return;
        }
        try { await novaBridge.invoke('doom-close'); } catch { fail(); }
    }
    onMount(() => {
        void novaBridge.invoke('doom-get-state').then((data: State) => {
            if (!mounted) return;
            if (!games.includes(data.game)) { fail(); return; }
            state = data;
            if (data.game === 'nu_pogodi') play();
        }).catch(fail);
        const message = (event: MessageEvent) => {
            if (event.origin !== location.origin || event.source !== frame?.contentWindow) return;
            if (event.data?.type === 'arcade-load-save-request' && state?.game === 'firered') {
                void novaBridge.invoke('firered-save-load').then((result: { save: string | null }) => {
                    if (event.source === frame?.contentWindow)
                        frame.contentWindow.postMessage({ type: 'arcade-load-save', save: result.save }, location.origin);
                }).catch(error => {
                    saveLoadFailed = true;
                    phase = 'failed';
                    console.error('FireRed save: local save load failed; refusing to start without checking existing progress.', error);
                    frame?.contentWindow?.postMessage({ type: 'arcade-load-save-error' }, location.origin);
                });
                return;
            }
            if (event.data?.type === 'arcade-save-update' && state?.game === 'firered' &&
                typeof event.data.save === 'string' && event.data.save.length > 0 && event.data.save.length <= 1_400_000) {
                void persistFireRedSave(event.data.save, typeof event.data.requestId === 'string' ? event.data.requestId : undefined);
                return;
            }
            if (event.data?.type === 'arcade-save-ack' && typeof event.data.requestId === 'string') {
                flushWaiters.get(event.data.requestId)?.(event.data.saved === true);
                flushWaiters.delete(event.data.requestId);
                return;
            }
            if (event.data?.type === 'arcade-save-error') {
                saveError = true;
                console.error('FireRed save: the emulator could not read its SRAM; autosave/close save is unavailable.');
                return;
            }
            if (event.data?.type === 'arcade-save-load-status' && state?.game === 'firered') {
                void novaBridge.invoke('firered-save-load-status', {
                    loaded: event.data.loaded === true ? 'true' : 'false',
                    bytes: Number.isInteger(event.data.bytes) ? event.data.bytes : 0,
                }).catch(error => console.error('FireRed save: could not report load status to the client.', error));
                return;
            }
            if (event.data === 'arcade-loaded' && phase === 'loading') {
                window.clearTimeout(timer); phase = 'playing'; frame?.contentWindow?.focus();
            }
            if (event.data === 'arcade-failed') fail();
        };
        window.addEventListener('message', message);
        return () => { mounted = false; window.clearTimeout(timer); window.removeEventListener('message', message); };
    });
</script>

{#snippet icon(def: IconDefinition)}
    <svg viewBox="0 0 {def.icon[0]} {def.icon[1]}" aria-hidden="true">{#each typeof def.icon[4] === 'string' ? [def.icon[4]] : def.icon[4] as path}<path fill="currentColor" d={path}/>{/each}</svg>
{/snippet}

<main class="cabinet" data-game={state?.game}>
    <section class="screen" aria-label={state?.title ?? ''}>
        {#if state && (phase === 'loading' || phase === 'playing')}
            <iframe bind:this={frame} title={state.title} src="/dist/arcade/{state.game}/index.html" sandbox="allow-scripts allow-same-origin" allow="autoplay" onerror={fail}></iframe>
        {/if}
        {#if phase !== 'playing'}
            <div class="marquee">
                <div class="ornament" aria-hidden="true"></div>
                <h1>{state?.title ?? ''}</h1>
                <p role="status">{phase === 'failed' ? state?.failed : phase === 'loading' || !state ? state?.loading : state.ready}</p>
                {#if state && phase === 'idle'}<button onclick={play}>{@render icon(faPlay)}{state.start}</button>{/if}
                {#if phase === 'failed' && !saveLoadFailed}<button onclick={() => { if (state) play(); else location.reload(); }}>{@render icon(faRotateRight)}{state?.retry ?? ''}</button>{/if}
            </div>
        {/if}
    </section>
    {#if state?.game !== 'nu_pogodi'}
        <footer><span>{saveError ? 'Save failed — progress is not confirmed on disk.' : state?.controls ?? ''}</span><button onclick={close}>{@render icon(faRightFromBracket)}{state?.close ?? ''}</button></footer>
    {/if}
</main>

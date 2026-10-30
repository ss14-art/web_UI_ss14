<script lang="ts">
    import { onMount } from 'svelte';
    import { novaBridge } from '$lib/novaBridge';
    import { installArcadeInput } from './input';
    import { faPlay, faRightFromBracket, faRotateRight, faVolumeHigh, faVolumeXmark } from '@fortawesome/free-solid-svg-icons';
    import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

    interface Labels { start: string; close: string; loading: string; ready: string; failed: string; retry: string; controls: string; audio: string; muted: string }
    interface DoomModule {
        noInitialRun: boolean;
        canvas: HTMLCanvasElement;
        preRun: () => void;
        locateFile: (name: string) => string;
        onRuntimeInitialized: () => void;
        printErr: (...text: string[]) => void;
        print: (...text: string[]) => void;
        setStatus: (status: string) => void;
        onAbort: (reason: unknown) => void;
        onExit: (status: number) => void;
    }
    let labels = $state<Labels | null>(null);
    let phase = $state<'loading' | 'idle' | 'starting' | 'playing' | 'failed'>('loading');
    let sound = $state(true);
    let canvas: HTMLCanvasElement;
    let active = true;
    let loadTimer: number | undefined;
    const gameWindow = window as Window & { Module?: DoomModule; callMain?: (args: string[]) => void };

    function fail(reason: unknown = 'runtime-failed'): void {
        if (!active || phase === 'failed') return;
        phase = 'failed';
        window.clearTimeout(loadTimer);
        void novaBridge.invoke('doom-runtime-error', { message: String(reason).slice(0, 1000) }).catch(() => {});
    }

    function start(): void {
        if (!labels || phase !== 'idle') return;
        phase = 'starting';
        const currentCanvas = canvas;
        const module: DoomModule = {
            noInitialRun: true,
            canvas: currentCanvas,
            locateFile: name => `/assets/doom/${name}`,
            preRun: () => {
                const fs = (gameWindow.Module as DoomModule & { FS: { createPreloadedFile: (...args: unknown[]) => void } }).FS;
                fs.createPreloadedFile('', 'doom1.wad', '/assets/doom/doom1.wad', true, true);
                fs.createPreloadedFile('', 'default.cfg', '/assets/doom/default.cfg', true, true);
            },
            onRuntimeInitialized: () => {
                if (!active || gameWindow.Module !== module) return;
                try {
                    const args = ['-iwad', 'doom1.wad', '-window', '-nogui', '-nomouse', '-config', 'default.cfg'];
                    if (!sound) args.push('-nosound');
                    else args.push('-nomusic');
                    if (!gameWindow.callMain) throw new Error('DOOM entry point unavailable');
                    gameWindow.callMain(args);
                    if (phase !== 'failed') {
                        phase = 'playing';
                        window.clearTimeout(loadTimer);
                        currentCanvas.focus();
                    }
                } catch (error) { fail(error); }
            },
            // WAD compatibility warnings are not fatal. Emscripten reports fatal
            // failures through onAbort or the callMain exception boundary.
            printErr: (...text) => console.warn('[DOOM]', ...text),
            print: () => {},
            setStatus: () => {},
            onAbort: fail,
            onExit: () => { void close(); },
        };
        gameWindow.Module = module;
        const script = document.createElement('script');
        script.src = '/assets/doom/websockets-doom.js';
        script.onerror = () => fail('runtime-script-load-failed');
        document.body.appendChild(script);
        loadTimer = window.setTimeout(() => { if (phase === 'starting') fail('runtime-start-timeout'); }, 30000);
    }

    async function close(): Promise<void> {
        try { await novaBridge.invoke('doom-close'); }
        catch { fail(); }
    }

    function retry(): void { window.location.reload(); }

    onMount(() => {
        active = true;
        void novaBridge.invoke('doom-get-state').then((state: Labels) => {
            if (!active) return;
            labels = state;
            phase = 'idle';
        }).catch(fail);
        const removeInput = installArcadeInput(canvas, () => phase === 'playing');
        return () => { active = false; window.clearTimeout(loadTimer); removeInput(); };
    });
</script>

{#snippet icon(definition: IconDefinition)}
    <svg viewBox="0 0 {definition.icon[0]} {definition.icon[1]}" aria-hidden="true" focusable="false">
        {#each typeof definition.icon[4] === 'string' ? [definition.icon[4]] : definition.icon[4] as path}<path fill="currentColor" d={path} />{/each}
    </svg>
{/snippet}

<main class="doom-shell">
    <section class="game-screen" aria-label="DOOM">
        <canvas id="canvas" bind:this={canvas} tabindex="0" oncontextmenu={event => event.preventDefault()}></canvas>
        {#if phase !== 'playing'}
            <div class="overlay glass" role="status">
                <div class="doom-mark" aria-hidden="true">DOOM</div>
                {#if phase === 'failed'}
                    <p>{labels?.failed ?? ''}</p>
                    <button type="button" onclick={retry}>{@render icon(faRotateRight)}<span>{labels?.retry ?? ''}</span></button>
                {:else if phase === 'idle'}
                    <p>{labels?.ready ?? ''}</p>
                    <button type="button" class="primary" onclick={start}>{@render icon(faPlay)}<span>{labels?.start ?? ''}</span></button>
                    <button type="button" aria-pressed={!sound} onclick={() => sound = !sound}>
                        {@render icon(sound ? faVolumeHigh : faVolumeXmark)}<span>{sound ? labels?.audio : labels?.muted}</span>
                    </button>
                {:else}
                    <p>{labels?.loading ?? ''}</p>
                {/if}
            </div>
        {/if}
    </section>
    <footer class="toolbar glass">
        <span>{labels?.controls ?? ''}</span>
        <button type="button" onclick={close} aria-label={labels?.close ?? ''}>
            {@render icon(faRightFromBracket)}<span>{labels?.close ?? ''}</span>
        </button>
    </footer>
</main>

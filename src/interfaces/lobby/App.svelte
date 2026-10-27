<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { novaBridge } from '$lib/novaBridge';
    import { installNativeKeys } from '$lib/nativeKeys';
    import Chat from './Chat.svelte';
    import RichText from './RichText.svelte';
    import ActionButton from './ActionButton.svelte';
    import Icon from './Icon.svelte';
    import type { LobbyAction, LobbyBackground, LobbyState } from './types';

    let state = $state<LobbyState | null>(null);
    let background = $state<LobbyBackground | null>(null);
    let backgroundUrl = $state('');
    let pending = $state(false);
    let error = $state('');
    let license = $state<string | null>(null);
    let preview: HTMLDivElement;
    let active = false;
    let ready = false;
    let mediaGeneration = 0;
    let selectedMedia = '';
    let lastRect = '';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    async function updateBackground(value: LobbyBackground | null): Promise<void> {
        const url = value ? (reducedMotion.matches ? value.poster ?? value.url : value.url) : '';
        if (url === selectedMedia) return;
        selectedMedia = url;
        const generation = ++mediaGeneration;
        if (!value) { background = null; backgroundUrl = ''; return; }
        const image = new Image();
        try {
            image.src = url;
            await image.decode();
            if (!active || generation !== mediaGeneration) return;
            background = value;
            backgroundUrl = url;
        } catch {
            if (active && generation === mediaGeneration) error = state?.errorLabel ?? '';
        }
    }

    async function accept(value: LobbyState): Promise<void> {
        if (!active || value.version !== 1 || (state && state.revision >= value.revision)) return;
        state = value;
        void updateBackground(value.background);
        await tick();
        reportPreview();
    }

    function reportPreview(): void {
        if (!active || !ready || !state?.visible || !preview) return;
        const rect = preview.getBoundingClientRect();
        const data = { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        const signature = JSON.stringify(data);
        if (signature === lastRect) return;
        lastRect = signature;
        void novaBridge.invoke('lobby-layout', data).catch(() => { lastRect = ''; });
    }

    async function run(action: LobbyAction): Promise<void> {
        if (!action.enabled || pending) return;
        pending = true;
        error = '';
        try { await novaBridge.invoke('lobby-action', { action: action.id }); }
        catch { if (active) error = state?.errorLabel ?? ''; }
        finally { pending = false; }
    }

    async function setVisible(visible: boolean): Promise<void> {
        try { await novaBridge.invoke('lobby-set-ui-visible', { visible: visible ? 1 : 0 }); }
        catch { if (active) error = state?.errorLabel ?? ''; }
    }

    async function showLicense(): Promise<void> {
        if (!background?.license) return;
        try {
            const response = await fetch(background.license);
            if (!response.ok) throw new Error();
            const text = await response.text();
            if (active) license = text;
        } catch { if (active) error = state?.errorLabel ?? ''; }
    }

    onMount(() => {
        active = true;
        const unsubscribe = novaBridge.subscribe('lobby-state', (value: LobbyState) => { void accept(value); });
        void (async () => {
            try {
                await accept(await novaBridge.invoke('lobby-get-state'));
                await tick();
                await novaBridge.invoke('lobby-ready');
                ready = true;
                reportPreview();
            } catch { if (active) error = state?.errorLabel ?? ''; }
        })();
        const observer = new ResizeObserver(reportPreview);
        observer.observe(document.documentElement);
        const keydown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.repeat) return;
            if (license !== null) { license = null; event.preventDefault(); }
            else if (state && !state.visible) { event.preventDefault(); void setVisible(true); }
        };
        const motionChanged = () => { selectedMedia = ''; void updateBackground(state?.background ?? null); };
        window.addEventListener('keydown', keydown);
        const removeNativeKeys = installNativeKeys();
        reducedMotion.addEventListener('change', motionChanged);
        return () => {
            active = false; ready = false; mediaGeneration++;
            observer.disconnect(); unsubscribe();
            removeNativeKeys();
            window.removeEventListener('keydown', keydown);
            reducedMotion.removeEventListener('change', motionChanged);
        };
    });
</script>

<main class="lobby" class:hidden-ui={state && !state.visible} style:--right={`${state?.rightWidth ?? 400}px`}>
    <section class="scene" aria-label={state?.title ?? ''}>
        {#if backgroundUrl}
            {#key backgroundUrl}<img class="background" src={backgroundUrl} alt="" style:object-position={`${background?.x ?? 50}% ${background?.y ?? 50}%`} />{/key}
        {/if}
        {#if state?.visible}
            <section class="round glass" aria-label={state.roundTitle}>
                <h2>{state.roundTitle}</h2><strong>{state.round}</strong>
                <div>{state.players}</div><div>{state.lobbyPlayers}</div>
                {#if state.readyPlayers}<div>{state.readyPlayers}</div>{/if}
            </section>
            <div class="left-dock">
                <button class="hide-button glass" type="button" title={state.hideLabel} aria-label={state.hideLabel} onclick={() => setVisible(false)}><Icon name="eye-slash" /></button>
                <section class="character-card glass">
                    <img class="logo" src="/assets/lobby/logo" alt="Arcane" />
                    <header class="character-header"><div class="preview-slot" bind:this={preview}></div><div><p>{state.character}</p><small>{state.balance}</small></div></header>
                    <nav class="main-actions" aria-label={state.character}>
                        {#each state.actions.filter(a => a.group === 'main') as action (action.id)}
                            <ActionButton {action} {pending} newLabel={state.newLabel} {run} />
                        {/each}
                    </nav>
                </section>
                <nav class="links glass" aria-label={state.title}>
                    {#each state.actions.filter(a => a.group === 'links') as action (action.id)}
                        <ActionButton {action} {pending} newLabel={state.newLabel} {run} />
                    {/each}
                </nav>
                <footer class="credits"><div>{state.song}</div><div>{background?.credit ?? ''}</div>
                    {#if background?.license}<button type="button" onclick={showLicense}>{state.licenseLabel}</button>{/if}
                </footer>
            </div>
        {/if}
    </section>
    {#if state?.visible}
        <aside class="right-panel glass">
            <header><h1>{state.title}</h1>
                <nav class="utility-actions" aria-label={state.title}>
                    {#each state.actions.filter(a => a.group === 'right') as action (action.id)}
                        <ActionButton {action} {pending} newLabel={state.newLabel} {run} />
                    {/each}
                </nav>
                {#each state.actions.filter(a => a.group === 'info') as action (action.id)}
                    <ActionButton {action} {pending} newLabel={state.newLabel} {run} />
                {/each}
            </header>
            {#if state.infoHeight > 0}<section class="server-info" style:max-height={`${state.infoHeight}px`}><RichText parts={state.info} /></section>{/if}
            <Chat chat={state.chat} errorLabel={state.errorLabel} refreshState={async () => accept(await novaBridge.invoke('lobby-get-state'))} />
        </aside>
    {/if}
    {#if error && state?.visible}<div class="error" role="alert">{error}</div>{/if}
    {#if license !== null && state}
        <div class="license glass"><button type="button" onclick={() => license = null}>{state.licenseLabel} ×</button><pre>{license}</pre></div>
    {/if}
</main>

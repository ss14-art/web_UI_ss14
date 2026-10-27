<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { novaBridge } from '$lib/novaBridge';
    import type { LobbyChat } from './types';
    import RichText from './RichText.svelte';
    import Icon from './Icon.svelte';
    let { chat, errorLabel, refreshState }: { chat: LobbyChat; errorLabel: string; refreshState: () => Promise<void> } = $props();
    let draft = $state('');
    let pending = $state(false);
    let error = $state('');
    let pinned = $state(true);
    let channelOpen = $state(false);
    let channelPending = $state(false);
    let channelTarget = $state<string | null>(null);
    const selectedChannel = $derived(channelTarget ?? chat.channel);
    let channelPicker: HTMLDivElement;
    let channelButton: HTMLButtonElement;
    let input: HTMLInputElement;
    let log: HTMLDivElement;
    let active = true;
    const sent: string[] = [];
    let historyIndex = 0;
    let savedDraft = '';
    let olderAnchor: { height: number; top: number } | null = null;

    async function selectChannel(id: string): Promise<void> {
        if (channelPending || !chat.channels.some(c => c.id === id)) return;
        channelPending = true;
        channelTarget = id;
        channelOpen = false;
        try {
            if (await request('lobby-chat-channel', { channel: id })) await refreshState();
        } catch { if (active) error = errorLabel; }
        finally { channelTarget = null; channelPending = false; }
        if (active) input?.focus();
    }
    async function pickerKeydown(event: KeyboardEvent): Promise<void> {
        if (event.key === 'Escape' && channelOpen) {
            event.preventDefault(); channelOpen = false; channelButton.focus(); return;
        }
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault(); channelOpen = true;
        await tick();
        const options = [...channelPicker.querySelectorAll<HTMLButtonElement>('[role="option"]')];
        if (!options.length) return;
        const index = options.indexOf(document.activeElement as HTMLButtonElement);
        const next = index < 0 ? (event.key === 'ArrowUp' ? options.length - 1 : 0)
            : (index + (event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
        options[next].focus();
    }

    async function request(event: string, data = {}): Promise<boolean> {
        error = '';
        try { await novaBridge.invoke(event, data); return true; }
        catch { if (active) error = errorLabel; return false; }
    }
    async function send(): Promise<void> {
        if (pending || channelPending || !draft.trim() || !chat.channels.length) return;
        const text = draft;
        pending = true;
        if (await request('lobby-chat-send', { text, channel: selectedChannel })) {
            if (draft === text) draft = '';
            sent.push(text); if (sent.length > 100) sent.shift(); historyIndex = sent.length;
            pinned = true;
        }
        pending = false;
        input?.focus();
    }
    function bottom(): void { if (log) log.scrollTop = log.scrollHeight; pinned = true; }
    function scroll(): void { pinned = log.scrollHeight - log.scrollTop - log.clientHeight < 32; }
    async function older(): Promise<void> {
        olderAnchor = { height: log.scrollHeight, top: log.scrollTop };
        pinned = false;
        if (!await request('lobby-chat-older')) olderAnchor = null;
    }
    $effect(() => {
        chat.messages;
        void tick().then(() => {
            if (!active || !log) return;
            if (olderAnchor) { log.scrollTop = olderAnchor.top + log.scrollHeight - olderAnchor.height; olderAnchor = null; }
            else if (pinned) bottom();
        });
    });
    function keydown(event: KeyboardEvent): void {
        if (event.isComposing) return;
        if (event.key === 'Escape') { event.preventDefault(); input.blur(); return; }
        if (event.key === 'Tab' && chat.channels.length) {
            event.preventDefault();
            const index = chat.channels.findIndex(c => c.id === selectedChannel);
            const next = chat.channels[(index + (event.shiftKey ? -1 : 1) + chat.channels.length) % chat.channels.length];
            void selectChannel(next.id);
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            if (historyIndex === sent.length) savedDraft = draft;
            historyIndex = Math.max(0, Math.min(sent.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
            draft = historyIndex === sent.length ? savedDraft : sent[historyIndex];
        }
    }
    onMount(() => {
        draft = chat.draft;
        const unsubscribe = novaBridge.subscribe('lobby-chat-focus', () => { channelOpen = false; input?.focus(); });
        const closeOutside = (event: Event) => {
            if (event.target instanceof Node && !channelPicker?.contains(event.target)) channelOpen = false;
        };
        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('focusin', closeOutside);
        return () => {
            active = false; unsubscribe();
            document.removeEventListener('pointerdown', closeOutside);
            document.removeEventListener('focusin', closeOutside);
        };
    });
</script>
<section class="web-chat" aria-label={chat.placeholder}>
    <div class="chat-toolbar"><span>{chat.channels.find(c => c.id === selectedChannel)?.label ?? ''}</span>
        <details class="chat-filters">
            <summary title={chat.filterLabel}><Icon name="filter" /><span>{chat.filterLabel}</span></summary>
            <div class="filter-list glass">{#each chat.filters as filter (filter.id)}
                <label><input type="checkbox" checked={filter.active} onchange={(e) => request('lobby-chat-filter', { channel: filter.id, active: e.currentTarget.checked ? 1 : 0 })} />{filter.label}</label>
            {/each}</div>
        </details>
    </div>
    <div class="chat-messages" role="log" aria-live="polite" aria-relevant="additions" bind:this={log} onscroll={scroll} tabindex="0">
        {#if chat.hasOlder}<button class="chat-older" type="button" onclick={older}>{chat.olderLabel}</button>{/if}
        {#each chat.messages as message (message.id)}<div class="chat-line"><RichText parts={message.parts} /></div>{/each}
    </div>
    {#if !pinned}<button class="chat-bottom" type="button" onclick={bottom}>{chat.bottomLabel}</button>{/if}
    {#if error}<p class="chat-error" role="alert">{error}</p>{/if}
    <form class="chat-compose" onsubmit={(event) => { event.preventDefault(); void send(); }}>
        <div class="channel-picker" bind:this={channelPicker}>
            <button class="channel-toggle" bind:this={channelButton} type="button" aria-haspopup="listbox" aria-expanded={channelOpen}
                aria-label={chat.channels.find(c => c.id === selectedChannel)?.label ?? chat.placeholder}
                disabled={channelPending || !chat.channels.length} onclick={() => channelOpen = !channelOpen} onkeydown={pickerKeydown}>
                <span>{chat.channels.find(c => c.id === selectedChannel)?.label ?? ''}</span><Icon name="chevron-down" />
            </button>
            {#if channelOpen}
                <div class="channel-options glass" role="listbox" aria-label={chat.placeholder}>
                    {#each chat.channels as channel (channel.id)}
                        <button type="button" role="option" aria-selected={channel.id === selectedChannel}
                            onkeydown={pickerKeydown} onclick={() => selectChannel(channel.id)}>{channel.label}</button>
                    {/each}
                </div>
            {/if}
        </div>
        <input bind:this={input} bind:value={draft} maxlength={chat.maxLength} placeholder={chat.placeholder} aria-label={chat.placeholder} autocomplete="off" onkeydown={keydown} oninput={(e) => { void request('lobby-chat-draft', { text: e.currentTarget.value }); }} disabled={!chat.channels.length} />
        <button type="submit" disabled={pending || channelPending || !draft.trim()} title={chat.sendLabel} aria-label={chat.sendLabel}><Icon name="paper-plane" /></button>
    </form>
</section>

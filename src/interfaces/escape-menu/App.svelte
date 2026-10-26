<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { novaBridge } from '$lib/novaBridge';
    import MenuGroup from './components/MenuGroup.svelte';
    import type { EscapeMenuAction, EscapeMenuState } from './escapeMenuTypes';

    let menu = $state<EscapeMenuState | null>(null);
    let pendingAction = $state<string | null>(null);
    let error = $state('');

    onMount(() => {
        let active = true;
        const unsubscribe = novaBridge.subscribe('escape-menu-state', (state: EscapeMenuState) => {
            if (active) menu = state;
        });

        void novaBridge.invoke('escape-menu-get-state').then(async (state: EscapeMenuState) => {
            if (!active) return;
            menu = state;
            await tick();
            document.querySelector<HTMLButtonElement>('.action-button:not(:disabled)')?.focus();
        }).catch(() => {
            if (active) error = 'The game menu could not be loaded.';
        });

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            void novaBridge.invoke('escape-menu-close').catch(() => {
                if (active) error = menu?.errorLabel ?? 'The menu could not be closed.';
            });
        };
        window.addEventListener('keydown', onKeyDown);

        return () => {
            active = false;
            unsubscribe();
            window.removeEventListener('keydown', onKeyDown);
        };
    });

    async function runAction(action: EscapeMenuAction): Promise<void> {
        if (!action.visible || !action.enabled || pendingAction !== null) return;
        pendingAction = action.id;
        error = '';
        try {
            await novaBridge.invoke('escape-menu-action', { action: action.id });
        } catch {
            error = menu?.errorLabel ?? 'The action could not be completed.';
        } finally {
            pendingAction = null;
        }
    }
</script>

<main class="menu-shell" aria-busy={menu === null}>
    {#if menu}
        <nav class="action-list" aria-label={menu.title}>
            {#each menu.groups as group (group.id)}
                {#if group.actions.some((action) => action.visible)}
                    <MenuGroup {group} pending={pendingAction !== null} pendingActionId={pendingAction} newLabel={menu.newLabel} pendingLabel={menu.pendingLabel} {runAction} />
                {/if}
            {/each}
        </nav>
    {:else}
        <p class="menu-loading" role="status">Loading…</p>
    {/if}
    {#if error}
        <p class="menu-error" role="alert">{error}</p>
    {/if}
</main>

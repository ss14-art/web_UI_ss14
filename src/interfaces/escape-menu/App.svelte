<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { novaBridge } from '$lib/novaBridge';
    import { installNativeKeys } from '$lib/nativeKeys';
    import MenuGroup from './components/MenuGroup.svelte';
    import type { EscapeMenuAction, EscapeMenuState } from './escapeMenuTypes';

    let menu = $state<EscapeMenuState | null>(null);
    let pendingAction = $state<string | null>(null);
    let error = $state('');
    let active = false;

    async function loadMenuState(): Promise<void> {
        error = '';
        try {
            const state: EscapeMenuState = await novaBridge.invoke('escape-menu-get-state');
            if (!active) return;
            menu = state;
            await tick();
            await novaBridge.invoke('escape-menu-ready');
            if (!active) return;
            document.querySelector<HTMLButtonElement>('.action-button[aria-disabled="false"]')?.focus();
        } catch {
            if (active) error = menu?.errorLabel ?? '';
        }
    }

    onMount(() => {
        active = true;
        const unsubscribe = novaBridge.subscribe('escape-menu-state', (state: EscapeMenuState) => {
            if (active) menu = state;
        });

        void loadMenuState();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Tab') {
                const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')];
                const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
                if (buttons.length && (event.shiftKey ? index <= 0 : index === buttons.length - 1)) {
                    event.preventDefault();
                    buttons[event.shiftKey ? buttons.length - 1 : 0].focus();
                }
                return;
            }
            if (event.key !== 'Escape') return;
            event.preventDefault();
            if (event.repeat) return;
            void novaBridge.invoke('escape-menu-close').catch(() => {
                if (active) error = menu?.errorLabel ?? '';
            });
        };
        window.addEventListener('keydown', onKeyDown);
        const removeNativeKeys = installNativeKeys();

        return () => {
            active = false;
            unsubscribe();
            removeNativeKeys();
            window.removeEventListener('keydown', onKeyDown);
        };
    });

    async function runAction(action: EscapeMenuAction): Promise<void> {
        if (!action.visible || !action.enabled || pendingAction !== null) return;
        pendingAction = action.id;
        error = '';
        try {
            const result = await novaBridge.invoke('escape-menu-action', { action: action.id });
            if (active && result.closeMenu) await novaBridge.invoke('escape-menu-close');
        } catch {
            if (active) error = menu?.errorLabel ?? '';
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
    {/if}
    {#if error}
        <div class="menu-error" role="alert">{error}
            <button type="button" class="menu-retry" onclick={loadMenuState}>{menu?.retryLabel}</button>
        </div>
    {/if}
</main>

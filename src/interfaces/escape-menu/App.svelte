<script lang="ts">
    import { onMount } from 'svelte';
    import { novaBridge } from '$lib/novaBridge';

    interface MenuAction {
        id: string;
        label: string;
        visible: boolean;
        danger: boolean;
    }

    interface MenuState {
        title: string;
        status: string;
        actions: MenuAction[];
    }

    let menu = $state<MenuState | null>(null);
    let pendingAction = $state<string | null>(null);
    let unavailable = $state(false);

    onMount(async () => {
        try {
            menu = await novaBridge.invoke('escape-menu-get-state') as MenuState;
        } catch {
            unavailable = true;
        }
    });

    async function invokeAction(action: MenuAction): Promise<void> {
        if (pendingAction !== null) {
            return;
        }

        pendingAction = action.id;
        try {
            await novaBridge.invoke('escape-menu-action', { action: action.id });
        } catch {
            unavailable = true;
        } finally {
            pendingAction = null;
        }
    }
</script>

<main class="menu-shell" aria-busy={menu === null && !unavailable}>
    {#if menu}
        <header class="menu-header">
            <span class="header-mark">◆</span>
            <h1>{menu.title}</h1>
        </header>

        <div class="connection-status">
            <span class="status-dot"></span>
            <span>{menu.status}</span>
        </div>

        <nav class="action-list" aria-label={menu.title}>
            {#each menu.actions.filter((action) => action.visible) as action (action.id)}
                <button
                    class:danger={action.danger}
                    disabled={pendingAction !== null}
                    onclick={() => invokeAction(action)}
                >
                    <span class="action-caret">&gt;</span>
                    <span>{action.label}</span>
                    {#if pendingAction === action.id}
                        <span class="action-pending">...</span>
                    {/if}
                </button>
            {/each}
        </nav>
    {:else}
        <div class:failed={unavailable} class="boot-indicator" aria-hidden="true">
            <span>◆</span>
            <div class="boot-line"><div></div></div>
        </div>
    {/if}
</main>

<script lang="ts">
    import Icon from './Icon.svelte';
    import type { LobbyAction } from './types';
    let { action, pending, newLabel, run }: { action: LobbyAction; pending: boolean; newLabel: string;
        run: (action: LobbyAction) => Promise<void> } = $props();
</script>

<button type="button" class="action" class:danger={action.danger} class:unread={action.unread}
    aria-disabled={!action.enabled || pending} title={action.tooltip || action.label}
    aria-label={action.unread ? `${action.label}, ${newLabel}` : action.label} onclick={() => run(action)}>
    <Icon name={action.icon} /><span>{action.label}</span>
    {#if action.unread}<span class="badge">{newLabel}</span>{/if}
</button>

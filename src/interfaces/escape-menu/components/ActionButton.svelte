<script lang="ts">
    import { getIcon } from '../fontAwesome';
    import type { EscapeMenuAction } from '../escapeMenuTypes';

    let { action, pending, pendingActionId, newLabel, pendingLabel, runAction }: {
        action: EscapeMenuAction;
        pending: boolean;
        pendingActionId: string | null;
        newLabel: string;
        pendingLabel: string;
        runAction: (action: EscapeMenuAction) => Promise<void>;
    } = $props();
    const icon = $derived(getIcon(action.icon));
</script>

<button
    type="button"
    class="action-button"
    class:action-button--danger={action.tone === 'danger'}
    class:action-button--unread={action.badge === 'new'}
    class:action-button--unavailable={!action.enabled}
    title={action.tooltip ?? undefined}
    aria-disabled={pending || !action.enabled}
    aria-busy={pendingActionId === action.id}
    aria-label={action.badge === 'new' ? `${action.label}, ${newLabel}` : action.tooltip && !action.enabled ? `${action.label}. ${action.tooltip}` : action.label}
    onclick={() => runAction(action)}
>
    <span class="action-button__icon" aria-hidden="true">
        {#if icon}
            <svg viewBox="0 0 {icon.icon[0]} {icon.icon[1]}" focusable="false">
                {#if typeof icon.icon[4] === 'string'}
                    <path fill="currentColor" d={icon.icon[4]} />
                {:else}
                    {#each icon.icon[4] as path}
                        <path fill="currentColor" d={path} />
                    {/each}
                {/if}
            </svg>
        {/if}
    </span>
    <span class="action-button__label">{action.label}</span>
    {#if action.badge === 'new'}<span class="action-button__badge">{newLabel}</span>{/if}
    {#if pendingActionId === action.id}<span class="action-button__pending">{pendingLabel}</span>{/if}
</button>

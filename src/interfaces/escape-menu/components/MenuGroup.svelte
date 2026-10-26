<script lang="ts">
    import ActionButton from './ActionButton.svelte';
    import type { EscapeMenuAction, EscapeMenuGroup } from '../escapeMenuTypes';

    let { group, pending, pendingActionId, newLabel, pendingLabel, runAction }: {
        group: EscapeMenuGroup;
        pending: boolean;
        pendingActionId: string | null;
        newLabel: string;
        pendingLabel: string;
        runAction: (action: EscapeMenuAction) => Promise<void>;
    } = $props();
</script>

<div class="menu-group" class:menu-group--separated={group.separatorBefore}>
    {#each group.actions.filter((action) => action.visible) as action (action.id)}
        <ActionButton {action} {pending} {pendingActionId} {newLabel} {pendingLabel} {runAction} />
    {/each}
</div>

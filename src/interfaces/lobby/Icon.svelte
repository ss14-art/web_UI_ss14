<script lang="ts">
    import { faGamepad, faCheck, faGhost, faHeadset, faCoins, faHeart, faLink, faCircleInfo, faEyeSlash, faFilter, faPaperPlane, faChevronDown } from '@fortawesome/free-solid-svg-icons';
    import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
    import { getIcon } from '../escape-menu/fontAwesome';
    let { name }: { name: string } = $props();
    const extra: Record<string, IconDefinition> = { gamepad: faGamepad, check: faCheck, ghost: faGhost, headset: faHeadset,
        coins: faCoins, heart: faHeart, link: faLink, 'circle-info': faCircleInfo, 'eye-slash': faEyeSlash, filter: faFilter, 'paper-plane': faPaperPlane, 'chevron-down': faChevronDown };
    const definition = $derived(extra[name] ?? getIcon(name));
</script>

<span class="icon" aria-hidden="true">
    {#if definition}
        <svg viewBox="0 0 {definition.icon[0]} {definition.icon[1]}" focusable="false">
            {#each typeof definition.icon[4] === 'string' ? [definition.icon[4]] : definition.icon[4] as path}
                <path fill="currentColor" d={path} />
            {/each}
        </svg>
    {/if}
</span>

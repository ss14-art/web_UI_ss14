<script lang="ts">
    import type { RichSpan } from './types';
    let { parts }: { parts: RichSpan[] } = $props();
</script>
{#each parts as part}<span style:color={part.color} style:font-weight={part.bold ? '700' : '400'} style:font-style={part.italic ? 'italic' : 'normal'}>{part.text}</span>{/each}

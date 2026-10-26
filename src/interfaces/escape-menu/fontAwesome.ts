import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
    faBookOpen, faBug, faCheckToSlot, faClipboardList, faCodeBranch,
    faCommentDots, faCrown, faGear, faGlobe, faPlugCircleXmark,
    faRightFromBracket, faScaleBalanced, faScroll, faUserPen,
} from '@fortawesome/free-solid-svg-icons';

const icons: Record<string, IconDefinition> = {
    'book-open': faBookOpen,
    bug: faBug,
    'check-to-slot': faCheckToSlot,
    'clipboard-list': faClipboardList,
    'code-branch': faCodeBranch,
    'comment-dots': faCommentDots,
    crown: faCrown,
    gear: faGear,
    globe: faGlobe,
    'plug-circle-xmark': faPlugCircleXmark,
    'right-from-bracket': faRightFromBracket,
    'scale-balanced': faScaleBalanced,
    scroll: faScroll,
    'user-pen': faUserPen,
};

export function getIcon(name: string): IconDefinition | undefined {
    return icons[name];
}

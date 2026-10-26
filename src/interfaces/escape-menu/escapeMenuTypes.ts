export interface EscapeMenuAction {
    id: string;
    label: string;
    icon: string;
    visible: boolean;
    enabled: boolean;
    tooltip?: string;
    tone: 'normal' | 'danger';
    badge?: 'new';
}

export interface EscapeMenuGroup {
    id: string;
    separatorBefore: boolean;
    actions: EscapeMenuAction[];
}

export interface EscapeMenuState {
    title: string;
    newLabel: string;
    pendingLabel: string;
    errorLabel: string;
    groups: EscapeMenuGroup[];
}

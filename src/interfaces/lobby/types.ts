export interface LobbyAction {
    id: string;
    label: string;
    icon: string;
    group: 'main' | 'right' | 'links' | 'info';
    enabled: boolean;
    unread: boolean;
    danger: boolean;
    tooltip: string;
}

export interface LobbyBackground {
    url: string;
    poster: string | null;
    license: string | null;
    credit: string;
    x: number;
    y: number;
}

export interface LobbyState {
    info: RichSpan[];
    chat: LobbyChat;
    version: 1;
    revision: number;
    title: string;
    character: string;
    balance: string;
    visible: boolean;
    rightWidth: number;
    infoHeight: number;
    round: string;
    roundTitle: string;
    players: string;
    lobbyPlayers: string;
    readyPlayers: string;
    hideLabel: string;
    errorLabel: string;
    newLabel: string;
    licenseLabel: string;
    song: string;
    background: LobbyBackground | null;
    actions: LobbyAction[];
}

export interface RichSpan { text: string; color: string; bold: boolean; italic: boolean; }
export interface LobbyChat {
    draft: string;
    channel: string;
    maxLength: number;
    channels: { id: string; label: string }[];
    filters: { id: string; label: string; active: boolean }[];
    messages: { id: number; parts: RichSpan[] }[];
    hasOlder: boolean;
    sendLabel: string;
    filterLabel: string;
    olderLabel: string;
    bottomLabel: string;
    placeholder: string;
}

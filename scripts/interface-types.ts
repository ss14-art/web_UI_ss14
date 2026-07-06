export interface InterfaceMetadata {
    displayName?: string;
    description?: string;
    icon?: string;
    status?: 'active' | 'development' | 'deprecated';
}

export interface ScannedInterface {
    name: string;
    title: string;
    description: string;
    url: string;
    path: string;
    icon: string;
    status: 'active' | 'development' | 'deprecated';
}
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { InterfaceMetadata, ScannedInterface } from './interface-types.js';

const fileName = fileURLToPath(import.meta.url);
const dirname = path.dirname(fileName);

export function scanInterfaces(): ScannedInterface[] {
    const interfacesDir = path.join(dirname, '../src/interfaces');

    if (!fs.existsSync(interfacesDir)) {
        console.log('❌ Interfaces directory not found');
        return [];
    }

    const interfaces: ScannedInterface[] = [];
    const folders = fs.readdirSync(interfacesDir, { withFileTypes: true });

    for (const folder of folders) {
        if (!folder.isDirectory()) {
            continue;
        }

        const folderPath = path.join(interfacesDir, folder.name);
        const indexPath = path.join(folderPath, 'index.html');

        if (!fs.existsSync(indexPath)) {
            console.log(`⚠️  ${folder.name}: no index.html, skipping`);
            continue;
        }

        const packagePath = path.join(folderPath, 'package.json');
        let metadata: InterfaceMetadata = {};

        if (fs.existsSync(packagePath)) {
            try {
                metadata = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            } catch {
                console.log(`⚠️  ${folder.name}: invalid package.json`);
            }
        }

        let title = folder.name;
        try {
            const htmlContent = fs.readFileSync(indexPath, 'utf8');
            const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
            if (titleMatch) {
                title = titleMatch[1];
            }
        } catch {
            console.log(`⚠️  ${folder.name}: could not read index.html`);
        }

        interfaces.push({
            name: folder.name,
            title: metadata.displayName || title || folder.name,
            description: metadata.description || `Interface ${folder.name}`,
            url: `/src/interfaces/${folder.name}/`,
            path: folderPath,
            icon: metadata.icon || '🔧',
            status: metadata.status || 'active',
        });
    }

    return interfaces;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🔍 Scanning interfaces...\n');

    const interfaces = scanInterfaces();

    if (interfaces.length === 0) {
        console.log('😔 No interfaces found');
    } else {
        console.log('✅ Found interfaces:');
        interfaces.forEach((iface) => {
            const status = iface.status === 'development' ? '🔨' :
                iface.status === 'deprecated' ? '⚠️' : '✅';
            console.log(`${status} ${iface.icon} ${iface.title.padEnd(20)}`);
            console.log(`📁 ${iface.name.padEnd(43)}`);
            console.log(`🔗 ${iface.url.padEnd(43)}`);
            console.log(`📝 ${iface.description.padEnd(43)}`);
        });

        console.log(`\n📊 Total found: ${interfaces.length} interfaces`);
    }
}
# FireRed cabinet

EmulatorJS 4.2.3 assets are vendored unchanged from
https://cdn.emulatorjs.org/4.2.3/data/ . EmulatorJS source/tag:
https://github.com/EmulatorJS/EmulatorJS/tree/v4.2.3 . GPL-3.0 text is in data/LICENSE.
The mGBA core bundles include their own license.txt, core.json and build.json;
source/build tooling: https://github.com/EmulatorJS/EmulatorJS and
https://github.com/EmulatorJS/cores . Retain these notices and review source-offer
obligations before distributing compiled emulator assets.

ROM supplied by the user from temp/fire_red/firered.gba (16 MiB).
SHA-256: A479FCB8E23CF60087A26C1CA6C991CEAF8EA8F7C7D19751D38BB6F26059C8EA.
The user explicitly confirmed redistribution permission on 2026-10-28.
This records their statement, not an independently verified license grant.

Runtime is offline and single-threaded. No netplay, browser filesystem API or native
commands are exposed to the emulator. The surrounding Arcane client bridges only the
FireRed cartridge SRAM to its local UserData directory: automatic checkpoint every
60 seconds and an additional flush when the cabinet's in-page Close button is used.
The most recent three complete generations are retained. Saves are local to that
client installation and are not synchronized to a server or another computer.

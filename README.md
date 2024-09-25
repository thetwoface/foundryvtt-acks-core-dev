Enter a world where adventurers can become conquerors – and conquerors can become kings.<br/>
Welcome to ACKS II, the new edition of the bestselling fantasy RPG.<br/>
Adventure, conquer, and reign!

Will you survive the perils of war and dark magic to claim a throne?
Or will you meet your fate in a forgotten ruin beyond the ken of men?

This is a world where empires stand on the brink of war, and terrible
monsters tear at the fragile borderlands of men; where decaying cities teem
with chaos and corruption, weeping innocents are sacrificed to chthonic cults
and nobles live in decadent pleasure while the realm burns; where heroes,
wizards, and rogues risk everything in pursuit of glory, fortune, and power.

The Adventurer Conqueror King System™ Imperial Imprint (ACKS II) is the new
edition of the acclaimed bestselling fantasy role-playing game.
Within ACKS II you'll find everything you need to enjoy epic fantasy
campaigns with a sweeping scope. Whether you want to crawl through dungeons,
experiment with alchemy, crossbreed monsters, run a merchant emporium,
raise an undead legion, or conquer an empire, ACKS II supports your playstyle.

## **Adventurer Conqueror King System Imperial Imprint (ACKS II)** for Foundry VTT

This is the ACKS II core game system module for Foundry Virtual Tabletop,
providing character sheet and game system support for ACKS II.

This game system has essential rules mechanics and character sheets to make the
judge's job easier for running ACKS games on the Foundry VTT.
Also included is a world map of the Auran Empire (the default setting of ACKS).
A number of compendiums with Monsters, Items, Spells, Proficiencies, Abilities
and more are available separately.

## ACKS II for Foundry VTT Features
### **Core Rules**
- Armor Class (Ascending starting from 0)
- Attack throws, saving throws, and proficiency throws
- Attributes, class powers, and proficiency modifiers applied to character sheet
- Encumbrance rules, including encumbrance bar to reflect speed
- Initiative rules, including readying, delaying, and tie-breaking by group size
- Morale and Loyalty tracking for Henchmen
- Party-based surprise rolls to start encounters
- Party-based evasion rolls to end encounters
- Spellcasting

### **Recent Updates**
For a complete list of changes, [refer to the Changelog](https://github.com/AutarchLLC/foundryvtt-acks-core/blob/master/Changelog.txt). Here are some of the significant changes in the latest release:

- Added the ACKS II specific Initiative sequencing including Surprise bonuses and Initiative conditions such as Delaying and Readied.
- Updated the game system to add Foundry version 11 and version 12 compatibility.

## Installation Instructions
**Forge Hosting**
If you're using the Forge hosting service, the ACKS II module is immediately installable directly from Forge's Bazaar.

The rest of this document describe how to install the module on a self-hosted Foundry instance.

**Getting Started with the Foundry VTT**  
If you're new to installing Game System modules, follow along with the [Foundry Gamemaster tutorial](https://foundryvtt.com/article/tutorial/) section headlined *Installing a Game System.* [https://foundryvtt.com/article/tutorial/](https://foundryvtt.com/article/tutorial/)

**Backward Compatibility**  
If you need to maintain backward compatibility with older Foundry releases before version 11, we recommend using the Version 9 installation package. Be aware that the Version 9 package is for ACKS (original) and will not contain any updated content for ACKS II.

**Installation**  
To install and use this system, paste one of the following installation URLs into the *Install System* dialog of the Setup menu inside the Foundry application.

| For this<br/>Foundry version | Use this Installation URL |
| --------------- | ---------------- |
| The Forge hosting service | Visit the ACKS II page on Forge and click the Install button.<br/>[https://forge-vtt.com/bazaar/package/acks](https://forge-vtt.com/bazaar/package/acks) |
| Version 12, <br/>Version 11 | [https://github.com/AutarchLLC/foundryvtt-acks-core/releases/latest/download/system.json](https://github.com/AutarchLLC/foundryvtt-acks-core/releases/latest/download/system.json) |
| Version 10 | Unknown. Recommend staying at Version 9 or else updating to Version 11. |
| Version 9 | [https://github.com/thehappyanarchist/foundryacks/raw/master/src/system.json](https://github.com/thehappyanarchist/foundryacks/raw/master/src/system.json) |
| Older versions | Not supported. |

### Manual Installation (Advanced Users)
If you wish to manually install the system, you must clone or extract it into the foundry "/data/systems/acks" folder. You may do this by cloning the repository /src folder or downloading and extracting the zip archive available on the GitHub page.

## Community Contribution

Code and content contributions are accepted under the terms of the
[<span class="underline">Autarch Individual Contribution License</span>](autarch-individual-contributor-license-agreement.md).

Please feel free to submit issues to the issue tracker or submit merge requests for code changes.

Merge requests should pass code review and (if necessary) design review by ArcanistWill.
Please reach out on
the [<span class="underline">Autarch Discord</span>](https://discord.gg/MabfMkk) in
the [<span class="underline">"acks-vtt-collaboration" channel</span>](https://discord.com/channels/427567650449915904/758364713192521779)
with any questions.

Big thank you to Bobloblah and The Happy Anarchist for laying the
foundation of the ACKS compendium\! Both of them put in an enormous effort, all to
save judges tons of work in getting their campaigns started.

## Developer Instructions
### The test suite

There are tests that can be run inside of your Foundry instance through the `acks-tests` module.  To
install the module locally, symlink that folder inside of your Foundry modules folder:
```bash
cd ~/.local/share/FoundryVTT/Data/modules
ln -s ~/path/to/foundryvtt-acks-core/acks-tests acks-tests
```
Once that's done, reload Foundry and you will see "ACKS Test Suite" in your Add-on Modules list.
You'll need to install the [Quench](https://ethaks.github.io/FVTT-Quench/index.html) module too,
which can be done via the built-in module search functionality.

To run the tests, log into a World which is using the ACKS System and go to Manage Modules to enable
ACKS Test Suite.  It will prompt you to enable Quench.

Now that it's installed and enabled, you will see a "🧪 Quench" button under your chat box. Click
that and the tests will run.  You can also adjust your Quench defaults in the Configure Settings
menu.

## License
#### System

This system is offered and may be used under the terms of
the [<span class="underline">Simulationist Adventure Game Authorization (SAGA) License v1.0</span>](saga-license.md),
the [<span class="underline">Autarch Compatibility License</span>](autarch-compatibility-license.md), and
the [<span class="underline">Autarch Community Use Guidelines</span>](autarch-community-use-guidelines.md).

This code is modified from a fork of the v1.0 code of the Old School Essentials System written by U~Man, and released under the GNUv3 license. The software source of this system is also distributed under the GNUv3 license and is considered open source.

Autarch, Adventurer Conqueror King, Adventurer Conqueror King System,
ACKS, ACKS II, and Imperial Imprint are trademarks of Autarch LLC.
You may find further information about the system
at [<span class="underline">autarch.co</span>](https://autarch.co/).
Auran Empire is trademark Alexander Macris.

#### Artwork

Weapon quality icons, and the Treasure chest are from Rexxard, and came
with the Old School Essentials System for Foundry VTT (Unofficial) by
U\~man which can be found
at [<span class="underline">https://gitlab.com/mesfoliesludiques/foundryvtt-ose</span>](https://gitlab.com/mesfoliesludiques/foundryvtt-ose).
Other icons used in the compendium are distributed under the Creative
Commons 3.0 BY license and are available
on [<span class="underline">https://game-icons.net</span>](https://game-icons.net/).
A list of icon authors and contributors for that project can be found on
the website, or
at [<span class="underline">https://game-icons.net/about.html\#authors</span>](https://game-icons.net/about.html#authors).
Monster Tokens in the bundled ACKS Monsters Compendium are from the Free
Token pack from Devin's Token Site and are made by Devin
Night [<span class="underline">https://immortalnights.com/tokensite/</span>](https://immortalnights.com/tokensite/).
Other icons in the compendium are by Bobloblah or The Happy Anarchist.
Map of the Auran Empire (default setting of ACKS) by The Happy Anarchist.

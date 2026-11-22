### I can't enable the module due to issues in required dependencies:
CPR 1.0.x supports a maximum D&D system version of 3.3.1, which must be installed by manifest URL:
* D&D System 3.3.1: https://github.com/foundryvtt/dnd5e/releases/download/release-3.3.1/system.json
  
*Some compatible modules may no longer support 3.3.1 in their latest releases, so their last compatible versions must be installed by manifest URL:*
* DDB-Importer 5.2.38: https://github.com/MrPrimate/ddb-importer/releases/download/5.2.38/module.json
* Rest Recovery 1.17.2: https://github.com/roth-michael/FoundryVTT-RestRecovery/releases/download/1.17.2/module.json
* Tidy 5e Sheets 5.7.5: https://github.com/kgar/foundry-vtt-tidy-5e-sheets/releases/download/v5.7.5/module.json

### The "CPR - Descriptions" journal is blank:
This is intentional. Features do not come with descriptions in CPR due to copyright. You can manually fill these out and they will be added to items that are created in a macro. This includes features on summon creatures, added features during a spell such as dragon's breath, among others.

### This spell doesn't block player vision but it should (Darkness, Fog cloud, etc.):
Any spells/features with vision restriction work RAW mechanically. These automations are not intended to restrict player's vision. CPR automations are intended for RAW mechanics, not player visuals. These spells do have a configuration option to "Use Real Darkness" which will use darkness source light source, which will block vision.

### This feature/spell should have an animation, but I'm not seeing it
Any animations by Eskiemoh typically require JB2A Patreon and Jack Kerouac's animated spell effects. The latter must be manually installed with the manifest URL from Chris's fork, which is updated for v13;
https://github.com/chrisk123999/animated-spell-effects-cartoon/releases/latest/download/module.json

### Bardic Inspiration/Battle Master maneuvers/Arcane Jolt etc. tell me I need to set a scale:
This typically only comes up for non-DDBI users. Scales must be set, according to the feature descriptions, on an actor's sheet. Edit the specific class/subclass, on the Advancement tab, click to toggle Configuration Disabled to enable configuration, and manually set up the scale. This must be named exactly.

### How do the BG3 Weapon Actions work?
Once you enable the setting in the **Homebrew** tab of CPR's settings, ***Re-equip the relevant weapons***, the actions will be added to the features tab of the character sheet. The character must be proficient with the weapon.

### How to use the CPR summons?
* Make sure the item on the actor is up to date via the Medkit.
* Have your actor's token on the scene and use the feature, it will spawn the token.
* You can use the "configure" option on the Medkit on the individual item in the actor's inventory to set the name/avatar/token for the summon.<br>
  
That's it. There's no extra steps.

### I enabled the weapon masteries automation but nothing happens!
Mastery must be set on the weapon used *and* the actor must have mastery of the base weapon type. Masteries can be set on the weapon proficiency window on the actor. Enabled edit mode on the actor's sheet and find their proficiencies, bottom right of the details page on the core sheet.

![weaponMastery](https://github.com/user-attachments/assets/db24b321-b2c8-4abc-bb25-b3d6242369e3)
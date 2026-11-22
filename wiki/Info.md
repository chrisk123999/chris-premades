_**This page provides more detailed information on some of Cauldron of Plentiful Resources features, including: [Settings](https://github.com/chrisk123999/chris-premades/wiki/Info#settings), [Coloration Guide](https://github.com/chrisk123999/chris-premades/wiki/Info#coloration-guide), [Generic Features](https://github.com/chrisk123999/chris-premades/wiki/Info#generic-features), [Manual Rolls](https://github.com/chrisk123999/chris-premades/wiki/Info#manual-rolls-1), [Quick Conditions](https://github.com/chrisk123999/chris-premades/wiki/Info#quick-conditions)**_

# Settings
Cauldron of Plentiful Resources is an extensive module with many settings for optional features. Most of these settings you should turn on _as needed_ and there are settings that you should not turn on unless you know what they are and that you want to use them. Please _do not_ turn on every setting, this will only cause you more confusion and more time spent troubleshooting. All settings have a brief description in the menus. Further clarification for certain settings is listed here.
  
## General Settings
- `3rd Party Content` - this allows the Medkit to pull from 3rd party and Homebrew compendiums from CPR and supported premade modules.
- `Check for Updates` - checks for a CPR update daily upon GM login and creates a chat message with details.
- `Class Spell List Journal` - filters for a journal page type Spell List. Used for automations which need a class's spell list, such as the Cardomancer Feat. Must be made manually or imported from the SRD compendium, keep in mind the SRD pages will have non-automated spells and won't have non-SRD spells, which would need to be manually added.
- `Disable Movement Performance Warning` - disables the warning notification when movement processing is taking a long time, this will only happen often on potato computers.
- `Enable CPR Animations` - allows for CPR's custom animations, requires Sequencer and JB2A.
- `Enable Embedded Macros Editing` - enabled embedded macros editor which is similar to item macros but uses CPR's event system.
- `Medkit Apply Automation Permissions` - lowest user ranking that can select and apply different automations in the Medkit.
- `Medkit Configuration Permission`s - lowest user ranking that can configure automations in the Medkit. These options are often cosmetic, such as animations or Summon's names.
- `Medkit Configure Homebrew Permissions` - lowest user ranking that can configure homebrew customizations in the Medkit. These options often edit the functioning of the feature, such as changing damage type.
- `Medkit Update Automation Permissions` - lowest user ranking that can update the currently selected automation in the Medkit.
- `Movement Event Accuracy` - accuracy mode for movement events, higher modes have greater performance impact.
- `Other Module Check` - CPR will not check for known issues with specific modules enabled and will not warn about them.
- `Other Module Settings Check` - CPR will not check some other modules' settings for known issues and will not warn about them.
  
## Dialog Options
- `Hide Names` - enabling this option will hide enemy names in dialogs, such as target selection dialogs for multi-target features.
  
## User Interface Settings
- `Additional Item Context Options` - adds Send, Condense, and Split options to inventory item context menu.
- `Automatic Effect Descriptions` - effects without descriptions will automatically be filled in from the origin item.
- `Chat Message Dark Mode` - gives a dark theme to chat messages.
- `Compendium ID Button` - adds a button to compendium headers to copy the id, much like most documents.
- `Configure Status Icon Images` - configures the status effect icon images preferences, which will be applied when the Replace Status Icons setting is enabled. Defaults are what DFred's CE previously had. The available statuses include ones added by other modules.
- `Custom Navigation Scale` - scales the scene navigation.
- `Custom Sidebar` - CSS tweaks to the sidebar including chat background and flipped scrollbar.
- `Custom Sidebar Button Scale` - scales sidebar buttons.
- `Disable Non-Condition Status Effects` - all core non-condition status effects will be removed. These include: 'bleeding', 'burrowing', 'cursed', 'ethereal', 'flying', 'hovering', 'marked', 'sleeping', 'transformed', 'hiding', 'stable', 'surprised', 'silenced', and 'dodging'.
- `Enable Effect Interface` - adds a sidebar tab for Active Effects, and associated API for applying stored effects. Reload required after enabling.
- `Export for Sharing` - adds an alternative export button to the actor and item context menu to export with descriptions removed. Requires reload after disabling.
- `Enable Macro Interface` - adds a sidebar tab for Macros. Reload required after enabling.
- `Hidden Compendium Folders` - selected compendium folders will not be displayed in the compendiums tab.
- `Hidden Compendiums` - selected compendiums will not be displayed in the compendiums tab.
- `Hide NPC Effect Descriptions` - when enabled, the Automatic Effect Description setting will not apply for NPC created effects.
- `Quick Conditions` - adds a button to midi conditions on activities which opens a quick interface.
- `Replace Status Icons` - status icons will be replaced by what is set in the Configure Status Icon Images setting.
- `Select Tool Everywhere` - the select tool is available in more places. Reload required after enabling. Incompatible with the Select Tool Everywhere module and Bailey Wiki Mass Edit module.
- `Temporary Effects HUD` - adds temporary effects to the status effect token HUD.
  
## Compendium Options
- `Additional Compendiums` - select additional compendiums to be used by the Medkit and adjust their priority. Lower number for higher priority.
- `Item Compendium` - used for automations which require duplicating or selecting regular items, such as Create Pact Weapon. Ideally, and by default, should point to your D&D Beyond item compendium.
- `Macro Compendium` - used to overwrite or add additional macros to the CPR API. Please see documentation on how to use this (WIP).
- `Monster Compendium` - used for automations which require monster actors, such as Wildshape. Ideally, and by default, should point to your D&D Beyond monster compendium.
- `Spell Compendium` - used for automations which add predetermined spells, such as magic items that add spells. Ideally, and by default, should point to your D&D Beyond spells compendium. Spell munching with added automations enabled is recommended.
  
## Game Mechanic Options
- `Add Actions to Tokens` - will add generic actions to specific types of actors when the token is placed on the canvas.
- `Apply Midi-QOL Condition Effects` - will automatically add relevant midi flags to conditions, such as advantage/disadvantage flags and ability fail flags.
- `Condition Resistance and Vulnerability` - enables automation of advantage or disadvantage on saving throws against specific conditions for automations, such as Fey Ancestry.
- `Disable Special Effects` - will prevent the blinded and invisible conditions from applying visual effects, as to not affect player's actual vision or ability to target.
- `Display Nested Conditions` - will make nested conditions visible. For Example: Paralyzed will also visibly add Incapacitated.
- `DMG Cleave` - enables automation of the cleave mechanic from the 2014 DMG, Full Health option is RAW, Any Health means cleave can trigger from any health of target.
- `Firearm Support` - adds a base item type for Firearms from Critical Role's Gunslinger Class.
- `Group Summons with Owner` - summons created via the CPR API will be grouped together in the combat tracker.
` `Legendary Actions Prompt` - tracks and prompts for unused legendary actions when combat moves forward.
- `Player Selects Conjures` - allows the player instead of the GM to select which creatures are conjured.
- `Summons Match Summoner's Elevation` - summons created via the CPR API will created with the same elevation as the summoner token.
- `Sync Actor and Token Size` - effects that change an actor's size will also change the toke size on the canvas.
- `Update Companion Initiative` - automatically set companion's initiative to just after player's initiative when rolled.
- `Update Summon Initiative` - automatically set summon's initiative to just after player's initiative when rolled.
- `Weapon Mastery Automation` - enable PHB 2024 weapon mastery automations.
  
## Module Integration
- `Automated Animations: Colorize Title bar Icon` - A-A title bar icon will be recolored based on the configuration status.
- `Automated Animations: Play Sounds` - items that have A-A disabled will still play sounds setup in the A-A Automatic Recognition menu.
- `Dice So Nice: Damage Rolls` - DSN damage roll animations will be delated until after all damage roll macros are complete, this means added dice will be displayed.
- `Dynamic Active Effects: Colorize Title bar Icon` - DAE title bar icon will be recolored if an effect is on the item.
- `Epic Rolls` - certain macros will use Epic Rolls when possible.
- `Gambit's Premades` - include homebrew and/or 3rd party content through the Medkits.
- `Midi Item Showcase Community` - include homebrew and/or unearthed arcana through the Medkits.
- `Spotlight Omnisearch: Summons` - adds a feature to use Spotlight Omnisearch to summon creatures from your monster compendium. Reload required after enabling.
- `Visual Active Effects: Buttons` - certain macros will add buttons to the VAE interface.
  
## Homebrew Options
- `Baldur's Gate 3 Uses` - Maximum uses per short rest for a given weapon action.
- `Baldur's Gate 3 Weapon Actions` - BG3 style weapon actions will be added to actors when items are equipped. Mostly uses info from the BG3 wiki and interpretation of the in-game mechanics.
- `Configure Baldur's Gate 3 Weapon Actions` - Configure which weapon actions will be added for which Base Item types.
- `Critical and Fumble Mode` - critical or fumble attack rolls will also roll an item from the selected compendiums.
- `Critical Compendium` - select compendium for criticals.
- `Exploding Heals` - all healing roll formulas will automatically be adjusted to explode.
- `Fumble Compendium` - select compendium for fumbles.
  
## Manual Rolls
- `Gamemaster Fulfils Rolls` - all rolls will go through GMs client.
- `Input Dice Only` - input dice results only, excluding modifiers.
- `Manual Rolls` - replaces the core roll resolver with CPR's and enables it for all dice denominations. CPR's roll resolver takes a total instead of individual dice results` - it will also group together damage rolls to one dialog.
- `Manual Rolls Inclusion` - what actor's rolls should be prompted for.
- `Manual Rolls Users` - configure which users use Manual Rolls. Roll dialogs are sent to the client which initiated the roll.
- `Prompt on Miss` - prompt for manual rolls for damage even on missed attacks. Otherwise, damage will auto-roll according to relevant Midi-QOL settings.
- `Prompt on No Data` - prompt for rolls with no roll data, likely a chat command roll or used in a macro to determine a random outcome.
  
## Character Backup
- `Actor Backup Compendium` - selects the compendium where actor backups are stored
- `Automatic Character Backups` - player owned characters will have a copy saved to the specified backup compendium at specified intervals.
- `Backup Frequency` - how often the automatic backups should be made.
- `Backup Retention` - how long backup characters are kept before automatic deletion.
- `Make A Backup` - this button will run the function to make a backup on click.

## Help
- `Tour Features` - this button will start a guided tour of Cauldron of Plentiful Resources.
- `Open Troubleshooter` - this button will run the CPR troubleshooter.

# Coloration Guide
CPR's Medkit icon will be colored on Items and Effects. There are settings for integration in the Module Integration menu of the CPR settings for the icons of Automated Animations, Build-A-Bonus, and DAE to be colorized as well.
  
## Medkit:
Red: Out of date CPR automation.<br>
Yellow: An automation is available from CPR, GPS, or MISC.<br>
Green: Up to date CPR automation.<br>
Blue: Up to date CPR automation and the item can be configured.<br>
Orange: Out of date GPS or MISC automation.<br>
Purple: Up to date GPS or MISC automation.<br>
Pink: Automation has been added from an additional compendium (Not CPR, GPS, or MISC)<br>
 
## Automated Animations:
Red: Disabled, Customized, and no automatic recognition was found.<br>
Green: Enabled, Customized, and no automatic recognition was found.<br>
Blue: Enabled, Customized, and an automatic recognition was found.<br>
Purple: Enabled, Not Customized, and an automatic recognition was found.<br>
Yellow: Disabled and an automatic recognition was found.<br>
Orange: Enabled and no automatic recognition was found.<br>
  
## Build-A-Bonus:
Green: A BaB is present on the item.<br>
Blue: A BaB is present on an effect of the item.<br>
Purple: A BaB is present on the item and on an effect of the item.<br>
 
## DAE:
Blue: An effect is present on a passive effect.<br>
Green: An effect is present on an active effect.<br>
Purple: An effect is present on an active and passive effect.<br>

# Generic Features
Many monster features are often very similar in how they function, and premade features for one monster have often been re-used for others. In v12, we have implemented a system of Generic Features, which can be customized in order to fit a variety of features that have the same mechanics.<br>
Currently, as of version 1.0, these features are not auto-applied, however the Medkit provides a simple UI to set them up. These features are not found in the compendiums. Instead, they will be configured via the Medkit on items on NPC actors only.

![GenericMonsterFeatureItem](https://github.com/user-attachments/assets/3e1aa2eb-cdec-4c79-84d1-21c75ac42fda)

On an item on an NPC type actor, clicking the Medkit icon in the title bar of the item will open the Medkit, with a tab called "Generic Features".

![GenericMonsterFeatureMedkit](https://github.com/user-attachments/assets/f5762b19-4c3c-421c-81b2-fc1740e41139)

This tab has a multi-select input labeled "Generic Monster Features" that displays a drop-down of available generic monster features. When selected, these will appear above the drop down box. They can then be un-selected by clicking the x on the generic monster feature label. ***To apply, delete, or change the configuration of these features, click the "Apply" button***. Any edits made will also be saved when the "Confirm" button is clicked.<br>
When a generic feature is applied that has configuration options, a fieldset will appear below the drop-down with inputs for the available options. Not all generic monster features will have configuration options. Many generic monster features will also use data from, or simply run, the item that they are on.

Currently Available Generic Monster Features, an example, and their configuration options:
- **Ability Drain** - Shadow Strength Drain - *Formula, Expiration, Ability, Check Save*
- **Activity on Effect Expiry** - Medusa Petrifying Gaze - *Activities to Trigger, No Trigger if Effect Ends Early*
- **Activity on Rest** - Otyugh Bite - *Activities to Trigger, Check Hit, Check Save, Trigger on Long Rest Only, Effect Expires on Activity Save, Trigger Only Once*
- **Advantage Damage Bonus** - Shadow Demon Claws - *Formula*
- **Auto Grapple** - Mind Flayer Tentacles - *Grapple Escape DC, Grants Disadvantage on Escape Checks*
- **Auto Push** - Poltergeist Telekinetic Thrust - *Distance, Failed Save, Hit Target, Max Size*
- **Berserk** - Clay Golem Berserk - *HP Threshold, Formula, Dice Roll Threshold*
- **Blood Frenzy** - Piranha Bite
- **Bloodied Frenzy** - Bloodied Frenzy
- **Contextual Bonus** - Deep Gnome (Svirfneblin) Stone Camouflage - *Ability Saves, Ability Checks, Skill Checks, Condition, Gives Advantage, Optional Bonus*
- **Damage on Turn Start** - Clockwork Defender Electrified Bite - *Optional Formula*
- **Damaging Aura** - Bodak Aura of Annihilation - *Distance, Immune Creature Types, Affects Allies, Turn Trigger*
- **Death Burst** - Magma Mephit
- **Effect Immunity** - Ghost Horrific Visage - *Duration (Seconds)*
- **Engulf** TBD
- **Enlarge** - Duergar Enlarge - *Double Damage Dice Instead of +1d4, Play Animation*
- **Failed By Amount** - Homunculus Bite - *Activities to Trigger, Amount**
- **Gaze** - Medusa Petrifying Gaze - *Distance, Can Avert Eyes, Averting Eyes Grants Creature Advantage*
- **Keen Senses** - Vulture Keen Sight and Smell - *Hearing, Sight, Smell*
- **Life Steal** - Vampire Bite - *Check Saves, Critical Only, Display Formula Roll, Excess Healing as Temp HP, Reduce Max HP, Formula, Healing Type, Max HP Reduction Recovery, Percentage, Damage Types, Ignored Creature Types, Valid Items*
- **Martial Advantage** - Hobgoblin Martial Advantage - *Formula, Automatically Use, Animation**
- **Movement Bonus Activity** - Goat Ram - *Activities to Trigger, Check Save, Distance, Damage Bonus, Replace Damage Formula, Max Size*
- **Pack Tactics** - Kobold Pack Tactics
- **Parry** - Knight Parry - *Formula, Show Roll*
- **Reduce** - Duergar Mind Master Reduce - *Play Animation, 1 Damage Str Attacks, Dis on Str Attacks, Always Reduce to Tiny, +5 to AC and Stealth*
- **Reduce Maximum HP** - Succubus Draining Kiss - *Damage Type that Reduces Health, Reduce by Roll, Expires on Short Rest, Expires on Long Rest, Reduce by Half of Damage, Check Saves, Remove on Save*
- **Regeneration** - Troll Regeneration - *Bypass Damage Types, Damage Required to Kill when at 0hp, Dies At 0hp, Crits Bypass Regeneration, Show Icon*
- **Reroll Save On Damage** - Aboleth Dominate Mind - *Exclude Source, Optional Save DC*
- **Roll for Activity** - Slaad Chaos Claw - *Reroll if activity has no uses left*
- **Special Item Use** - Allosaurus Claws - *Items to trigger*
- **Spell Turning** - Crag Cat Spell Turning - *Advantage on Saves, Target Caster on Success, Maximum Spell Level*
- **Start of Turn Save** TBD
- **Suffocate** - Darkmantle Crush - *Starts Out of Air*
- **Sunlight Sensitivity** - Kobold Sunlight Sensitivity - *Bright Light means Sunlight*
- **Surprise Attack** - Bugbear Surprise Attack - *Formula, Use Dialog*
- **Swarm Damage** - Swarm of Poisonous Snakes
- **Teleport** - Blink Dog Teleport - *Range, Animation*
- **Touch Damage** - Fire Elemental Fire Form - *Range*
- **Undead Fortitude** - Zombie Undead Fortitude - *Bypass Damage Types, Crits Bypass*

# Manual Rolls
CPR has several Manual Rolling settings that enable and specific what and when should get prompted for an input for a dice total. Enabling CPR's manual rolls replaces core's roll resolver, that is how foundry operates with custom roll resolvers. However, rolls that are not set to have a manual roll will get fulfilled through virtual dice instead.<br>

![ManualRollsAttack](https://github.com/user-attachments/assets/b205b7d2-d836-4dbc-a96f-2e67a6be777d)

CPR's roll resolver has more information and components than the core resolver. CPR's will display the name of the actor and item associated with the roll when available. The main difference with our roll resolver is it takes a ***total*** as opposed to individual dice amounts. *However*, in situations where the dice values themselves do matter, the input also accepts a ***comma separated list*** (i.e. "1, 2, 3"). If you ever want to skip the manual entry, clicking "Submit" without having anything in any inputs will fulfill the roll virtually.<br>

![ManualRollsSave](https://github.com/user-attachments/assets/2e871a74-d294-45d1-b6e3-bb3e22f5578a)

The dialog was designed with in-person play and speed in mind. When `attack` or `save` is found in the flavor of the dice roll, the dialog will have "Quick Buttons", which will let you quickly adjudicate a Fumble/Miss/Hit/Crit or a Fail/Success. Clicking these will check the dice target of the roll (hit or save threshold) and set the dice values to reach the desired outcome. Giving a total that reflects a fumble or critical will be properly reflected in the dice result.<br>

![ManualRollsDamage](https://github.com/user-attachments/assets/0dcbec92-7032-47f3-a311-a2e8d352decc)

The most unique part of CPR's roll resolver is how damage rolls are handled. With the core resolver, each part of the damage will be prompted separately, such that bonuses to damage will have their own dialog prompt. On the back end of the CPR Roll Resolver, all Damage type rolls are automatically rolled by the actual roll resolver, and later in the workflow once all damage bonuses are added, according to the CPR Manual Rolls settings, the damage rolls will be duplicated and fulfilled by a internal roll resolver, which will prompt for all the damage rolls at once with *totals separated by damage type*.

# Quick Conditions
The Interface setting Quick Conditions adds a button to the Use Condition and Active Effect Condition fields on the midi tab on activities. This button will appear when the field is hovered, and can be clicked on to open the Quick Condition interface window.

![UseCondition](https://github.com/user-attachments/assets/094cdd39-72de-4b43-8ebc-f9e61ab6c72e)

In this window, pre-built options for common conditions are available to add and edit. This will detect pre-existing values that match available conditions. If a string is not a known condition, it will display as a text box which can be edited but not removed. Conditions can be removed by clicking the '-' and added by clicking their name in the fieldset.

![QuickConditions](https://github.com/user-attachments/assets/bb4e88f2-a402-400d-b97b-00fd655d443b)

Currently available conditions, their searchKeys, and options:
- **typeOrRace** - `.includes(typeOrRace)` - `not`, `creatureTypes`
- **checkNearby** - `checkNearby` - `not`, `dispositions`, `range`
- **reaction** - `reaction` - `reactionTypes`
- **targetActorSize** - `.includes(target.traits.size)` - `not`, `sizes`
- **activityType** - `.includes(activity.actionType)` - `not`, `itemActionTypes`  
- **damageType** - `.damageDetail.some` - `not`, `damageTypes`  
- **critical** - `workflow.isCritical` - `not`  
- **alignment** - `target.details.alignment` - `not`, `alignments`  
- **ability** - `target.abilities.` - `not`, `abilities`, `comparators`, `scores`  
- **hasCondition** - `hasCondition` - `not`, `conditions`  
- **itemType** - `item.itemType` - `itemTypes`
import {macros, onHitMacro} from './macros.js';
import {flanking} from './macros/generic/syntheticAttack.js';
import {removeDumbV10Effects} from './macros/mechanics/conditions.js';
import {tokenMoved, combatUpdate} from './movement.js';
import {patching} from './patching.js';
import {addMenuSetting, chrisSettingsClassFeats, chrisSettingsCompendiums, chrisSettingsFeats, chrisSettingsGeneral, chrisSettingsHomewbrew, chrisSettingsManualRolling, chrisSettingsMechanics, chrisSettingsModule, chrisSettingsMonsterFeats, chrisSettingsRaceFeats, chrisSettingsRandomizer, chrisSettingsRandomizerHumanoid, chrisSettingsSpells, chrisSettingsSummons, chrisSettingsTroubleshoot} from './settingsMenu.js';
import {fixOrigin, itemDC} from './utility/effect.js';
import {effectAuraHooks} from './utility/effectAuras.js';
import {allRaces, npcRandomizer, updateChanceTable} from './utility/npcRandomizer.js';
import {rest} from './utility/rest.js';
import {tashaSummon} from './utility/tashaSummon.js';
import {templates} from './utility/templateEffect.js';
import {vaeEffectDescription, vaeTempItemButton} from './vae.js';
let moduleName = 'chris-premades';
export let humanoidSettings = {};
export function registerSettings() {
    game.settings.register(moduleName, 'Breaking Version Change', {
        'name': 'Breaking Version Change',
        'hint': 'Internal version number bumped when an update requires new imports.',
        'scope': 'world',
        'config': false,
        'type': Number,
        'default': 6
    });
    game.settings.register(moduleName, 'Show Names', {
        'name': 'Show Names',
        'hint': 'Enabling this will show target names in the target selector dialog (Used for certain features and spells).',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': true
    });
    addMenuSetting('Show Names', 'General');
    game.settings.register(moduleName, 'Priority Queue', {
        'name': 'Priority Queue',
        'hint': 'This setting allows macros from this module to have an on use priority order.  This prevents multiple pop-up dialogs from firing at the same time as well as applying damage modification changes in a certain order.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': true
    });
    addMenuSetting('Priority Queue', 'General');
    game.settings.register(moduleName, 'Item Replacer Access', {
        'name': 'Item Replacer Access',
        'hint': 'If enabled, players can replace their own items.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false
    });
    addMenuSetting('Item Replacer Access', 'General');
    game.settings.register(moduleName, 'Item Configuration Access', {
        'name': 'Item Configuration Access',
        'hint': 'If enabled, players can configure their own items.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false
    });
    addMenuSetting('Item Configuration Access', 'General');
    game.settings.register(moduleName, 'Movement Listener', {
        'name': 'Movement Listener',
        'hint': 'This setting allows certain macros from this module to function on token movement.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value && game.user.isGM) {
                Hooks.on('updateToken', tokenMoved);
            } else if (game.user.isGM) {
                Hooks.off('updateToken', tokenMoved);
            }
        }
    });
    addMenuSetting('Movement Listener', 'General');
    game.settings.register(moduleName, 'Template Listener', {
        'name': 'Template Listener',
        'hint': 'This setting allows certain macros from this module to function when tokens interact with templates.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value && game.user.isGM) {
                Hooks.on('updateToken', templates.move);
                Hooks.on('updateCombat', templates.combat);
            } else if (game.user.isGM) {
                Hooks.off('updateToken', templates.move);
                Hooks.on('updateCombat', templates.combat);
            }
        }
    });
    addMenuSetting('Template Listener', 'General');
    game.settings.register(moduleName, 'Tasha Actors', {
        'name': 'Keep Summon Actors Updated',
        'hint': 'This setting will keep actors from this module updated in the sidebar.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': async value => {
            if (value && game.user.isGM) await tashaSummon.setupFolder();
        }
    });
    addMenuSetting('Tasha Actors', 'Summons');
    game.settings.register(moduleName, 'Tasha Initiative', {
        'name': 'Minions use caster\'s initiative',
        'hint': 'Enabling this will have minions summoned from this module to use the caster\'s initiative instead of rolling their own.  Similar to the summon spells from Tasha\'s Cauldron Of Everything',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false
    });
    addMenuSetting('Tasha Initiative', 'Summons');
    game.settings.register(moduleName, 'Effect Auras', {
        'name': 'Effect Auras',
        'hint': 'This setting allows certain macros from this module to apply effect auras.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value && game.user.isGM) {
                Hooks.on('preUpdateActor', effectAuraHooks.preActorUpdate);
                Hooks.on('updateActor', effectAuraHooks.actorUpdate);
                Hooks.on('canvasReady', effectAuraHooks.canvasReady);
                Hooks.on('updateToken', effectAuraHooks.updateToken);
                Hooks.on('createToken', effectAuraHooks.createToken);
                Hooks.on('deleteToken', effectAuraHooks.deleteToken);
            } else if (game.user.isGM) {
                Hooks.off('preUpdateActor', effectAuraHooks.preActorUpdate);
                Hooks.off('updateActor', effectAuraHooks.actorUpdate);
                Hooks.off('canvasReady', effectAuraHooks.canvasReady);
                Hooks.off('updateToken', effectAuraHooks.updateToken);
                Hooks.off('createToken', effectAuraHooks.createToken);
                Hooks.off('deleteToken', effectAuraHooks.deleteToken);
            }
        }
    });
    addMenuSetting('Effect Auras', 'General');
    game.settings.register(moduleName, 'Active Effect Additions', {
        'name': 'Active Effect Additions',
        'hint': 'This setting allows active effects to have additional properties.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': true,
        'onChange': value => {
            if (value) {
                Hooks.on('preCreateActiveEffect', itemDC);
            } else {
                Hooks.off('preCreateActiveEffect', itemDC);
            }
        }
    });
    addMenuSetting('Active Effect Additions', 'General');
    game.settings.register(moduleName, 'Active Effect Origin Fix', {
        'name': 'Active Effect Origin Fix',
        'hint': 'This setting corrects the origin of effects on unlinked actors.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': true,
        'onChange': value => {
            if (value) {
                Hooks.on('createToken', fixOrigin);
            } else {
                Hooks.off('createToken', fixOrigin);
            }
        }
    });
    addMenuSetting('Active Effect Origin Fix', 'General');
    game.settings.register(moduleName, 'Automatic VAE Descriptions', {
        'name': 'Automatic VAE Descriptions',
        'hint': 'When enabled, this setting will automatically fill in VAE effect descriptions when possible.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('preCreateActiveEffect', vaeEffectDescription);
            } else {
                Hooks.off('preCreateActiveEffect', vaeEffectDescription);
            }
        }
    });
    addMenuSetting('Automatic VAE Descriptions', 'Module Integration');
    game.settings.register(moduleName, 'No NPC VAE Descriptions', {
        'name': 'No NPC VAE Descriptions',
        'hint': 'If enabled, automatic VAE descriptions will ignore effects created from NPCs.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false
    });
    addMenuSetting('No NPC VAE Descriptions', 'Module Integration');
    game.settings.register(moduleName, 'VAE Temporary Item Buttons', {
        'name': 'VAE Temporary Item Buttons',
        'hint': 'When enabled, this setting will add a button to use temporary items via VAE.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('visual-active-effects.createEffectButtons', vaeTempItemButton);
            } else {
                Hooks.off('visual-active-effects.createEffectButtons', vaeTempItemButton);
            }
        }
    });
    addMenuSetting('VAE Temporary Item Buttons', 'Module Integration');
    game.settings.register(moduleName, 'Condition Fixes', {
        'name': 'Blinded and Invisibility Changes',
        'hint': 'This setting restores the blinded and invisibility conditions to how they worked in version 9 of Foundry.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) removeDumbV10Effects();
        }
    });
    addMenuSetting('Condition Fixes', 'Mechanics');
    game.settings.register(moduleName, 'LastGM', {
        'name': 'LastGM',
        'hint': 'Last GM to join the game.',
        'scope': 'world',
        'config': false,
        'type': String
    });
    game.settings.register(moduleName, 'Combat Listener', {
        'name': 'Combat Listener',
        'hint': 'This setting allows certain macros from this module to function on combat changes.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value && game.user.isGM) {
                Hooks.on('updateCombat', combatUpdate);
            } else if (game.user.isGM) {
                Hooks.off('updateCombat', combatUpdate);
            }
        }
    });
    addMenuSetting('Combat Listener', 'General');
    game.settings.register(moduleName, 'Rest Listener', {
        'name': 'Short / Long Rest Listener',
        'hint': 'Enabling this allows the certain macros to function on short and long rests.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('dnd5e.restCompleted', rest);
            } else {
                Hooks.off('dnd5e.restCompleted', rest);
            }
        }
    });
    addMenuSetting('Rest Listener', 'General');
    game.settings.register(moduleName, 'Movement Triggers', {
        'name': 'Movement Triggers',
        'hint': 'Used to sync the movement queue.',
        'scope': 'world',
        'config': false,
        'type': Object,
        'default': {}
    });
    game.settings.register(moduleName, 'Use Additional Compendiums', {
        'name': 'Use Additional Compendiums',
        'hint': 'Should the item replacer check additional compendiums?',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false
    });
    addMenuSetting('Use Additional Compendiums', 'Compendiums');
    game.settings.register(moduleName, 'Additional Compendiums', {
        'name': 'Additional Compendiums',
        'hint': 'This should be a comma seperated list of compendium keys.  Highest prioirity should be on the left.',
        'scope': 'world',
        'config': false,
        'type': String,
        'default': 'midi-srd.Midi SRD Feats, midi-srd.Midi SRD Spells, midi-srd.Midi SRD Items, midi-qol.midiqol-sample-items'
    });
    addMenuSetting('Additional Compendiums', 'Compendiums');
    game.settings.register(moduleName, 'Item Compendium', {
        'name': 'Personal Item Compendium',
        'hint': 'A compendium full of items to pick from (DDB items compendium by default).',
        'scope': 'world',
        'config': false,
        'type': String,
        'default': 'world.ddb-' + game.world.id + '-ddb-items'
    });
    addMenuSetting('Item Compendium', 'Compendiums');
    game.settings.register(moduleName, 'Spell Compendium', {
        'name': 'Personal Spell Compendium',
        'hint': 'A compendium full of spells to pick from (DDB spells compendium by default).',
        'scope': 'world',
        'config': false,
        'type': String,
        'default': 'world.ddb-' + game.world.id + '-ddb-spells'
    });
    addMenuSetting('Spell Compendium', 'Compendiums');
    game.settings.register(moduleName, 'Monster Compendium', {
        'name': 'Personal Monster Compendium',
        'hint': 'A compendium full of monsters to pick from (DDB monster compendium by default).',
        'scope': 'world',
        'config': false,
        'type': String,
        'default': 'world.ddb-' + game.world.id + '-ddb-monsters'
    });
    addMenuSetting('Monster Compendium', 'Compendiums');
    game.settings.register(moduleName, 'Racial Trait Compendium', {
        'name': 'Personal Racial Trait Compendium',
        'hint': 'A compendium full of racial traits to pick from (DDB monster compendium by default).',
        'scope': 'world',
        'config': false,
        'type': String,
        'default': 'world.ddb-' + game.world.id + '-ddb-racial-traits'
    });
    addMenuSetting('Racial Trait Compendium', 'Compendiums');
    game.settings.register(moduleName, 'Condition Resistance', {
        'name': 'Condition Resistance Mechanic',
        'hint': 'Enabling this allows the automation condition resistance via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preItemRoll', macros.conditionResistanceEarly);
                Hooks.on('midi-qol.RollComplete', macros.conditionResistanceLate);
            } else {
                Hooks.off('midi-qol.preItemRoll', macros.conditionResistanceEarly);
                Hooks.off('midi-qol.RollComplete', macros.conditionResistanceLate);
            }
        }
    });
    addMenuSetting('Condition Resistance', 'Mechanics');
    game.settings.register(moduleName, 'Condition Vulnerability', {
        'name': 'Condition Vulnerability Mechanic',
        'hint': 'Enabling this allows the automation condition vulnerability via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preItemRoll', macros.conditionVulnerabilityEarly);
                Hooks.on('midi-qol.RollComplete', macros.conditionVulnerabilityLate);
            } else {
                Hooks.off('midi-qol.preItemRoll', macros.conditionVulnerabilityEarly);
                Hooks.off('midi-qol.RollComplete', macros.conditionVulnerabilityLate);
            }
        }
    });
    addMenuSetting('Condition Vulnerability', 'Mechanics');
    game.settings.register(moduleName, 'On Hit', {
        'name': 'On Hit Automation',
        'hint': 'Enabling this allows the automation for certain "On Hit" features.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.RollComplete', onHitMacro);
            } else {
                Hooks.off('midi-qol.RollComplete', onHitMacro);
            }
        }
    });
    addMenuSetting('On Hit', 'General');
    game.settings.register(moduleName, 'Armor of Agathys', {
        'name': 'Armor of Agathys Automation',
        'hint': 'Enabling this allows the automation of the Armor of Agathys spell via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.RollComplete', macros.armorOfAgathys);
            } else {
                Hooks.off('midi-qol.RollComplete', macros.armorOfAgathys);
            }
        }
    });
    addMenuSetting('Armor of Agathys', 'Spells');
    game.settings.register(moduleName, 'Beacon of Hope', {
        'name': 'Beacon of Hope Automation',
        'hint': 'Enabling this allows the automation of the Beacon of Hope spell via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.damageApplied', macros.beaconOfHope);
            } else {
                Hooks.off('midi-qol.damageApplied', macros.beaconOfHope);
            }
        }
    });
    addMenuSetting('Beacon of Hope', 'Spells');
    game.settings.register(moduleName, 'Darkness', {
        'name': 'Darkness Spell Automation',
        'hint': 'Enabling this allows the automation of the Darkness spell via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preAttackRoll', macros.darkness.hook);
            } else {
                Hooks.off('midi-qol.preAttackRoll', macros.darkness.hook);
            }
        }
    });
    addMenuSetting('Darkness', 'Spells');
    game.settings.register(moduleName, 'Fog Cloud', {
        'name': 'Fog Cloud Spell Automation',
        'hint': 'Enabling this allows the automation of the Fog Cloud spell via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preAttackRoll', macros.fogCloud.hook);
            } else {
                Hooks.off('midi-qol.preAttackRoll', macros.fogCloud.hook);
            }
        }
    });
    addMenuSetting('Fog Cloud', 'Spells');
    game.settings.register(moduleName, 'Death Ward', {
        'name': 'Death Ward Automation',
        'hint': 'Enabling this allows the automation of the Death Ward spell via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.damageApplied', macros.deathWard);
            } else {
                Hooks.off('midi-qol.damageApplied', macros.deathWard);
            }
        }
    });
    addMenuSetting('Death Ward', 'Spells');
    game.settings.register(moduleName, 'Elemental Adept', {
        'name': 'Elemental Adept Automation',
        'hint': 'Enabling this allows the automation of the Elemental Adept feat via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preambleComplete', macros.elementalAdept.early);
                Hooks.on('midi-qol.preDamageRollComplete', macros.elementalAdept.damage);
                Hooks.on('midi-qol.RollComplete', macros.elementalAdept.late);
            } else {
                Hooks.off('midi-qol.preambleComplete', macros.elementalAdept.early);
                Hooks.off('midi-qol.preDamageRollComplete', macros.elementalAdept.damage);
                Hooks.off('midi-qol.RollComplete', macros.elementalAdept.late);
            }
        }
    });
    addMenuSetting('Elemental Adept', 'Feats');
    game.settings.register(moduleName, 'Mirror Image', {
        'name': 'Mirror Image Automation',
        'hint': 'Enabling this allows the automation of the Mirror Image spell via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.AttackRollComplete', macros.mirrorImage);
            } else {
                Hooks.off('midi-qol.AttackRollComplete', macros.mirrorImage);
            }
        }
    });
    addMenuSetting('Mirror Image', 'Spells');
    game.settings.register(moduleName, 'Protection from Evil and Good', {
        'name': 'Protection from Evil and Good Automation',
        'hint': 'Enabling this allows the automation of the Protection from Evil and Good spell via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preAttackRoll', macros.protectionFromEvilAndGood);
            } else {
                Hooks.off('midi-qol.preAttackRoll', macros.protectionFromEvilAndGood);
            }
        }
    });
    addMenuSetting('Protection from Evil and Good', 'Spells');
    game.settings.register(moduleName, 'Sanctuary', {
        'name': 'Sanctuary Automation',
        'hint': 'Enabling this allows the automation of the Sanctuary spell via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preItemRoll', macros.sanctuary.hook);
            } else {
                Hooks.off('midi-qol.preItemRoll', macros.sanctuary.hook);
            }
        }
    });
    addMenuSetting('Sanctuary', 'Spells');
    game.settings.register(moduleName, 'Ranged Smite', {
        'name': 'Ranged Divine Smite',
        'hint': 'Enabling this will allow the Divine Smite feature to be used on ranged attacks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false
    });
    addMenuSetting('Ranged Smite', 'Homebrew');
    game.settings.register(moduleName, 'Unarmed Strike Smite', {
        'name': 'Unarmed Strike Divine Smite',
        'hint': 'Enabling this will allow the Divine Smite feature to be used on unarmed Strikes.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false
    });
    addMenuSetting('Unarmed Strike Smite', 'Homebrew');
    game.settings.register(moduleName, 'DMG Cleave', {
        'name': 'DMG Cleave Mechanic',
        'hint': 'Enabling this allows the automation of the cleave mechanic from the DMG workshop section via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.RollComplete', macros.cleave);
            } else {
                Hooks.off('midi-qol.RollComplete', macros.cleave);
            }
        }
    });
    addMenuSetting('DMG Cleave', 'Mechanics');
    game.settings.register(moduleName, 'Wildhunt', {
        'name': 'Shifter Wildhunt Automation',
        'hint': 'Enabling this allows the automation of the Shifter Wildhunt feature via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preAttackRoll', macros.wildhunt);
            } else {
                Hooks.off('midi-qol.preAttackRoll', macros.wildhunt);
            }
        }
    });
    addMenuSetting('Wildhunt', 'Race Features');
    game.settings.register(moduleName, 'Undead Fortitude', {
        'name': 'Undead Fortitude Automation',
        'hint': 'Enabling this allows the automation of the Undead Fortitude feature via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.damageApplied', macros.monster.zombie.undeadFortitude);
            } else {
                Hooks.off('midi-qol.damageApplied', macros.monster.zombie.undeadFortitude);
            }
        }
    });
    addMenuSetting('Undead Fortitude', 'Monster Features');
    game.settings.register(moduleName, 'Exploding Heals', {
        'name': 'Exploding Heals',
        'hint': 'Enabling this allows the automation of the homebrew rule to have exploding dice for all healing rolls via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preDamageRollComplete', macros.explodingHeals);
            } else {
                Hooks.off('midi-qol.preDamageRollComplete', macros.explodingHeals);
            }
        }
    });
    addMenuSetting('Exploding Heals', 'Homebrew');
    game.settings.register(moduleName, 'Shield Guardian', {
        'name': 'Shield Guardian Automation',
        'hint': 'Enabling this allows the automation of the Shield Guardian\'s Bound feature via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.damageApplied', macros.mastersAmulet);
            } else {
                Hooks.off('midi-qol.damageApplied', macros.mastersAmulet);
            }
        }
    });
    addMenuSetting('Shield Guardian', 'Monster Features');
    game.settings.register(moduleName, 'Warding Bond', {
        'name': 'Warding Bond Automation',
        'hint': 'Enabling this allows the automation of the Warding Bond spell via the use of hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value && game.user.isGM) {
                Hooks.on('updateToken', macros.wardingBond.moveTarget);
                Hooks.on('updateToken', macros.wardingBond.moveSource);
            } else if (game.user.isGM) {
                Hooks.off('updateToken', macros.wardingBond.moveTarget);
                Hooks.off('updateToken', macros.wardingBond.moveSource);
            }
        }
    });
    addMenuSetting('Warding Bond', 'Spells');
    game.settings.register(moduleName, 'Attack Listener', {
        'name': 'Attack Listener',
        'hint': 'This setting is required for certain macros to help with removing flanking and canceling attacks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preAttackRoll', flanking);
            } else {
                Hooks.off('midi-qol.preAttackRoll', flanking);
            }
        }
    });
    addMenuSetting('Attack Listener', 'General');
    game.settings.register(moduleName, 'Magic Missile Toggle', {
        'name': 'Magic Missile Toggle',
        'hint': 'Enabling this has the Magic Missile spell roll the dice multiple times for damage.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false
    });
    addMenuSetting('Magic Missile Toggle', 'Homebrew');
    game.settings.register(moduleName, 'Strength of the Grave', {
        'name': 'Strength of the Grave Automation',
        'hint': 'Enabling this allows the automation of the Strength of the Grave feature via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.damageApplied', macros.strengthOfTheGrave);
            } else {
                Hooks.off('midi-qol.damageApplied', macros.strengthOfTheGrave);
            }
        }
    });
    addMenuSetting('Strength of the Grave', 'Class Features');
    game.settings.register(moduleName, 'Relentless Endurance', {
        'name': 'Relentless Endurance Automation',
        'hint': 'Enabling this allows the automation of the Relentless Endurance feature via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.damageApplied', macros.relentlessEndurance);
            } else {
                Hooks.off('midi-qol.damageApplied', macros.relentlessEndurance);
            }
        }
    });
    addMenuSetting('Relentless Endurance', 'Race Features');
    game.settings.register(moduleName, 'Shadow of Moil', {
        'name': 'Shadow of Moil Spell Automation',
        'hint': 'Enabling this allows the automation of the Shadow of Moil spell via the use of Midi-Qol hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preAttackRoll', macros.shadowOfMoil.hook);
            } else {
                Hooks.off('midi-qol.preAttackRoll', macros.shadowOfMoil.hook);
            }
        }
    });
    addMenuSetting('Shadow of Moil', 'Spells');
    game.settings.register(moduleName, 'Emboldening Bond', {
        'name': 'Emboldening Bond',
        'hint': 'Enabling this allows the automation of the Shadow of Moil spell via the use of Foundry hooks.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value && game.user.isGM) {
                Hooks.on('updateToken', macros.emboldeningBond.move);
            } else if (game.user.isGM) {
                Hooks.off('updateToken', macros.emboldeningBond.move);
            }
        }
    });
    addMenuSetting('Emboldening Bond', 'Class Features');
    game.settings.register(moduleName, 'Manual Rolls', {
        'name': 'Manual Rolls',
        'hint': 'Enabling this will prompt the GM to input attack, save, and damage totals. This only applies to rolls that involve Midi-Qol.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('midi-qol.preCheckHits', macros.manualRolls.attackRoll);
                Hooks.on('midi-qol.postCheckSaves', macros.manualRolls.saveRolls);
                patching();
            } else {
                Hooks.off('midi-qol.preCheckHits', macros.manualRolls.attackRoll);
                Hooks.off('midi-qol.postCheckSaves', macros.manualRolls.saveRolls);
            }
        }
    });
    addMenuSetting('Manual Rolls', 'Manual Rolling');
    game.settings.register(moduleName, 'Ignore GM', {
        'name': 'Ignore GM Rolls',
        'hint': 'Do no prompt when there are no player owned tokens involved.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': true
    });
    addMenuSetting('Ignore GM', 'Manual Rolling');
    game.settings.register(moduleName, 'Use Randomizer', {
        'name': 'Randomizer',
        'hint': 'Change this.',
        'scope': 'world',
        'config': false,
        'type': Boolean,
        'default': false,
        'onChange': value => {
            if (value) {
                Hooks.on('createToken', npcRandomizer);
            } else {
                Hooks.off('createToken', npcRandomizer);
            }
        }
    });
    addMenuSetting('Use Randomizer', 'Randomizer');
    game.settings.register(moduleName, 'Humanoid Randomizer Settings', {
        'name': 'Humanoid Randomizer Settings',
        'hint': 'Change this.',
        'scope': 'world',
        'config': false,
        'type': Object,
        'default': allRaces,
        'onChange': value => {
            if (value) updateChanceTable();
        }
    });
    addMenuSetting('Humanoid Randomizer Settings', 'Randomizer');
    game.settings.registerMenu(moduleName, 'General', {
        name: 'General',
        label: 'General',
        hint: 'General settings for most automations.',
        icon: 'fas fa-gears',
        type: chrisSettingsGeneral,
        restricted: true
    });
    game.settings.registerMenu(moduleName, 'Compendiums', {
        name: 'Compendium',
        label: 'Compendium',
        hint: 'Compendium settings item replacement and macros.',
        icon: 'fas fa-atlas',
        type: chrisSettingsCompendiums,
        restricted: true
    });
    game.settings.registerMenu(moduleName, 'Mechanics', {
        name: 'Mechanics',
        label: 'Mechanics',
        hint: 'Settings related to game mechanics.',
        icon: 'fas fa-dice',
        type: chrisSettingsMechanics,
        restricted: true
    });
    game.settings.registerMenu(moduleName, 'Spells', {
        name: 'Spells',
        label: 'Spells',
        hint: 'Settings for specific spell automations.',
        icon: 'fas fa-wand-magic',
        type: chrisSettingsSpells,
        restricted: true
    });
    game.settings.registerMenu(moduleName, 'Feats', {
        name: 'Feats',
        label: 'Feats',
        hint: 'Settings for specific feat automations.',
        icon: 'fas fa-crystal-ball',
        type: chrisSettingsFeats,
        restricted: true
    });
    game.settings.registerMenu(moduleName, 'Class Features', {
        name: 'Class Features',
        label: 'Class Features',
        hint: 'Settings for specific class features.',
        icon: 'fas fa-swords',
        type: chrisSettingsClassFeats,
        restricted: true
    });
    game.settings.registerMenu(moduleName, 'Race Features', {
        name: 'Race Features',
        label: 'Race Features',
        hint: 'Settings for specific race features.',
        icon: 'fas fa-solid fa-nesting-dolls',
        type: chrisSettingsRaceFeats,
        restricted: true
    });
    game.settings.registerMenu(moduleName, 'Monster Features', {
        name: 'Monster Features',
        label: 'Monster Features',
        hint: 'Settings for specific monster features.',
        icon: 'fas fa-dragon',
        type: chrisSettingsMonsterFeats,
        restricted: true
    });
    game.settings.registerMenu(moduleName, 'Summons', {
        name: 'Summons',
        label: 'Summons',
        hint: 'Settings related to summons.',
        icon: 'fas fa-hand-holding-magic',
        type: chrisSettingsSummons,
        restricted: true
    });
    game.settings.registerMenu(moduleName, 'Homebrew', {
        name: 'Homebrew',
        label: 'Homebrew',
        hint: 'Optional settings for homebrew features.',
        icon: 'fas fa-cauldron',
        type: chrisSettingsHomewbrew,
        restricted: true
    });
    game.settings.registerMenu(moduleName, 'Module Integration', {
        name: 'Module Integration',
        label: 'Module Integration',
        hint: 'Settings for integrations with other modules.',
        icon: 'fas fa-puzzle-piece',
        type: chrisSettingsModule,
        restricted: true
    });
    game.settings.registerMenu(moduleName, 'Manual Rolling', {
        name: 'Manual Rolling',
        label: 'Manual Rolling',
        hint: 'Settings for manual rolling.',
        icon: 'fas fa-calculator',
        type: chrisSettingsManualRolling,
        restricted: true
    });
//    game.settings.registerMenu(moduleName, 'Randomizer', {
//        name: 'Randomizer',
//        label: 'Randomizer',
//        hint: 'Optional settings for randomizer features.',
//        icon: 'fas fa-dice',
//        type: chrisSettingsRandomizer,
//        restricted: true
//    });
    game.settings.registerMenu(moduleName, 'Troubleshooter', {
        name: 'Troubleshooter',
        label: 'Troubleshooter',
        hint: 'Used to troubleshoot issues with this module.',
        icon: 'fas fa-screwdriver-wrench',
        type: chrisSettingsTroubleshoot,
        restricted: true
    });
}
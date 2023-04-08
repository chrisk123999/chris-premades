import {macros, onHitMacro} from './macros.js';
import {removeDumbV10Effects} from './macros/mechanics/conditions/conditions.js';
import {tokenMoved, combatUpdate} from './movement.js';
import {preCreateActiveEffect} from './utility/effect.js';
import {effectAuraHooks} from './utility/effectAuras.js';
import {vaeEffectDescription, vaeTempItemButton} from './vae.js';
let moduleName = 'chris-premades';
let debouncedReload = foundry.utils.debounce(() => window.location.reload(), 100);
export function registerSettings() {
	game.settings.register(moduleName, 'Breaking Version Change', {
		'name': 'Breaking Version Change',
		'hint': 'Internal version number bumped when an update requires new imports.',
		'scope': 'world',
		'config': false,
		'type': Number,
		'default': 3
	});
	game.settings.register(moduleName, 'Show Names', {
		'name': 'Show Names',
		'hint': 'Enabling this will show target names in the target selector dialog (Used for certain features and spells).',
		'scope': 'world',
		'config': true,
		'type': Boolean,
		'default': true
	});
	game.settings.register(moduleName, 'Priority Queue', {
		'name': 'Priority Queue',
		'hint': 'This setting allows macros from this module to have an on use priority order.  This prevents multiple pop-up dialogs from firing at the same time as well as applying damage modification changes in a certain order.',
		'scope': 'world',
		'config': true,
		'type': Boolean,
		'default': true
	});
	game.settings.register(moduleName, 'Movement Listener', {
		'name': 'Movement Listener',
		'hint': 'This setting allows certain macros from this module to function on token movement.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Effect Auras', {
		'name': 'Effect Auras',
		'hint': 'This setting allows certain macros from this module to function.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Active Effect Additions', {
		'name': 'Active Effect Additions',
		'hint': 'This setting allows active effects to have additional properties.',
		'scope': 'world',
		'config': true,
		'type': Boolean,
		'default': true,
		'onChange': value => {
			if (value) {
				Hooks.on('preCreateActiveEffect', preCreateActiveEffect);
			} else {
				Hooks.off('preCreateActiveEffect', preCreateActiveEffect);
			}
		}
	});
	game.settings.register(moduleName, 'Automatic VAE Descriptions', {
		'name': 'Automatic VAE Descriptions',
		'hint': 'When enabled, this setting will automatically fill in VAE effect descriptions when possible.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'No NPC VAE Descriptions', {
		'name': 'No NPC VAE Descriptions',
		'hint': 'If enabled, automatic VAE descriptions will ignore effects created from NPCs.',
		'scope': 'world',
		'config': true,
		'type': Boolean,
		'default': false
	});
	game.settings.register(moduleName, 'VAE Temporary Item Buttons', {
		'name': 'VAE Temporary Item Buttons',
		'hint': 'When enabled, this setting will add a button to use temporary items via VAE.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Condition Fixes', {
		'name': 'Condition Fixes',
		'hint': 'This setting removes the V10 changes to invisible and blinded.',
		'scope': 'world',
		'config': true,
		'type': Boolean,
		'default': false,
		'onChange': value => {
			if (value) {
				removeDumbV10Effects();
			} else {
				debouncedReload();
			}
		}
	});
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
		'config': true,
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
		'config': true,
		'type': Boolean,
		'default': false
	});
	game.settings.register(moduleName, 'Additional Compendiums', {
		'name': 'Additional Compendiums',
		'hint': 'This should be a comma seperated list of compendium keys.  Highest prioirity should be on the left.',
		'scope': 'world',
		'config': true,
		'type': String,
		'default': 'midi-srd.Midi SRD Feats, midi-srd.Midi SRD Spells, midi-srd.Midi SRD Items, midi-qol.midiqol-sample-items'
	});
	game.settings.register(moduleName, 'Item Compendium', {
		'name': 'Personal Item Compendium',
		'hint': 'A compendium full of items to pick from (DDB items compendium by default).',
		'scope': 'world',
		'config': true,
		'type': String,
		'default': 'world.ddb-' + game.world.id + '-ddb-items'
	});
	game.settings.register(moduleName, 'Spell Compendium', {
		'name': 'Personal Spell Compendium',
		'hint': 'A compendium full of spells to pick from (DDB spells compendium by default).',
		'scope': 'world',
		'config': true,
		'type': String,
		'default': 'world.ddb-' + game.world.id + '-ddb-spells'
	});
	game.settings.register(moduleName, 'Condition Resistance', {
		'name': 'Condition Resistance Mechanic',
		'hint': 'Enabling this allows the automation condition resistance via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Condition Vulnerability', {
		'name': 'Condition Vulnerability Mechanic',
		'hint': 'Enabling this allows the automation condition vulnerability via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'On Hit', {
		'name': 'On Hit Automation',
		'hint': 'Enabling this allows the automation for certain "On Hit" features.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Armor of Agathys', {
		'name': 'Armor of Agathys Automation',
		'hint': 'Enabling this allows the automation of the Armor of Agathys spell via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Beacon of Hope', {
		'name': 'Beacon of Hope Automation',
		'hint': 'Enabling this allows the automation of the Beacon of Hope spell via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Darkness', {
		'name': 'Darkness Spell Automation',
		'hint': 'Enabling this allows the automation of the Darkness spell via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Death Ward', {
		'name': 'Death Ward Automation',
		'hint': 'Enabling this allows the automation of the Death Ward spell via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Elemental Adept', {
		'name': 'Elemental Adept Automation',
		'hint': 'Enabling this allows the automation of the Elemental Adept feat via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
		'type': Boolean,
		'default': false,
		'onChange': value => {
			if (value) {
				Hooks.on('midi-qol.damageApplied', macros.elementalAdept);
			} else {
				Hooks.off('midi-qol.damageApplied', macros.elementalAdept);
			}
		}
	});
	game.settings.register(moduleName, 'Mirror Image', {
		'name': 'Mirror Image Automation',
		'hint': 'Enabling this allows the automation of the Mirror Image spell via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Protection from Evil and Good', {
		'name': 'Protection from Evil and Good Automation',
		'hint': 'Enabling this allows the automation of the Protection from Evil and Good spell via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Sanctuary', {
		'name': 'Sanctuary Automation',
		'hint': 'Enabling this allows the automation of the Sanctuary spell via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
		'type': Boolean,
		'default': false,
		'onChange': value => {
			if (value) {
				Hooks.on('midi-qol.preItemRoll', macros.sanctuary);
			} else {
				Hooks.off('midi-qol.preItemRoll', macros.sanctuary);
			}
		}
	});
	game.settings.register(moduleName, 'Defensive Field', {
		'name': 'Guardian Armor: Defensive Field',
		'hint': 'Enabling this allows the Defensive Field feature to properly get reset during a long rest even if the Artificer does not have it toggled on.',
		'scope': 'world',
		'config': true,
		'type': Boolean,
		'default': false,
		'onChange': value => {
			if (value) {
				Hooks.on('dnd5e.restCompleted', macros.armorModel.longRest);
			} else {
				Hooks.off('dnd5e.restCompleted', macros.armorModel.longRest);
			}
		}
	});
	game.settings.register(moduleName, 'Ranged Smite', {
		'name': 'Ranged Divine Smite',
		'hint': 'Enabling this will allow the Divine Smite feature to be used on ranged attacks.',
		'scope': 'world',
		'config': true,
		'type': Boolean,
		'default': false
	});
	game.settings.register(moduleName, 'Unarmed Strike Smite', {
		'name': 'Unarmed Strike Divine Smite',
		'hint': 'Enabling this will allow the Divine Smite feature to be used on unarmed Strikes.',
		'scope': 'world',
		'config': true,
		'type': Boolean,
		'default': false
	});
	game.settings.register(moduleName, 'DMG Cleave', {
		'name': 'DMG Cleave Mechanic',
		'hint': 'Enabling this allows the automation of the cleave mechanic from the DMG workshop section via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Wildhunt', {
		'name': 'Shifter Wildhunt Automation',
		'hint': 'Enabling this allows the automation of the Shifter Wildhunt feature via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Undead Fortitude', {
		'name': 'Undead Fortitude Automation',
		'hint': 'Enabling this allows the automation of the Undead Fortitude feature via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
	game.settings.register(moduleName, 'Exploding Heals', {
		'name': 'Exploding Heals',
		'hint': 'Enabling this allows the automation of the homebrew rule to have exploding dice for all healing rolls via the use of Midi-Qol hooks.',
		'scope': 'world',
		'config': true,
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
}
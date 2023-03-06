import {macros, onHitMacro} from './macros.js';
import {tokenMoved, combatUpdate} from './movement.js';
let moduleName = 'chris-premades';
export function registerSettings() {
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
			if (value || game.user.isGM) {
				Hooks.on('updateToken', tokenMoved);
			} else if (game.user.isGM) {
				Hooks.off('updateToken', tokenMoved);
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
			if (value || game.user.isGM) {
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
	game.settings.register(moduleName, 'Item Compendium', {
		'name': 'Personal Item Compendium',
		'hint': 'An compendium full of items to pick from (DDB items compendium by default).',
		'scope': 'world',
		'config': true,
		'type': String,
		'default': 'world.ddb-' + game.world.id + '-ddb-items'
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
				Hooks.on('midi-qol.AttackRollComplete', macros.sanctuary);
			} else {
				Hooks.off('midi-qol.AttackRollComplete', macros.sanctuary);
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
}
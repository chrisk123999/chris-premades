import {macros} from './macros.js';
let moduleName = 'chris-premades';
export function registerSettings() {
	game.settings.register(moduleName, 'Armor of Agathys', {
		'name': 'Armor of Agathys Automation',
		'hint': 'Armor of Agathys Automation',
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
	game.settings.register(moduleName, 'Condition Resistance', {
		'name': 'Condition Resistance Mechanic',
		'hint': 'Condition Resistance Mechanic',
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
		'hint': 'Condition Vulnerability Mechanic',
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
		'name': 'Darkness Spell',
		'hint': 'Darkness Spell',
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
		'name': 'Death Ward',
		'hint': 'Death Ward',
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
}
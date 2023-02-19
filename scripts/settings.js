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
			console.log('Chris | Hook toggled!');
			if (value) {
				Hooks.on('midi-qol.RollComplete', macros.armorOfAgathys);
			} else {
				Hooks.off('midi-qol.RollComplete', macros.armorOfAgathys);
			}
		}
	});
}
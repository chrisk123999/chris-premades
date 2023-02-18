let moduleName = 'chris-premades';
export function registerSettings() {
	game.settings.register(moduleName, 'Armor of Agathys', {
		'name': 'Armor of Agathys Automation',
		'hint': 'Armor of Agathys Automation',
		'default': false,
		'scope': 'world',
		'config': true,
		'type': Boolean
	}
}
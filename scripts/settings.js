function addSetting(options, category) {
    game.settings.register('chris-premades', options.name, options);
}
export function registerSettings() {
    addSetting({
        name: 'gmID',
        hint: 'The GM who is in control.',
        scope: 'world',
        config: false,
        type: String,
        default: ''
    }, 'hidden');
    addSetting({
        name: 'hideNames',
        hint: 'Hide names for enemy targets:',
        scope: 'world',
        config: false,
        type: Boolean,
        default: false
    }, 'Dialog');
}
export function getSetting(key) {
    return game.settings.get('chris-premades', key);
}
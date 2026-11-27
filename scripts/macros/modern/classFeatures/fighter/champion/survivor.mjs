function deathSave({config}) {
    if (config.saveType !== 'death') return;
    config.rolls ??= [{}];
    config.rolls[0].options ??= {};
    config.rolls[0].options.criticalSuccess = Math.min(config.rolls[0].options.criticalSuccess ?? 20, 18);
}
export const survivor = {
    name: 'Survivor',
    version: '2.1.11',
    rules: '2024',
    save: [
        {
            pass: 'actorSituational',
            macro: deathSave,
            priority: 50
        }
    ]
};

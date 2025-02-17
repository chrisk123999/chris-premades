import {dialogUtils, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';
async function target({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !workflow.item) return;
    let validIdentifiers = ['powerWordHeal', 'powerWordKill'];
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (!identifier) return;
    if (!validIdentifiers.includes(identifier)) return;
    let nearbyTargets = [];
    let range = itemUtils.getConfig(item, 'range');
    workflow.targets.forEach(token => {
        nearbyTargets.push(...tokenUtils.findNearby(token, range, 'ally', {includeIncapacitated: true}));
    });
    if (!nearbyTargets.length) return;
    let selection;
    if (nearbyTargets.length === 1) {
        selection = nearbyTargets[0];
    } else {
        selection = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.WordsOfCreation.Target', nearbyTargets, {skipDeadAndUnconscious: false});
        if (!selection) return;
        selection = selection[0];
    }
    let targets = Array.from(workflow.targets);
    targets.push(selection);
    await genericUtils.updateTargets(targets);
    await item.displayCard();
}
export let wordsOfCreation = {
    name: 'Words of Creation',
    version: '1.1.34',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: target,
                priority: 150
            }
        ]
    },
    config: [
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'number',
            default: 10,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
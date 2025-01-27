import {constants, itemUtils} from '../../../../utils.js';
async function skill({trigger: {entity: item, saveId, options, actor}}) {
    let saves = itemUtils.getConfig(item, 'saves');
    if (!saves.length) return;
    if (!saves.includes(saveId) || options.advantage) return;
    let blockingConditions = itemUtils.getConfig(item, 'blockingConditions');
    if (actor.statuses.some(i => blockingConditions.includes(i))) return;
    options.advantage = true;
}
export let dangerSense = {
    name: 'Danger Sense',
    version: '1.1.22',
    rules: 'modern',
    save: [
        {
            pass: 'situational',
            macro: skill,
            priority: 50
        }
    ],
    config: [
        {
            value: 'saves',
            label: 'CHRISPREMADES.Config.SaveAbilities',
            type: 'select-many',
            default: ['dex'],
            options: constants.abilityOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'blockingConditions',
            label: 'CHRISPREMADES.Config.BlockingStatuses',
            type: 'select-many',
            default: ['incapacitated'],
            options: constants.statusOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
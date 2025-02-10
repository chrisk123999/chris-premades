import {constants, itemUtils, tokenUtils} from '../../../utils.js';
import {divineSmite} from './divineSmite.js';
async function use({trigger, workflow}) {
    if (!workflow.failedSaves.size || !workflow.token) return;
    let distance = itemUtils.getConfig(workflow.item, 'distance');
    await Promise.all(workflow.failedSaves.map(async token => await tokenUtils.pushToken(workflow.token, token, distance)));
}
export let thunderousSmite = {
    name: 'Thunderous Smite',
    version: '1.1.14',
    rules: 'modern',
    midi: {
        actor: divineSmite.midi.actor,
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'thunder',
            category: 'homebrew',
            homebrew: true,
            options: constants.damageTypeOptions
        },
        {
            value: 'diceSize',
            label: 'CHRISPREMADES.Config.DiceSize',
            type: 'select',
            default: 'd6',
            options: constants.diceSizeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'baseDiceNumber',
            label: 'CHRISPREMADES.Config.BaseDiceNumber',
            type: 'number',
            default: 2,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'distance',
            label: 'CHRISPREMADES.Config.Distance',
            type: 'number',
            default: 10,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
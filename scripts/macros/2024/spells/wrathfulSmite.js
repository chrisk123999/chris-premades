import {actorUtils, constants, effectUtils, itemUtils} from '../../../utils.js';
import {divineSmite} from './divineSmite.js';
async function use({trigger, workflow}) {
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'flags.midi-qol.OverTime',
                mode: 0,
                value: 'turn=end, allowIncapacitated=true, rollType=save, saveAbility=' + workflow.activity.save.ability.first() + ', saveDC=' + itemUtils.getSaveDC(workflow.item) + ', saveDamage=nodamage, saveRemove=true, saveMagic=true',
                priority: 20
            }
        ]
    };
    await Promise.all(workflow.failedSaves.map(async token => {
        if (actorUtils.checkTrait(token.actor, 'CI', 'frightened')) return;
        await effectUtils.createEffect(token.actor, effectData, {conditions: ['frightened']});
    }));
}
export let wrathfulSmite = {
    name: 'Wrathful Smite',
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
            default: 'necrotic',
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
            type: 'text',
            default: 1,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
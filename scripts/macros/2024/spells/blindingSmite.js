import {actorUtils, constants, effectUtils, itemUtils} from '../../../utils.js';
import {divineSmite} from './divineSmite.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let ability = itemUtils.getConfig(workflow.item, 'ability');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'flags.midi-qol.OverTime',
                mode: 0,
                value: 'turn=end, allowIncapacitated=true, rollType=save, saveAbility=' + ability + ', saveDC=' + itemUtils.getSaveDC(workflow.item) + ', saveDamage=nodamage, saveRemove=true, saveMagic=true',
                priority: 20
            }
        ]
    };
    await Promise.all(workflow.targets.map(async token => {
        if (actorUtils.checkTrait(token.actor, 'ci', 'blinded')) return;
        await effectUtils.createEffect(token.actor, effectData, {conditions: ['blinded']});
    }));
}
export let blindingSmite = {
    name: 'Blinding Smite',
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
            default: 'radiant',
            category: 'homebrew',
            homebrew: true,
            options: constants.damageTypeOptions
        },
        {
            value: 'diceSize',
            label: 'CHRISPREMADES.Config.DiceSize',
            type: 'select',
            default: 'd8',
            options: constants.diceSizeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'baseDiceNumber',
            label: 'CHRISPREMADES.Config.BaseDiceNumber',
            type: 'text',
            default: 3,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'ability',
            label: 'CHRISPREMADES.Config.Ability',
            type: 'select',
            default: 'con',
            options: constants.abilityOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
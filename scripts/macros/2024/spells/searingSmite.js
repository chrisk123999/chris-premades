import {constants, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
import {divineSmite} from './divineSmite.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    let diceSize = itemUtils.getConfig(workflow.item, 'diceSize');
    let diceNumber = Number(itemUtils.getConfig(workflow.item, 'baseDiceNumber'));
    let formula = ((workflow.castData.castLevel - 1) + diceNumber) + diceSize;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'flags.midi-qol.OverTime',
                mode: 0,
                value: 'turn=start, allowIncapacitated=true, saveAbility=con, rollType=save, saveDamage=fulldamage, saveRemove=true, saveDC=' + itemUtils.getSaveDC(workflow.item) + ', saveMagic=true, damageRoll=' + formula + ', damageType=' + damageType + ', name=' + workflow.item.name,
                priority: 20
            }
        ]
    };
    await Promise.all(workflow.targets.map(async token => {
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
export let searingSmite = {
    name: 'Searing Smite',
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
            default: 'fire',
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
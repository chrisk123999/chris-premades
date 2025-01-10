import {actorUtils, dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../../utils.js';

async function early({workflow}) {
    if (workflow.actor.system.attributes.hp.value > Math.floor(workflow.actor.system.attributes.hp.max / 2)) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('CHRISPREMADES.Macros.VampiricBite.LowHealth'));
}
async function late({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!workflow.item.system.uses.value) return;
    let target = workflow.targets.first();
    if (['undead', 'construct'].includes(actorUtils.typeOrRace(target.actor))) return;
    let damageDealt = workflow.damageItem.damageDetail[0].value;
    if (!damageDealt) return;
    let buttons = [
        ['CHRISPREMADES.Macros.VampiricBite.Heal', 'heal'],
        ['CHRISPREMADES.Macros.VampiricBite.Bonus', 'bonus'],
        ['CHRISPREMADES.Generic.No', false]
    ];
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.VampiricBite.Select', buttons);
    if (!selection) return;
    await genericUtils.update(workflow.item, {'system.uses.spent': workflow.item.system.uses.spent + 1});
    if (selection === 'heal') {
        await workflowUtils.applyDamage([workflow.token], damageDealt, 'healing');
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.bonuses.All-Attacks',
                mode: 2,
                value: damageDealt,
                priority: 20
            },
            {
                key: 'system.bonuses.abilities.check',
                mode: 2,
                value: damageDealt,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    '1Attack',
                    'isCheck'
                ]
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData);
}
export let vampiricBite = {
    name: 'Fanged Bite',
    version: '1.1.10',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};
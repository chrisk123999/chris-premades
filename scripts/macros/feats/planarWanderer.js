import {dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../utils.js';

async function useAdaptation({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'planarAdaptation');
    if (effect) await genericUtils.remove(effect);
    let buttons = [
        ['DND5E.DamageAcid', 'acid', {image: 'icons/magic/acid/projectile-faceted-glob.webp'}],
        ['DND5E.DamageCold', 'cold', {image: 'icons/magic/air/wind-tornado-wall-blue.webp'}],
        ['DND5E.DamageFire', 'fire', {image: 'icons/magic/fire/beam-jet-stream-embers.webp'}]
    ];
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', buttons);
    if (!damageType) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 1
        },
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: damageType,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: ['longRest']
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'planarAdaptation'});
}
async function useCracker({workflow}) {
    let roll = await workflow.actor.rollSkill('arc');
    if (roll.total >= 20) return;
    let damageRoll = await new CONFIG.Dice.DamageRoll('3d8[psychic]', {}, {type: 'psychic'}).evaluate();
    await workflowUtils.applyWorkflowDamage(workflow.token, damageRoll, 'psychic', [workflow.token], {flavor: workflow.item.name, itemCardId: workflow.itemCardId, sourceItem: workflow.item});
}
export let planarAdaptation = {
    name: 'Planar Wanderer: Planar Adaptation',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useAdaptation,
                priority: 50
            }
        ]
    },
    ddbi: {
        additonalItems: {
            'Planar Wanderer': [
                'Planar Wanderer: Planar Adaptation'
            ]
        }
    }
};
export let portalCracker = {
    name: 'Planar Wanderer: Portal Cracker',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useCracker,
                priority: 50
            }
        ]
    }
};
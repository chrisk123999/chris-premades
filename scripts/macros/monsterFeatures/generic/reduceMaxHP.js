import {effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function late({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!workflow.damageRoll) return;
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'reduceMaxHP');
    let target = workflow.hitTargets.first();
    if (workflow.item.hasSave && !workflow.failedSaves.size) return;
    let damageApplied = 0;
    if (config.reduceByRoll.length) {
        let roll = await new Roll(config.reduceByRoll, workflow.actor.getRollData()).evaluate();
        await roll.toMessage({
            speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
            flavor: workflow.item.name
        });
        damageApplied = roll.total;
    } else {
        let ditem = workflow.damageList.find(i => i.actorId === target.actor.id);
        if (!ditem) return;
        if (!config.damageTypeFilter.length) {
            damageApplied = ditem.damageDetail.reduce((acc, i) => acc + i.value, 0);
        } else {
            damageApplied = ditem.damageDetail.reduce((acc, i) => acc + (config.damageTypeFilter.includes(i.type) ? i.value : 0), 0);
        }
    }
    if (config.halfDamage) damageApplied = Math.floor(damageApplied / 2);
    if (!damageApplied) return;
    let totalMax = target.actor.system.attributes.hp.max;
    let effect = effectUtils.getAllEffectsByIdentifier(target.actor, 'reduceMaxHP').find(i => i.origin === workflow.item.uuid);
    if (effect) {
        let currReduction = parseInt(effect.changes[0].value);
        await genericUtils.update(effect, {
            changes: [
                {
                    key: 'system.attributes.hp.tempmax',
                    mode: 2,
                    value: Math.max(-totalMax, currReduction - damageApplied),
                    priority: 20
                }
            ]
        });
    } else {
        let effectData = {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            changes: [
                {
                    key: 'system.attributes.hp.tempmax',
                    mode: 2,
                    value: -damageApplied,
                    priority: 20
                }
            ],
            flags: {
                dae: {
                    showIcon: true
                }
            }
        };
        if (config.shortRestCures) {
            effectData.flags.dae.specialDuration = ['shortRest'];
        } else if (config.longRestCures) {
            effectData.flags.dae.specialDuration = ['longRest'];
        }
        await effectUtils.createEffect(target.actor, effectData, {identifier: 'reduceMaxHP'});
    }
    if (Math.abs(target.actor.system.attributes.hp.tempmax) >= totalMax) {
        effectUtils.applyConditions(target.actor, ['dead'], {overlay: true});
    }
}
export let reduceMaxHP = {
    name: 'Reduce Maximum HP',
    version: '0.12.77',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 90
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'damageTypeFilter',
            label: 'CHRISPREMADES.Macros.ReduceMaxHP.DamageTypeFilter',
            type: 'damageTypes',
            default: []
        },
        {
            value: 'reduceByRoll',
            label: 'CHRISPREMADES.Macros.ReduceMaxHP.ReduceByRoll',
            type: 'text',
            default: ''
        },
        {
            value: 'shortRestCures',
            label: 'CHRISPREMADES.Macros.ReduceMaxHP.Short',
            type: 'checkbox',
            default: false
        },
        {
            value: 'longRestCures',
            label: 'CHRISPREMADES.Macros.ReduceMaxHP.Long',
            type: 'checkbox',
            default: false
        },
        {
            value: 'halfDamage',
            label: 'CHRISPREMADES.Macros.ReduceMaxHP.Half',
            type: 'checkbox',
            default: false
        }
    ]
};
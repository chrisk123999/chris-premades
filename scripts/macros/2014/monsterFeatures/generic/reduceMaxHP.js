import {effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function late({workflow}) {
    if (!workflow.hitTargets.size) return;
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'reduceMaxHP');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let damageApplied = 0;
    if (config.reduceByRoll.length) {
        let roll = await new Roll(config.reduceByRoll, workflow.item.getRollData()).evaluate();
        await roll.toMessage({
            speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
            flavor: workflow.item.name
        });
        damageApplied = roll.total;
        if (config.halfDamage) damageApplied = Math.floor(damageApplied / 2);
    }
    await Promise.all(workflow.targets.map(async token => {
        if (config.checkSaves && !workflow.failedSaves.has(token)) {
            let effect = await effectUtils.getAllEffectsByIdentifier(token.actor, 'reduceMaxHP').find(async i => (await effectUtils.getOriginItem(i))?.uuid === workflow.item.uuid);
            if (effect && config.removeOnSave) await genericUtils.remove(effect);
            return;
        }
        if (!config.reduceByRoll.length) {
            if (!workflow.damageRolls);
            let ditem = workflow.damageList.find(i => i.actorId === token.actor.id);
            if (!ditem) return;
            if (!config.damageTypeFilter.length) {
                damageApplied = ditem.damageDetail.reduce((acc, i) => acc + i.value, 0);
            } else {
                damageApplied = ditem.damageDetail.reduce((acc, i) => acc + (config.damageTypeFilter.includes(i.type) ? i.value : 0), 0);
            }
            if (config.halfDamage) damageApplied = Math.floor(damageApplied / 2);
        }
        if (!damageApplied) return;
        damageApplied = Math.floor(damageApplied);
        let totalMax = token.actor.system.attributes.hp.max;
        let effect = await effectUtils.getAllEffectsByIdentifier(token.actor, 'reduceMaxHP').find(async i => (await effectUtils.getOriginItem(i))?.uuid === workflow.item.uuid);
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
            await effectUtils.createEffect(token.actor, effectData, {identifier: 'reduceMaxHP'});
        }
        if (Math.abs(token.actor.system.attributes.hp.tempmax) >= totalMax) {
            effectUtils.applyConditions(token.actor, ['dead'], {overlay: true});
        }
    }));
}
export let reduceMaxHP = {
    name: 'Reduce Maximum HP',
    translation: 'CHRISPREMADES.Macros.ReduceMaxHP.Name',
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
            value: 'activities',
            label: 'CHRISPREMADES.Config.Activities',
            type: 'activities',
            default: []
        },
        {
            value: 'damageTypeFilter',
            label: 'CHRISPREMADES.Config.DamageTypes',
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
        },
        {
            value: 'checkSaves',
            label: 'CHRISPREMADES.Config.CheckSaves',
            type: 'checkbox',
            default: true
        },
        {
            value: 'removeOnSave',
            label: 'CHRISPREMADES.Macros.ReduceMaxHP.RemoveOnSave',
            type: 'checkbox',
            default: false
        }
    ]
};
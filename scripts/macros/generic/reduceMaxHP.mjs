import {actorUtils, constants, documentUtils, effectUtils, rollUtils, automationUtils, genericUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    if (!workflow.hitTargets.size) return;
    let rollDamage = 0;
    const reduceByRoll = automationUtils.getGenericConfigValue(document, 'chris-premades', 'reduceMaxHP', 'reduceByRoll');
    const halfDamage = automationUtils.getGenericConfigValue(document, 'chris-premades', 'reduceMaxHP', 'halfDamage');
    if (reduceByRoll.length) {
        const roll = await rollUtils.rollDice(reduceByRoll, {document});
        await roll.toMessage({
            speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
            flavor: document.name
        });
        rollDamage = roll.total;
        if (halfDamage) rollDamage = Math.floor(rollDamage / 2);
    }
    const checkSaves = automationUtils.getGenericConfigValue(document, 'chris-premades', 'reduceMaxHP', 'checkSaves');
    const removeOnSave = automationUtils.getGenericConfigValue(document, 'chris-premades', 'reduceMaxHP', 'removeOnSave');
    const damageTypes = automationUtils.getGenericConfigValue(document, 'chris-premades', 'reduceMaxHP', 'damageTypes');
    await Promise.all(workflow.targets.map(async token => {
        let targetDamage = rollDamage;
        const effect = documentUtils.getEffectByIdentifier(token.actor, 'reduceMaxHP', {multiple: true}).find(effect => effect.origin === document.uuid);
        if (checkSaves && !workflow.failedSaves.has(token)) {
            if (effect && removeOnSave) await documentUtils.deleteDocument(effect);
            return;
        }
        if (!reduceByRoll.length) {
            if (!workflow.damageRolls) return;
            const ditem = workflow.damageList.find(i => i.actorId === token.actor.id);
            if (!ditem) return;
            if (!damageTypes.length) {
                targetDamage = ditem.damageDetail.reduce((acc, i) => acc + i.value, 0);
            } else {
                targetDamage = ditem.damageDetail.reduce((acc, i) => acc + (damageTypes.includes(i.type) ? i.value : 0), 0);
            }
            if (halfDamage) targetDamage = Math.floor(targetDamage / 2);
        }
        targetDamage = Math.floor(targetDamage);
        if (!targetDamage) return;
        const totalMax = token.actor.system.attributes.hp.max;
        if (effect) {
            const currentReduction = parseInt(effect.system.changes[0].value);
            await documentUtils.update(effect, {
                'system.changes': [
                    {
                        key: 'system.attributes.hp.tempmax',
                        mode: 2,
                        value: Math.max(-totalMax, currentReduction - targetDamage),
                        priority: 20
                    }
                ]
            });
        } else {
            const effectData = {
                name: document.item.name,
                img: document.item.img,
                origin: document.uuid,
                system: {
                    changes: [
                        {
                            key: 'system.attributes.hp.tempmax',
                            mode: 2,
                            value: -targetDamage,
                            priority: 20
                        }
                    ]
                },
                showIcon: 2,
                flags: {
                    cat: {
                        identifier: 'reduceMaxHP'
                    }
                }
            };
            const shortRestCures = automationUtils.getGenericConfigValue(document, 'chris-premades', 'reduceMaxHP', 'shortRestCures');
            const longRestCures = automationUtils.getGenericConfigValue(document, 'chris-premades', 'reduceMaxHP', 'longRestCures');
            if (shortRestCures) {
                genericUtils.setProperty(effectData, 'flags.dae.specialDuration', ['shortRest']);
            } else if (longRestCures) {
                genericUtils.setProperty(effectData, 'flags.dae.specialDuration', ['longRest']);
            }
            await effectUtils.createEffects(token.actor, [effectData]);
        }
        if (Math.abs(token.actor.system.attributes.hp.tempmax) >= totalMax) actorUtils.applyConditions(token.actor, ['dead'], {overlay: true});
    }));
}
export const reduceMaxHP = {
    rules: 'all',
    version: '2.0.3',
    category: 'mechanics',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 25
        }
    ],
    genericConfig: {
        reduceByRoll: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReduceMaxHP.ReduceByRoll'
        },
        halfDamage: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.HalfDamage'
        },
        checkSaves: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.CheckSaves'
        },
        removeOnSave: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.RemoveOnSave'
        },
        shortRestCures: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReduceMaxHP.ShortRestCures'
        },
        longRestCures: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReduceMaxHP.LongRestCures'
        },
        damageTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageTypes',
            get options() {return constants.damageTypeOptions();}
        }
    }
};
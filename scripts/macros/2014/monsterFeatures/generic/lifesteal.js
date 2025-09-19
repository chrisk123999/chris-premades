import {actorUtils, constants, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRolls || !workflow.item) return;
    let {damageTypes, criticalOnly, checkSaves, reduceMaxHP, maxHPCure, excessAsTemp, ignoredCreatureTypes, formula, displayFormulaRoll, healingType, percentage, activities, validItems} = itemUtils.getGenericFeatureConfig(trigger.entity, 'lifesteal');
    if (trigger.entity.uuid === workflow.item.uuid) {
        if (validItems?.length && !validItems?.includes('thisItem')) return;
        if (activities?.length && !activities.includes(workflow.activity.id)) return;
    } else {
        let pass = validItems.map(i => {
            switch (i) {
                case 'mwak':
                case 'rwak':
                case 'msak':
                case 'rsak':
                    return workflowUtils.getActionType(workflow) === i;
                case 'spell':
                case 'feat':
                    return workflow.item.type === i;
                case 'item':
                    return constants.itemTypes.includes(workflow.item.type);
            }
        }).find(j => j);
        if (!pass) return;
    }
    percentage = Number(percentage);
    let workflowDamageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    if (!damageTypes.length) damageTypes = Object.keys(CONFIG.DND5E.damageTypes);
    if ((!damageTypes.some(i => workflowDamageTypes.has(i)))) return;
    if (criticalOnly && !workflow.isCritical) return;
    let validTargets = workflow.hitTargets.filter(token => {
        if (checkSaves) if (!workflow.failedSaves.has(token)) return false;
        if (ignoredCreatureTypes.includes(actorUtils.typeOrRace(token.actor))) return false;
        return true;
    });
    if (!validTargets.size) return;
    let totalHeal = 0;
    let formulaRoll;
    if (formula != '' && formula) {
        formulaRoll = await rollUtils.rollDice(formula, {actor: workflow.actor});
        if (displayFormulaRoll) {
            formulaRoll.toMessage({
                speaker: ChatMessage.implementation.getSpeaker({actor: workflow.actor}),
                flavor: trigger.entity.name
            });
        }
    }
    await Promise.all(validTargets.map(async token => {
        let testhp = 0;
        let damageItem = workflow.damageList.find(i => i.targetUuid === token.document.uuid);
        if (!damageItem) return;
        if (formula != '' && formula) {
            totalHeal += formulaRoll.total;
            testhp += formulaRoll.total;
        } else {
            damageItem.damageDetails.defaultDamage.forEach(i => {
                if (!damageTypes.includes(i.type)) return;
                totalHeal += i.value;
                testhp += i.value;
            });
        }
        if (reduceMaxHP) {
            let effect = await effectUtils.getAllEffectsByIdentifier(token.actor, 'reduceMaxHP').find(async i => (await effectUtils.getOriginItem(i))?.uuid === trigger.entity.uuid);
            let totalMax = token.actor.system.attributes.hp.max;
            if (effect) {
                let currReduction = parseInt(effect.changes[0].value);
                await genericUtils.update(effect, {
                    changes: [
                        {
                            key: 'system.attributes.hp.tempmax',
                            mode: 2,
                            value: Math.max(-totalMax, currReduction - testhp),
                            priority: 20
                        }
                    ]
                });
            } else {
                let effectData = {
                    name: trigger.entity.name,
                    img: trigger.entity.img,
                    origin: trigger.entity.uuid,
                    changes: [
                        {
                            key: 'system.attributes.hp.tempmax',
                            mode: 2,
                            value: -testhp,
                            priority: 20
                        }
                    ],
                    flags: {
                        dae: {
                            showIcon: true
                        }
                    }
                };
                if (maxHPCure === 'shortRest' || maxHPCure === 'longRest') {
                    effectData.flags.dae.specialDuration = [maxHPCure];
                }
                await effectUtils.createEffect(token.actor, effectData, {identifier: 'reduceMaxHP'});
            }
        }
    }));
    totalHeal = Math.floor(Math.floor(totalHeal) * percentage);
    if (healingType === 'temphp') {
        workflowUtils.applyDamage([workflow.token], totalHeal, 'temphp');
    } else {
        if (excessAsTemp) {
            if (workflow.actor.system.attributes.hp.value === workflow.actor.system.attributes.hp.max) {
                workflowUtils.applyDamage([workflow.token], totalHeal, 'temphp');
            } else {
                if (actorUtils.checkTrait(workflow.actor, 'di', 'healing')) return;
                let testHP = actorUtils.checkTrait(workflow.actor, 'dr', 'healing') ? Math.floor(totalHeal / 2) : totalHeal;
                let diff = workflow.actor.system.attributes.hp.max - (workflow.actor.system.attributes.hp.value + testHP);
                if (diff >= 0) {
                    workflowUtils.applyDamage([workflow.token], totalHeal, healingType);
                } else {
                    workflowUtils.applyDamage([workflow.token], totalHeal + diff, healingType);
                    workflowUtils.applyDamage([workflow.token], Math.abs(diff), 'temphp');
                }
            }
        } else {
            workflowUtils.applyDamage([workflow.token], totalHeal, healingType);  
        }
    }
}
export let lifesteal = {
    name: 'Lifesteal',
    translation: 'CHRISPREMADES.Macros.Lifesteal.Name',
    version: '1.0.34',
    isGenericFeature: true,
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    genericConfig: [
        {
            value: 'activities',
            label: 'CHRISPREMADES.Config.Activities',
            type: 'activities',
            default: []
        },
        {
            value: 'checkSaves',
            label: 'CHRISPREMADES.Config.CheckSaves',
            type: 'checkbox',
            default: false
        },
        {
            value: 'criticalOnly',
            label: 'CHRISPREMADES.Config.CriticalOnly',
            type: 'checkbox',
            default: false
        },
        {
            value: 'displayFormulaRoll',
            label: 'CHRISPREMADES.Config.DisplayFormulaRoll',
            type: 'checkbox',
            default: true
        },
        {
            value: 'excessAsTemp',
            label: 'CHRISPREMADES.Macros.Lifesteal.excessAsTemp',
            type: 'checkbox',
            default: false
        },
        {
            value: 'reduceMaxHP',
            label: 'CHRISPREMADES.Macros.Lifesteal.ReduceMaxHP',
            type: 'checkbox',
            default: false
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: ''
        },
        {
            value: 'healingType',
            label: 'CHRISPREMADES.Macros.Lifesteal.HealingType',
            type: 'select',
            options: constants.healingTypeOptions,
            default: 'healing'
        },
        {
            value: 'maxHPCure',
            label: 'CHRISPREMADES.Macros.Lifesteal.MaxHPCure',
            type: 'select',
            options: [
                {
                    label: 'CHRISPREMADES.Generic.Disabled',
                    value: false
                },
                {
                    label: 'DND5E.REST.Long.Label',
                    value: 'longRest'
                },
                {
                    label: 'DND5E.REST.Short.Label',
                    value: 'shortRest'
                }
            ]
        },
        {
            value: 'percentage',
            label: 'CHRISPREMADES.Config.Percentage',
            type: 'select',
            options: [
                {
                    label: '25%',
                    value: '0.25'
                },
                {
                    label: '50%',
                    value: '0.5'
                },
                {
                    label: '75%',
                    value: '0.75'
                },
                {
                    label: '100%',
                    value: '1'
                },
                {
                    label: '125%',
                    value: '1.25'
                },
                {
                    label: '150%',
                    value: '1.5'
                },
                {
                    label: '175%',
                    value: '1.75'
                },
                {
                    label: '200%',
                    value: '2'
                }
            ],
            default: '1'
        },
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'damageTypes',
            default: []
        },
        {
            value: 'ignoredCreatureTypes',
            label: 'CHRISPREMADES.Config.IgnoredCreatureTypes',
            type: 'creatureTypes',
            default: ['undead', 'construct']
        },
        {
            value: 'validItems',
            label: 'CHRISPREMADES.Macros.Lifesteal.validItems',
            type: 'select-many',
            options: [
                {
                    label: 'CHRISPREMADES.Macros.Lifesteal.ThisItem',
                    value: 'thisItem'
                },
                {
                    label: 'CHRISPREMADES.Generic.MeleeWeapons',
                    value: 'mwak'
                },
                {
                    label: 'CHRISPREMADES.Generic.RangedWeapons',
                    value: 'rwak'
                },
                {
                    label: 'CHRISPREMADES.Generic.MeleeSpells',
                    value: 'msak'
                },
                {
                    label: 'CHRISPREMADES.Generic.RangedSpells',
                    value: 'rsak'
                },
                {
                    label: 'CHRISPREMADES.Generic.Spells',
                    value: 'spell'
                },
                {
                    label: 'CHRISPREMADES.Generic.Features',
                    value: 'feat'
                },
                {
                    label: 'CHRISPREMADES.Generic.Items',
                    value: 'item'
                }
            ],
            default: ['thisItem']
        }
    ]
};
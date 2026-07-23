import {automationUtils, documentUtils, effectUtils, genericUtils, Logging, workflowUtils} from '../../../../proxy.mjs';
async function preChecks({workflow}) {
    if (workflow.actor.system.attributes.ac.equippedArmor?.system.type.value === 'heavy' && !automationUtils.getConfigValue(workflow.item, 'allowHeavyArmor')) {
        genericUtils.notify('CHRISPREMADES.Macros.All.Rage.HeavyArmor', {type: 'warn'});
        workflow.aborted = true;
        return true;
    }
    if (automationUtils.getConfigValue(workflow.item, 'allowConcentration')) return;
    const effects = Array.from(workflow.actor.concentration.effects);
    if (!effects.length) return;
    genericUtils.notify('CHRISPREMADES.Macros.All.Rage.Concentration', {type: 'warn'});
    await documentUtils.deleteEmbeddedDocuments(workflow.actor, 'ActiveEffect', effects.map(e => e.id));
}
async function beginRage({workflow}) {
    const sourceEffect = workflow.item.effects.contents[0];
    if (!sourceEffect) return;
    let vae, unhideActivities, specialDuration;
    const rules = documentUtils.getRules(workflow.item) || '2014';
    const config = automationUtils.getConfigValues(workflow.item, ['animation', 'bonus', 'allowConcentration', 'allowHeavyArmor', 'allowSpellcasting']);
    const secondActivity = workflow.item.system.activities.getByType('utility').find(a => a.id !== workflow.activity.id);
    if (config.allowHeavyArmor)
        specialDuration = (sourceEffect.flags.cat?.specialDuration ?? []).filter(d => d !== 'heavy');
    if (secondActivity) {
        vae = [{
            type: 'use',
            name: secondActivity.name,
            itemIdentifier: workflow.item.system.identifier,
            activityIdentifier: secondActivity.identifier
        }];
        unhideActivities = [secondActivity.identifier];
    }
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {createAnimation: config.animation, deleteAnimation: config.animation, unhideActivities, rules, specialDuration, vae});
    genericUtils.setProperty(effectData, 'flags.chris-premades.rage', config);
    const calledData = {
        activity: workflow.activity, 
        actor: workflow.actor,
        rules,
        token: workflow.token.document
    };
    const edits = await automationUtils.calledEvent('preCreateRageEffect', workflow.actor, {canOverlap: true, multiResult: true, data: {effectData, ...calledData}});
    for (const edit of edits) genericUtils.mergeObject(effectData, edit, {applyOperators: true});
    const createdEffect = (await effectUtils.createEffects(workflow.actor, [effectData]))?.[0];
    if (!createdEffect) return;
    await automationUtils.calledEvent('rageBegin', workflow.actor, {canOverlap: true, data: {effect: createdEffect, ...calledData}});
}
async function spellcasting({document: effect, workflow}) {
    if (workflow.item.type !== 'spell') return;
    const exit = reason => {
        genericUtils.notify('CHRISPREMADES.Macros.All.Rage.' + reason, {type: 'warn'});
        workflow.aborted = true;
    };
    if (workflow.activity.duration.concentration && !effect.flags['chris-premades']?.rage?.allowConcentration) return exit('Concentration');
    if (!effect.flags['chris-premades']?.rage?.allowSpellcasting) return exit('Spellcasting');
}
async function rageDamage({document: effect, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.activity.ability !== 'str') return;
    const allowedAttack = documentUtils.getRules(effect) === '2024' ? 'attack' : 'meleeWeaponAttack';
    if (!workflowUtils.isAttackType(workflow, allowedAttack)) return;
    const formula = effect.flags['chris-premades']?.rage?.bonus;
    if (!formula) return Logging.addMacroWarning('chris-premades', 'rage', 'Rage damage bonus formula not found!');
    await workflowUtils.bonusDamage(workflow, formula);
}
export const rage = {
    name: 'Rage',
    version: '2.0.2',
    rules: 'all',
    notes: 'Use the "actorPreCreateRageEffect" called event (async) to modify the rage effect.\n\tData available: actor, activity, effectData, rules, token.\nUse "actorRageBegin" (async) to respond when rage starts.\n\tData available: actor, activity, effect, rules, token.',
    roll: [
        {
            pass: 'activityPreambleComplete',
            macro: preChecks,
            priority: 100
        },   
        {
            pass: 'activityRollFinished',
            macro: beginRage,
            priority: 100
        }
    ],
    config: {
        allowConcentration: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.All.Rage.AllowConcentration'
        },
        allowHeavyArmor: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.All.Rage.AllowHeavyArmor'
        },
        allowSpellcasting: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.All.Rage.AllowSpellcasting'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'rageDefault'
            },
            type: 'selectAnimation',
            inputs: ['document', 'sourceToken'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'visuals'
        },
        bonus: {
            default: '@scale.barbarian.rage-damage',
            type: 'text',
            label: 'CHRISPREMADES.Config.DamageBonus',
            category: 'behavior'
        },
        classIdentifier: {
            default: 'barbarian',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'behavior'
        }
    },
    scales: [
        {
            identifier: 'rage-damage',
            classIdentifier: 'barbarian',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'rage-damage',
                    type: 'number',
                    scale: {
                        1: {value: 2},
                        9: {value: 3},
                        16: {value: 4}
                    }
                },
                value: {},
                title: 'Rage Damage'
            }
        }
    ]
};
export const raging = {
    name: rage.name,
    version: rage.version,
    rules: rage.rules,
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: spellcasting,
            priority: 100
        },
        {
            pass: 'actorDamageRollBonuses',
            macro: rageDamage,
            priority: 100
        }
    ]
};

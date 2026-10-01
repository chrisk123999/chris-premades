import {actorUtils, animationUtils, automationUtils, DamageBonus, documentUtils, Logging, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
import {addRiders, getTaggedRiders} from '../../../generic/attackRider.mjs';
async function bonus({workflow, document}) {
    if (workflow.hitTargets.size !== 1 || !workflow.item || !workflow.activity) return;
    if (!document.system.uses.value) return;
    const additionalIdentifiers = await automationUtils.calledEvent('sneakAttackAdditionalIdentifiers', workflow.actor, {multiResult: true, canOverlap: true, data: {workflow}});
    const identifier = documentUtils.getIdentifier(workflow.item);
    if (!(workflowUtils.getActionType(workflow) === 'rwak' || workflow.item.system.properties.has('fin') || additionalIdentifiers.includes(identifier))) return;
    let doSneak = workflow.advantage && !workflow.disadvantage;
    if (!doSneak && (workflow.advantage || !workflow.disadvantage)) {
        const targetToken = workflow.targets.first().document;
        doSneak = tokenUtils.findNearby(targetToken, 5, {disposition: 'enemy', includeIncapacitated: false}).some(token => token !== workflow.token.document);
    }
    doSneak ||= await automationUtils.calledEvent('sneakAttackDoSneak', workflow.actor, {data: {workflow}});
    if (!doSneak) {
        Logging.addMacroWarning('chris-premades', 'sneakAttack', 'Attack does not qualify for Sneak Attack.');
        return;
    }
    workflowUtils.setWorkflowProperty(workflow, 'canSneak', true);
    let formula = automationUtils.getConfigValue(document, 'formula');
    if (documentUtils.getRules(document) === '2024' && workflow.token.document.combatant?.combat.round === 1 && actorUtils.getItemByIdentifier(workflow.actor, 'assassinate')) {
        const classLevels = workflow.actor.classes[automationUtils.getConfigValue(document, 'classIdentifier')]?.system.levels;
        if (classLevels) formula += ' + ' + classLevels;
    }
    const type = workflow.damageRolls[0]?.options.type ?? workflow.defaultDamageType;
    const optional = !automationUtils.getConfigValue(document, 'auto');
    const riders = await getTaggedRiders(workflow.actor, workflow, 'cunningStrike');
    const strikes = [];
    const bonus = new DamageBonus(document, {action: 'special', formula, type, optional})
        .withValidation(args => validate({...args, strikes}))
        .withOnUse(async args => {
            await use(args);
            if (strikes.length) addRiders(workflow, strikes.map(strike => strike.uuid));
        });
    if (!riders.activities.length) return bonus;
    return bonus.withInputs([['comboboxMulti', [{
        name: 'cunningStrike',
        label: 'CHRISPREMADES.Macros.All.SneakAttack.CunningStrike',
        options: {
            maxTotal: riders.limit,
            options: riders.activities.map(activity => ({value: activity.uuid, label: activity.name, image: activity.img})),
            onchange: ({input}) => strikes.splice(0, strikes.length, ...riders.activities.filter(activity => input.options.some(option => option.selected && option.value === activity.uuid)))
        }
    }]]]);
}
async function use({workflow, bonus}) {
    const inCombat = workflow.token.document.inCombat;
    await workflowUtils.completeItemUse(bonus.document, Array.from(workflow.targets, token => token.document ?? token), {fast: true, consumeResources: inCombat, consumeUsage: inCombat});
    const animationSetting = automationUtils.getConfigValue(bonus.document, 'animation');
    const animation = animationUtils.getAnimation(animationSetting);
    const targetToken = workflow.targets.first().document;
    if (animation) {
        const attackType = workflow.rangeDetails.range > 5 ? 'ranged' : workflow.defaultDamageType;
        await animation.macros.attack(workflow.token.document, targetToken, attackType);
    }
    await automationUtils.calledEvent('sneakAttackUsed', workflow.actor, {data: {workflow, targetToken}});
}
function validate({bonus, strikes = []}) {
    const diceCost = strikes.reduce((acc, strike) => acc + (strike.uses.max ?? 0), 0);
    const damageRoll = new Roll(bonus.baseFormula);
    const dieData = damageRoll.terms.reduce((acc, term) => {
        if (term.faces && term.number) {
            acc.totals[term.faces] = (acc.totals[term.faces] ?? 0) + term.number;
            if (acc.totals[term.faces] > acc.maxCount) {
                acc.maxCount = acc.totals[term.faces];
                acc.targetFace = term.faces;
            }
        }
        return acc;
    }, {totals: {}, targetFace: null, maxCount: 0});
    if (diceCost > dieData.maxCount) return false;
    let remainingCost = diceCost;
    for (const term of damageRoll.terms) {
        if (term.faces !== dieData.targetFace || !term.number || !remainingCost) continue;
        const deduction = Math.min(term.number, remainingCost);
        term.number -= deduction;
        remainingCost -= deduction;
    }
    const newFormula = Roll.fromTerms(damageRoll.terms).formula;
    bonus.roll = new bonus.rollClass(newFormula, bonus.roll.data, bonus.roll.options);
    return true;
}
export const sneakAttack = {
    name: 'Sneak Attack',
    version: '2.1.0',
    rules: 'all',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: bonus,
            priority: 250
        }
    ],
    config: {
        auto: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.All.SneakAttack.Auto',
            category: 'tuning',
            hint: ''
        },
        formula: {
            default: '@scale.rogue.sneak-attack',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'behavior',
            hint: ''
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'sneakAttack'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'attackType'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'visuals',
            hint: ''
        },
        classIdentifier: {
            default: 'rogue',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'behavior',
            hint: ''
        }
    },
    notes: 'Use the "actorSneakAttackAdditionalIdentifiers" called event (async) to let another attacking item qualify. Return its item identifier.\n\tData available: workflow.\nUse "actorSneakAttackDoSneak" (async) to qualify an attack that has no advantage and no ally beside the target. Return true to qualify. The attack may have disadvantage.\n\tData available: workflow.\nUse "actorSneakAttackUsed" (async) to respond after Sneak Attack is used. A truthy return skips later subscribers.\n\tData available: targetToken, workflow.\nWhen an attack qualifies, the "canSneak" workflow property is set for damage bonuses above priority 250.',
    scales: [
        {
            identifier: 'sneak-attack',
            classIdentifier: 'rogue',
            data:{
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'sneak-attack',
                    type: 'dice',
                    scale: {
                        1: {
                            number: 1,
                            faces: 6,
                            modifiers: []
                        },
                        3: {
                            number: 2,
                            faces: 6,
                            modifiers: []
                        },
                        5: {
                            number: 3,
                            faces: 6,
                            modifiers: []
                        },
                        7: {
                            number: 4,
                            faces: 6,
                            modifiers: []
                        },
                        9: {
                            number: 5,
                            faces: 6,
                            modifiers: []
                        },
                        11: {
                            number: 6,
                            faces: 6,
                            modifiers: []
                        },
                        13: {
                            number: 7,
                            faces: 6,
                            modifiers: []
                        },
                        15: {
                            number: 8,
                            faces: 6,
                            modifiers: []
                        },
                        17: {
                            number: 9,
                            faces: 6,
                            modifiers: []
                        },
                        19: {
                            number: 10,
                            faces: 6,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Sneak Attack',
                icon: null
            }
        }
    ]
};

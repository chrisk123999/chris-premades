import {automationUtils, documentUtils, itemUtils, tokenUtils, workflowUtils, dialogUtils, actorUtils, animationUtils, Logging} from '../../../../proxy.mjs';
async function damage({document, workflow}) {
    if (workflow.hitTargets.size != 1 || !workflow.item || !workflow.activity) return;
    if (!document.system.uses.value) return;
    const additionalIdentifiers = await automationUtils.calledEvent('sneakAttackAdditionalIdentifiers', workflow.actor, {multiResult: true, canOverlap: true, data: {workflow}});
    const identifier = documentUtils.getIdentifier(workflow.item);
    if (!(workflowUtils.getActionType(workflow) === 'rwak' || workflow.item.system.properties.has('fin') || additionalIdentifiers.includes(identifier))) return;
    let doSneak = false;
    const rollType = (workflow.advantage && !workflow.disadvantage) ? 'advantage' : (!workflow.advantage && workflow.disadvantage) ? 'disadvantage' : 'normal';
    if (rollType === 'advantage') doSneak = true;
    const targetToken = workflow.targets.first().document;
    if (!doSneak && rollType != 'disadvantage') {
        const nearbyTokens = tokenUtils.findNearby(targetToken, 5, {disposition: 'enemy'}).filter(token => token != workflow.token.document);
        if (nearbyTokens.length) doSneak = true;
    }
    doSneak ||= await automationUtils.calledEvent('sneakAttackDoSneak', workflow.actor, {data: {workflow}});
    if (!doSneak) {
        Logging.addMacroWarning('chris-premades', 'sneakAttack', 'Attack does not qualify for Sneak Attack.');
        return;
    }
    const selection = automationUtils.getConfigValue(document, 'auto') || await dialogUtils.confirmUseItem(document);
    if (!selection) return;
    let formula = automationUtils.getConfigValue(document, 'formula');
    const inCombat = workflow.token.document.inCombat;
    if (inCombat) {
        if (workflow.token.document.combatant.combat.round === 1) {
            if (actorUtils.getItemByIdentifier(workflow.actor, 'deathStrike')) workflowUtils.setWorkflowProperty(workflow, 'deathStrike', true);
            const assassinate = actorUtils.getItemByIdentifier(workflow.actor, 'assassinate');
            if (assassinate) {
                const classIdentifier = itemUtils.getSourceClassIdentifier(document);
                if (classIdentifier) formula += ' + ' + workflow.actor.classes[classIdentifier].system.levels;
            }
        }
    }
    const data = await automationUtils.calledEvent('sneakAttackCunningStrike', workflow.actor, {multiResult: true, data: {workflow}});
    const uses = data.reduce((total, value) => total + (value.uses ?? 0), 0);
    const activities = data.flatMap(value => value.activities ?? []);
    if (activities.length && uses) {
        const damageRoll = new Roll(formula);
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
        let originalNumber = dieData.maxCount;
        let targetFace = dieData.targetFace;
        let number = originalNumber;
        const usedActivities = [];
        for (let i = 0; i < uses; i++) {
            const availableActivities = activities.filter(activity => (activity.uses.max) <= number && !usedActivities.includes(activity));
            const text = i > 0 ? 'CHRISPREMADES.Macros.Modern.SneakAttack.UseAnotherCunningStrike' : 'CHRISPREMADES.Macros.Modern.SneakAttack.UseCunningStrike';
            const selection = await dialogUtils.selectDocumentDialog(document.name, text, availableActivities, {max: 1, sort: 'alphabetical', addNoneDocument: true});
            if (!selection) break;
            const activityIdentifier = documentUtils.getIdentifier(selection);
            if (activityIdentifier === 'stealthAttack') workflowUtils.setWorkflowProperty(workflow, 'supremeSneak.used', true);
            usedActivities.push(selection);
            number -= selection.uses.max;
        }
        if (usedActivities.length) workflowUtils.setWorkflowProperty(workflow, 'cunningStrikeActivities', usedActivities.map(activity => activity.uuid));
        let diceCost = originalNumber - number;
        if (diceCost > 0 && targetFace) {
            for (let term of damageRoll.terms) {
                if (term.faces === targetFace && term.number > 0 && diceCost > 0) {
                    const deduction = Math.min(term.number, diceCost);
                    term.number -= deduction;
                    diceCost -= deduction;
                }
            }
        }
        formula = Roll.fromTerms(damageRoll.terms).formula;
    }
    await workflowUtils.bonusDamage(workflow, formula);
    await workflowUtils.completeItemUse(document, workflow.targets, {fast: true, consumeResources: inCombat, consumeUsage: inCombat});
    const rendMind = actorUtils.getItemByIdentifier(workflow.actor, 'rendMind');
    if (rendMind && identifier === 'psychicBlades') {
        const psionicPower = actorUtils.getItemByIdentifier(workflow.actor, 'psionicPower');
        let selection;
        if (psionicPower?.system?.uses?.value >= 3 && !rendMind.system.uses.value) {
            selection = await dialogUtils.confirm(rendMind.name, _loc('CHRISPREMADES.Macros.Modern.RendMind.RestoreAndUse', {item: rendMind.name}));
            if (selection) {
                await documentUtils.update(psionicPower, {'system.uses.spent': psionicPower.system.uses.spent + 3});
                await documentUtils.update(rendMind, {'system.uses.spent': 0});
                const effect = documentUtils.getEffectByIdentifier(workflow.actor, 'rendMindRestoreEffect');
                if (effect) await documentUtils.deleteDocument(effect);
            }
        } else if (rendMind.system.uses.value) {
            selection = await dialogUtils.confirmUseItem(rendMind);
        }
        if (selection) workflowUtils.setWorkflowProperty(workflow, 'rendMind.use', true);
    }
    const animationSetting = automationUtils.getConfigValue(document, 'animation');
    console.log(animationSetting);
    const animation = animationUtils.getAnimation(animationSetting);
    console.log(animation);
    if (!animation) return;
    const attackType = workflow.rangeDetails.range > 5 ? 'ranged' : workflow.defaultDamageType;
    await animation.macros.attack(workflow.token.document, targetToken, attackType);
}
export const sneakAttack = {
    name: 'Sneak Attack',
    version: '2.0.1',
    rules: 'modern',
    roll: [
        {
            pass: 'actorDamageRollBonuses',
            macro: damage,
            priority: 250
        }
    ],
    config: {
        auto: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Modern.SneakAttack.Auto',
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
    notes: '',
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
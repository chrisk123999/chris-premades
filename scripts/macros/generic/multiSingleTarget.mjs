import {automationUtils, rollUtils, dialogUtils, animationUtils, actorUtils, activityUtils, workflowUtils, itemUtils, genericUtils, queryUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'activityId');
    if (activityId != workflow.activity.id || !workflow.targets.size) return;
    let formula = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'formula');
    if (workflow.castData?.castLevel) formula = formula.replaceAll('@item.level', workflow.castData.castLevel);
    if (workflow.castData?.scaling) formula = formula.replaceAll('@scaling', workflow.castData.scaling);
    const totalTargets = (await rollUtils.rollDice(formula, {document: workflow.activity})).total;
    if (!totalTargets) return;
    const skipDeadAndUnconscious = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'skipDeadAndUnconscious');
    const attackActivityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'attackActivityId');
    if (!attackActivityId) return;
    let attackActivity = workflow.item.system.activities.get(attackActivityId);
    if (!attackActivity) return;
    const animationSetting = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'animation');
    const animation = animationUtils.getAnimation(animationSetting);
    const animationOptions = {};
    if (animation?.config) Object.keys(animation.config).forEach((key) => animationOptions[key] = automationUtils.getGenericAnimationConfig(document, 'chris-premades', 'multiSingleTarget', 'animation', key));
    if (animation?.macros?.start) await animation.macros.start(workflow.token.document, animationOptions);
    const reactionItemIdentifiers = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'reactionItemIdentifiers');
    const reactionEffectIdentifiers = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'reactionEffectIdentifiers');
    let remainingAttacks = totalTargets;
    let validTargets = workflow.targets.map(token => token.document);
    const utilityRollAsDamage = workflow.utilityRolls ? automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'utilityRollAsDamage') : false;
    if (utilityRollAsDamage) {
        const activityData = activityUtils.getDamageModifiedActivityData(attackActivity, rollUtils.getRollsTotal(workflow.utilityRolls));
        attackActivity = activityUtils.syntheticActivity(activityData, workflow.item);
    }
    while (remainingAttacks > 0 && validTargets.size > 0) {
        let dialogResult = await dialogUtils.selectTargetDialog(
            workflow.item.name, 
            _loc('CHRISPREMADES.Macros.Generic.MultiSingleTarget.Context', {totalTargets: remainingAttacks, skipDeadAndUnconscious}), 
            validTargets, 
            {
                type: 'selectAmount',
                maxAmount: remainingAttacks,
                skipDeadAndUnconscious: skipDeadAndUnconscious 
            }
        );
        if (!dialogResult) break;
        let { result: selection, skip: currentSkip } = dialogResult;
        if (!selection || !selection.length) break;
        for (let s = 0; s < selection.length; s++) {
            const targetDoc = selection[s].document; 
            const attacks = selection[s].value;
            if (isNaN(attacks) || attacks === 0) continue;
            if (currentSkip && targetDoc.actor.system.attributes.hp.value <= 0) {
                validTargets = validTargets.filter(t => t.id !== targetDoc.id);
                continue;
            }
            let reacted = false;
            const reactionItems = actorUtils.getCastableSpells(targetDoc.actor, {identifiers: reactionItemIdentifiers});
            let reactionEffect = reactionEffectIdentifiers.find(identifier => actorUtils.getEffectByIdentifier(targetDoc.actor, identifier));
            if (reactionEffect) {
                reacted = true;
            } else if (!actorUtils.hasUsedReaction(targetDoc.actor) && reactionItems.length) {
                const selectedReactionItem = await dialogUtils.selectDocumentDialog(workflow.item.name, _loc('CHRISPREMADES.Macros.Generic.MultiSingleTarget.Reaction'), reactionItems, {addNoneDocument: true, userId: queryUtils.firstOwner(targetDoc, true)});
                if (selectedReactionItem) {
                    await workflowUtils.completeItemUse(selectedReactionItem, [targetDoc]); 
                    reactionEffect = reactionEffectIdentifiers.find(identifier => actorUtils.getEffectByIdentifier(targetDoc.actor, identifier));
                    if (reactionEffect) reacted = true;
                }
            }
            for (let i = 0; i < attacks; i++) {
                if (currentSkip && targetDoc.actor.system.attributes.hp.value <= 0) {
                    validTargets = validTargets.filter(t => t.id !== targetDoc.id);
                    break; 
                }
                let workflow;
                if (utilityRollAsDamage) {
                    workflow = await workflowUtils.syntheticActivityRoll(attackActivity, [targetDoc]);
                } else {
                    workflow = await workflowUtils.completeActivityUse(attackActivity, [targetDoc], {autoDamage: true});
                }
                if (!workflow.hitTargets.size) reacted = true;
                if (animation && animation.macros?.attack) await animation.macros.attack(workflow.token.document, targetDoc, {missed: reacted, ...animationOptions});
                remainingAttacks--;
                if (currentSkip && targetDoc.actor.system.attributes.hp.value <= 0) {
                    validTargets = validTargets.filter(t => t.id !== targetDoc.id);
                    break;
                }
            }
        }
    }
    if (animation?.macros?.end) animation.macros.end(workflow.token.document);
}
export const multiSingleTarget = {
    rules: 'all',
    version: '1.6.1',
    category: 'targeting',
    generic: true,
    documents: ['Item'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        activityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.Activity',
            hint: ''
        },
        formula: {
            default: '@item.level',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            hint: ''
        },
        skipDeadAndUnconscious: {
            default: true,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.SkipDeadAndUnconscious',
            hint: ''
        },
        attackActivityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.AttackActivity',
            hint: ''
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'magicMissile'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: ''
        },
        reactionItemIdentifiers: {
            default: [],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Config.ReactionItemIdentifiers',
            hint: ''
        },
        reactionEffectIdentifiers: {
            default: [],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Config.ReactionEffectIdentifiers',
            hint: ''
        },
        utilityRollAsDamage: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.UtilityRollAsDamage',
            hint: ''
        }
    }
};
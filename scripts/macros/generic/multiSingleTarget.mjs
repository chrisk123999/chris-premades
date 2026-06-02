import {automationUtils, rollUtils, dialogUtils, animationUtils, actorUtils, activityUtils, workflowUtils, itemUtils} from '../../proxy.mjs';
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
    const attackActivity = workflow.item.system.activities.get(attackActivityId);
    if (!attackActivity) return;
    const animationIdentifier = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'animationIdentifier');
    const animation = animationUtils.getAnimation('chris-premades', animationIdentifier);
    const color = automationUtils.getGenericAnimationConfig(document, 'chris-premades', 'multiSingleTarget', 'color');
    const reactionItemIdentifiers = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'reactionItemIdentifiers');
    const reactionEffectIdentifiers = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'reactionEffectIdentifiers');
    const sound = automationUtils.getGenericAnimationConfigValue(document, 'chris-premades', 'multiSingleTarget', 'sound');
    let remainingAttacks = totalTargets;
    let validTargets = workflow.targets.map(token => token.document);
    while (remainingAttacks > 0 && validTargets.length > 0) {
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
            const reactionItems = activityUtils.getCastableSpells(targetDoc.actor, {identifiers: reactionItemIdentifiers});
            let reactionEffect = reactionEffectIdentifiers.find(identifier => actorUtils.getEffectByIdentifier(targetDoc.actor, identifier));
            if (reactionEffect) {
                reacted = true;
            } else if (!actorUtils.hasUsedReaction(targetDoc.actor) && reactionItems.length) {
                const selectedReactionItem = await dialogUtils.selectDocumentDialog(workflow.item.name, _loc('CHRISPREMADES.Macros.Generic.MultiSingleTarget.Reaction'), reactionItems, {addNoneDocument: true});
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
                if (animation) await animation.macro(workflow.token.document, targetDoc, reacted, sound, color);
                await workflowUtils.completeActivityUse(attackActivity, [targetDoc], {autoDamage: true});
                remainingAttacks--;
                if (currentSkip && targetDoc.actor.system.attributes.hp.value <= 0) {
                    validTargets = validTargets.filter(t => t.id !== targetDoc.id);
                    break;
                }
            }
        }
    }
}
export const multiSingleTarget = {
    rules: 'all',
    version: '1.6.1',
    category: 'general',
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
            type: 'selectActivity'
        },
        formula: {
            default: '@item.level',
            type: 'text'
        },
        skipDeadAndUnconscious: {
            default: true,
            type: 'checkbox'
        },
        attackActivityId: {
            default: '',
            type: 'selectActivity'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'magicMissile'
            },
            type: 'selectAnimation'
        },
        reactionItemIdentifiers: {
            default: [],
            type: 'selectIdentifiers'
        },
        reactionEffectIdentifiers: {
            default: [],
            type: 'selectIdentifiers'
        }
    }
};
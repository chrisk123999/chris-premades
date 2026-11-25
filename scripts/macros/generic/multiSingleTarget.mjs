import {activityUtils, actorUtils, automationUtils, dialogUtils, documentUtils, Logging, queryUtils, rollUtils, workflowUtils} from '../../proxy.mjs';
export function resolveCastFormula(formula, castData) {
    if (castData?.castLevel) formula = formula.replaceAll('@item.level', castData.castLevel);
    if (castData?.scaling) formula = formula.replaceAll('@scaling', castData.scaling);
    return formula;
}
async function use({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'activityId');
    if (activityId != workflow.activity.id || !workflow.targets.count) return;
    const formula = resolveCastFormula(automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'formula'), workflow.castData);
    const totalTargets = (await rollUtils.rollDice(formula, {document: workflow.activity})).total;
    if (!totalTargets) return;
    const skipDeadAndUnconscious = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'skipDeadAndUnconscious');
    const attackActivityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'attackActivityId');
    if (!attackActivityId) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(workflow.item), 'Attack activity not found.', {notify: 'warn'});
    let attackActivity = workflow.item.system.activities.get(attackActivityId);
    if (!attackActivity) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(workflow.item), 'Attack activity not found.', {notify: 'warn'});
    const {animation, options: animationOptions} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'multiSingleTarget'});
    if (animation?.macros?.start) await animation.macros.start(workflow.token.document, animationOptions);
    const reactionItemIdentifiers = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'reactionItemIdentifiers');
    const reactionEffectIdentifiers = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'reactionEffectIdentifiers');
    let remainingAttacks = totalTargets;
    let validTargets = new Set(workflow.targets.documents.filter(token => token.actor));
    const utilityRollAsDamage = workflow.utilityRolls ? automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'utilityRollAsDamage') : false;
    if (utilityRollAsDamage) {
        let total = rollUtils.getRollsTotal(workflow.utilityRolls);
        if (workflowUtils.getWorkflowProperty(workflow, 'maxDamage')) {
            const formula = workflow.utilityRolls.map(r => r.formula).join(' + ');
            total = (await rollUtils.rollDice(formula, {document, options: {maximize: true}}))?.total ?? total;
        }
        const activityData = activityUtils.getDamageModifiedActivityData(attackActivity, total);
        attackActivity = activityUtils.syntheticActivity(activityData, workflow.item);
    }
    const combineAttacks = automationUtils.getGenericConfigValue(document, 'chris-premades', 'multiSingleTarget', 'combineAttacks');
    const options = {
        spellSlot: false,
        atLevel: workflow.castData?.castLevel,
        options: {workflowOptions: {'chris-premades': {multiSingleTarget: {
            rollID: document.uuid + '|' + workflow.id,
            remainingAttacks
        }}}}
    };
    while (remainingAttacks > 0 && validTargets.size > 0) {
        const dialogResult = validTargets.size === 1
            ? {result: [{document: validTargets.first(), value: remainingAttacks}], skip: skipDeadAndUnconscious}
            : await dialogUtils.selectTargetDialog(
                workflow.item.name,
                _loc('CHRISPREMADES.Macros.Generic.MultiSingleTarget.Context', {totalTargets: remainingAttacks, skipDeadAndUnconscious}),
                validTargets,
                {
                    type: 'selectAmount',
                    maxAmount: remainingAttacks,
                    requireTotal: true,
                    skipDeadAndUnconscious: skipDeadAndUnconscious,
                    coverToken: workflow.token.document
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
            if (combineAttacks) {
                options.options.workflowOptions['chris-premades'].multiSingleTarget.remainingAttacks = remainingAttacks;
                const part = attackActivity.damage.parts[0];
                const activityData = activityUtils.getDamageModifiedActivityData(attackActivity, {number: attacks, denomination: part?.denomination, bonus: part?.bonus});
                const attackWorkflow = await workflowUtils.syntheticActivityDataRoll(activityData, workflow.item, [targetDoc], options);
                for (let i = 0; i < attacks; i++) {
                    if (animation?.macros?.attack && targetDoc.object) await animation.macros.attack(workflow.token.document, targetDoc, {missed: reacted || !attackWorkflow?.hitTargets.count, ...animationOptions});
                }
                remainingAttacks -= attacks;
                if (currentSkip && targetDoc.actor.system.attributes.hp.value <= 0) validTargets = validTargets.filter(t => t.id !== targetDoc.id);
                continue;
            }
            for (let i = 0; i < attacks; i++) {
                if (currentSkip && targetDoc.actor.system.attributes.hp.value <= 0) {
                    validTargets = validTargets.filter(t => t.id !== targetDoc.id);
                    break;
                }
                options.options.workflowOptions['chris-premades'].multiSingleTarget.remainingAttacks = remainingAttacks;
                const attackWorkflow = utilityRollAsDamage
                    ? await workflowUtils.syntheticActivityRoll(attackActivity, [targetDoc], options)
                    : await workflowUtils.completeActivityUse(attackActivity, [targetDoc], {autoDamage: true, fast: true, ...options});
                if (animation?.macros?.attack && targetDoc.object) await animation.macros.attack(workflow.token.document, targetDoc, {missed: reacted || !attackWorkflow?.hitTargets.count, ...animationOptions});
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
/**
 * Splits a rolled number of single-target attacks among the activity's targets and rolls the attack activity once per
 * attack. Each target can be offered a reaction spell before its attacks. The rolled attacks carry the
 * `chris-premades.multiSingleTarget` workflow option with the number of attacks remaining.
 */
export const multiSingleTarget = {
    rules: 'all',
    version: '2.1.11',
    category: 'targeting',
    generic: true,
    documents: ['item'],
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
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Activity',
            hint: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.ActivityId.Hint'
        },
        formula: {
            default: '@item.level',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula',
            hint: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.Formula.Hint'
        },
        skipDeadAndUnconscious: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.SkipDeadAndUnconscious',
            hint: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.SkipDeadAndUnconscious.Hint'
        },
        attackActivityId: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.AttackActivity',
            hint: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.AttackActivityId.Hint'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'magicMissile'
            },
            type: 'selectAnimation',
            category: 'animations',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.Animation.Hint'
        },
        reactionItemIdentifiers: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.ReactionItemIdentifiers.Label',
            hint: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.ReactionItemIdentifiers.Hint'
        },
        reactionEffectIdentifiers: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.ReactionEffectIdentifiers.Label',
            hint: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.ReactionEffectIdentifiers.Hint'
        },
        utilityRollAsDamage: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.UtilityRollAsDamage.Label',
            hint: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.UtilityRollAsDamage.Hint'
        },
        combineAttacks: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.CombineAttacks.Label',
            hint: 'CHRISPREMADES.Macros.Generic.MultiSingleTarget.CombineAttacks.Hint'
        }
    }
};

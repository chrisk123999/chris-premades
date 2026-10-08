import {automationUtils, dialogUtils, actorUtils, workflowUtils, tokenUtils, genericUtils} from '../../proxy.mjs';
async function use({document: activity, workflow, macroClass: {source, identifier}}) {
    const config = automationUtils.getGenericConfigValues(activity, source, identifier, Object.keys(extraAttack.genericConfig));
    if (!config.prompt) return;
    const strike = actorUtils.getItemByIdentifier(workflow.actor, config.identifier);
    if (!strike) return;
    const range = strike.system.range.value || strike.system.range.reach;
    const bonuses = await automationUtils.calledEvent('extraAttack', workflow.actor, {multiResult: true, canOverlap: true, data: {workflow, baseCount: config.attacks, macroActivity: activity}}) ?? [];
    let totalAttacks = config.attacks;
    if (bonuses && bonuses.length) {
        if (bonuses.includes(0)) return;
        totalAttacks = bonuses.reduce((acc, curr) => {
            return typeof curr === 'number' ? acc + curr : acc;
        }, totalAttacks);
    }
    if (totalAttacks === 0) return;
    const preselected = workflow.targets.map(t => t.document).filter(t => t.disposition !== workflow.token.document.disposition);
    let targetData = await getTargets(workflow, range, totalAttacks, config.skip, Array.from(preselected));
    if (!targetData) return;
    const {animation, options: animationOptions} = automationUtils.getResolvedAnimation(workflow.item, 'animation', {source, identifier});
    while (totalAttacks > 0) {
        for (let s = 0; s < targetData.result.length; s++) {
            const target = targetData.result[s].document; 
            const attacks = targetData.result[s].value;
            if (isNaN(attacks) || attacks === 0) continue;
            if (targetData.skip && target.actor.system.attributes.hp.value <= 0) continue;
            for (let i = 0; i < attacks; i++) {
                if (targetData.skip && target.actor.system.attributes.hp.value <= 0) break;
                const workflow = await workflowUtils.syntheticItemRoll(strike, [target]);
                if (animation?.macros?.attack) await animation.macros.attack(workflow.token.document, [target], {missed: !workflow.hitTargets.size, ...animationOptions});
                totalAttacks--;
                if (targetData.skip && target.actor.system.attributes.hp.value <= 0) break;
            }
        }
        if (totalAttacks > 0) {
            targetData = await getTargets(workflow, range, totalAttacks, targetData.skip);
            if (!targetData) return;
        }
    }
    if (animation?.macros?.end) animation.macros.end(workflow.token.document);
}
function getNearby(token, range, skipDead) {
    const near = tokenUtils.findNearby(token, range, {disposition: 'enemy'});
    return skipDead ? near.filter(t => t.actor.system.attributes.hp.value > 0) : near;
}
async function getTargets(workflow, range, maxAmount, skipDeadAndUnconscious, nearby) {
    if (!nearby?.length) nearby = getNearby(workflow.token.document, range, skipDeadAndUnconscious);
    if (!nearby.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.HuntersMark.NoTargets', {type: 'warn'});
        return;
    }
    if (nearby.length === 1) return {result: [{document: nearby[0], value: maxAmount}], skip: skipDeadAndUnconscious};
    const selection = await dialogUtils.selectTargetDialog(
        workflow.item.name, 
        _loc('CHRISPREMADES.Macros.Generic.MultiSingleTarget.Context', {totalTargets: maxAmount}), 
        nearby, 
        {
            maxAmount,
            requireTotal: true,
            type: 'selectAmount',
            skipDeadAndUnconscious
        }
    );
    if (selection?.result?.length) return selection;
}
export const extraAttack = {
    rules: 'all',
    version: '2.0.4',
    category: 'targeting',
    generic: true,
    documents: ['activity'],
    notes: 'Return a number from the "actorExtraAttack" called event (async) to modify the number of attacks.\n\tData available: workflow, baseCount, macroActivity.',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        attacks: {
            default: 2,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Attacks'
        },
        prompt: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.PromptTargets'
        },
        skip: {
            default: true,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.SkipDeadAndUnconscious',
            hint: ''
        },
        identifier: {
            default: 'unarmed-strike',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifier',
            hint: 'CHRISPREMADES.Macros.Generic.ExtraAttack'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'flurryOfBlows'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetTokens', 'options'],
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
};
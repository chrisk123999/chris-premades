import {actorUtils, automationUtils, dialogUtils, genericUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function flurry({workflow}) {
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(flurryOfBlows.config));
    if (!config.prompt) return;
    const strike = actorUtils.getItemByIdentifier(workflow.actor, config.identifier);
    if (!strike) return;
    const range = strike.system.range.value || strike.system.range.reach;
    const bonuses = await automationUtils.calledEvent('flurryOfBlows', workflow.actor, {multiResult: true, canOverlap: true, data: {workflow, baseCount: config.attacks}}) ?? [];
    let attacks = config.attacks;
    if (bonuses && bonuses.length) {
        if (bonuses.includes(0)) return;
        attacks = bonuses.reduce((acc, curr) => {
            return typeof curr === 'number' ? acc + curr : acc;
        }, attacks);
    }
    if (attacks === 0) return;
    let target;
    if (workflow.targets.size && workflow.targets.first()?.document.disposition !== workflow.token.document.disposition)
        target = workflow.targets.first().document;
    else target = await getTarget(workflow, range);
    if (!target) return;
    const targets = new Set();
    while (attacks >= 0) {
        await workflowUtils.syntheticItemRoll(strike, [target]);
        targets.add(target);
        if (!--attacks) break;
        target = await getTarget(workflow, range);
        if (!target) break;
    }
    const {animation, options: animationOptions} = automationUtils.getResolvedAnimation(workflow.item, 'animation');
    if (!animation) return;
    targets.forEach(t => animation.macros.play(workflow.token.document, t, animationOptions));
}
async function getTarget(workflow, range) {
    let target;
    const nearby = tokenUtils.findNearby(workflow.token.document, range, {disposition: 'enemy'});
    if (!nearby.length) return genericUtils.notify('CHRISPREMADES.Macros.Legacy.HuntersMark.NoTargets', {type: 'warn'});
    if (nearby.length === 1) target = nearby[0];
    else {
        const selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectTarget', nearby, {skipDeadAndUnconscious: false});
        if (!selection?.result) return;
        target = selection.result;
    }
    return target;
}
async function jumpBonus({data}) {
    data.formula = '2 * ' + data.formula;
}
export const flurryOfBlows = {
    name: 'Flurry of Blows',
    version: '2.0.4',
    rules: 'all',
    notes: 'Return a number from the "actorFlurryOfBlows" called event (async) to modify the number of attacks.\n\tData available: workflow, baseCount.',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: flurry,
            priority: 50
        }
    ],
    config: {
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
        identifier: {
            default: 'unarmed-strike',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifier',
            hint: 'CHRISPREMADES.Macros.All.FlurryOfBlows'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'flurryOfBlows'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
};
export const stepOfTheWindJump = {
    version: flurryOfBlows.version,
    rules: flurryOfBlows.rules,
    called: [
        {
            pass: 'actorJump',
            macro: jumpBonus,
            priority: 200
        }
    ]
};

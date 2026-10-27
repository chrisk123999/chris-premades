import {activityUtils, automationUtils, dialogUtils, itemUtils, Logging, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function leap({document: item, workflow, castData}) {
    if (workflow.activity.identifier !== 'chain-lightning') return;
    const primary = workflow.targets.first();
    if (!primary) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'chain-lightning-leap');
    if (!activity) return Logging.addMacroWarning('CPR', 'chain-lightning', 'Leap activity missing from item.', {notify: 'warn'});
    const maxTargets = Math.max(castData.castLevel - 3, 0);
    const excluded = new Set([workflow.token?.document.id, ...Array.from(workflow.targets, token => token.document.id)]);
    const anyCreature = automationUtils.getConfigValue(item, 'anyCreature');
    let leaps = tokenUtils.findNearby(primary.document, automationUtils.getConfigValue(item, 'leapRange')).filter(token => !excluded.has(token.id) && (anyCreature || token.disposition === primary.document.disposition));
    if (leaps.length > maxTargets) {
        const selection = await dialogUtils.selectTargetDialog(item.name, _loc('CHRISPREMADES.Macros.All.ChainLightning.Select', {maxTargets}), leaps, {type: 'multiple', maxAmount: maxTargets});
        leaps = selection?.result ?? [];
    }
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    if (workflow.token && animation?.macros?.play) animation.macros.play(workflow.token.document, primary.document, {...options, leaps, damageType: activity.damage.parts[0]?.types.first()});
    if (!leaps.length) return;
    const activityData = activityUtils.getDamageModifiedActivityData(activity, String(workflow.damageTotal));
    await workflowUtils.syntheticActivityDataRoll(activityData, item, leaps, {atLevel: castData.castLevel, consumeUsage: false, consumeResources: false, spellSlot: false});
}
export const chainLightning = {
    name: 'Chain Lightning',
    version: '2.1.4',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: leap,
            priority: 50
        }
    ],
    config: {
        anyCreature: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.All.ChainLightning.AnyCreature',
            hint: 'CHRISPREMADES.Macros.All.ChainLightning.AnyCreatureHint',
            category: 'behavior'
        },
        leapRange: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'chainLightning'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};

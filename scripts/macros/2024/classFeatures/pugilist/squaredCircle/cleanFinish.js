import {actorUtils, dialogUtils, effectUtils, genericUtils, socketUtils, workflowUtils} from '../../../../../utils.js';
async function turnEnd({trigger: {entity: effect, token}}) {
    let feature = await fromUuid(effect.flags['chris-premades']?.cleanFinish);
    let incapacitated = effectUtils.getEffectByIdentifier(token.actor, 'cleanFinish');
    let exit = async () => {if (incapacitated) await genericUtils.remove(incapacitated);};
    if (!feature?.system.uses.value) return await exit();
    if (actorUtils.hasUsedReaction(feature.parent)) return await exit();
    let userId = socketUtils.firstOwner(feature.parent, true);
    if (!await dialogUtils.confirmUseItem(feature, {userId})) return await exit();
    let options = {};
    if (token.actor.system.attributes.hp.pct < 50 && incapacitated)
        genericUtils.setProperty(options, 'workflowOptions.chris-premades.cleanFinish', true);
    await exit();
    await workflowUtils.syntheticItemRoll(feature, [token], {options, userId});
}
async function adjustConsumption({activity, actor, config}) {
    let options = config.midiOptions;
    if (!options?.workflowOptions?.['chris-premades']?.cleanFinish) return;
    if (options?.workflowOptions?.['chris-premades']?.cleanFinishAdjusted) return;
    genericUtils.setProperty(options, 'workflowOptions.chris-premades.cleanFinishAdjusted', true);
    let data = activity.toObject();
    data.consumption.targets = [{type: 'itemUses', value: 1}];
    await workflowUtils.syntheticActivityDataRoll(data, activity.item, actor, [], {options, consumeUsage: true, consumeResources: true});
    return true;
}
async function use({trigger: {entity: item}, workflow}) {
    await actorUtils.setReactionUsed(workflow.actor);
    if (!workflow.workflowOptions['chris-premades']?.cleanFinish) return;
    let target = workflow.failedSaves.first();
    if (!target) return;
    await workflowUtils.applyDamage([target], target.actor.system.attributes.hp.value, 'none');
}
export let cleanFinish = {
    name: 'Clean Finish',
    version: '1.5.32',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: adjustConsumption,
                priority: 100
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 100
            }
        ]
    }
};
// exported from legacy macros - runs on 'grappled' effect which uses legacy rules
export let cleanFinishCombatTurn = {
    name: cleanFinish.name,
    version: cleanFinish.version,
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 100
        }
    ]
};

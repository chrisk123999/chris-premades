import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function push({document: activity, sourceToken, workflow}) {
    if (!activity.item.system.uses.value) return;
    if (actorUtils.hasUsedReaction(activity.actor)) return;
    if (!itemUtils.getEquipmentState(activity.item)) return;
    if (!workflow.hitTargets.some(t => t.actor.uuid === activity.actor.uuid)) return;
    const config = automationUtils.getConfigValues(activity.item, Object.keys(repulsionShield.config));
    if (documentUtils.getIdentifier(activity.item) !== 'repulsion-shield') // is infusion, can't fetch config
        config.attackType ??= 'meleeAttack';
    if (config.attackType && !workflowUtils.isAttackType(workflow, config.attackType)) return;
    if (config.sizeLimit) {
        const limit = CONFIG.DND5E.actorSizes[config.sizeLimit]?.numerical ?? 0;
        if (actorUtils.getSize(workflow.actor) > limit) return;
    }
    if (activity.range.value) {
        if (tokenUtils.getDistance(sourceToken, workflow.token.document) > activity.range.value) return;
    }
    if (!await dialogUtils.confirmUseItem(activity.item, {userId: queryUtils.firstOwner(activity.actor, true)})) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.token.document]);
}
export const repulsionShield = {
    name: 'Repulsion Shield',
    version: '2.0.5',
    rules: 'all',
    roll: [
        {
            pass: 'targetSavesComplete',
            macro: push,
            priority: 300
        }
    ],
    config: {
        attackType: {
            default: 'meleeAttack',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.AttackType.Label',
            get options() { return constants.attackTypeOptions; }
        },
        sizeLimit: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.SizeLimit',
            get options() { return [{label: _loc('COMMON.None'), value: ''}, ...constants.sizeOptions]; }
        }
    }
};

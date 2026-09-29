import {actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, genericUtils, workflowUtils} from '../../../../proxy.mjs';
async function stun({document: activity, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!activity.item.system.uses.value) return;
    if (workflow.item.uuid === activity.item.uuid) return;
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    const valid = workflow.hitTargets.filter(t => {
        if (t.actor.system.attributes.hp.value <= 0) return;
        if (actorUtils.getEffectByIdentifier(t.actor, 'stunning-strike')) return;
        return true;
    });
    if (!valid.size) return;
    const focus = actorUtils.getItemByIdentifier(activity.actor, 'monks-focus', {type: 'feat'});
    if (!focus?.system.uses.value) return;
    if (automationUtils.getConfigValue(activity.item, 'validate')) {
        const type = workflow.item.system.type.value;
        const unarmed = type === 'unarmed' || documentUtils.getIdentifier(workflow.item) === 'unarmed-strike';
        if (!unarmed && type === 'natural') return;
        if (['martialM', 'martialR'].includes(type) && !workflow.item.system.properties.has('lgt')) return;
    }
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    const stunWorkflow = await workflowUtils.syntheticActivityRoll(activity, valid.map(t => t.document));
    if (!stunWorkflow.saves.size) return;
    const effectData = [];
    for (const e of activity.item.effects) {
        if (activity.effects.some(ef => ef._id === e.id)) continue;
        const data = e.toObject();
        genericUtils.setProperty(data, 'flags.dae.activity', activity.uuid);
        data.origin = e.uuid;
        data.duration = {
            expiry: 'sourceStart',
            units: 'rounds',
            value: 1
        };
        effectData.push(data);
    }
    if (effectData.length) await Promise.all(stunWorkflow.saves.map(t => t.actor ? effectUtils.createEffects(t.actor, effectData) : undefined));
}
export const stunningStrike = {
    name: 'Stunning Strike',
    version: '2.0.4',
    rules: '2024',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: stun,
            priority: 200
        }
    ],
    config: {
        validate: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ValidateWeapon'
        }
    }
};

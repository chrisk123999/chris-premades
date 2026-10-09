import {actorUtils, dialogUtils, documentUtils, effectUtils, itemUtils, queryUtils, workflowUtils} from '../../../../../proxy.mjs';
async function react({document: item, workflow, sourceToken}) {
    if (workflow.item?.type !== 'spell' || !item.system.uses.value) return;
    if (actorUtils.hasUsedReaction(sourceToken.actor)) return;
    const userId = queryUtils.firstOwner(sourceToken.actor, true);
    const selection = await dialogUtils.confirmUseItem(item, {userId});
    if (!selection) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'use');
    if (!activity) return;
    const activityData = activity.toObject();
    activityData.save.ability = [workflow.item.system.ability || workflow.actor.system.attributes.spellcasting || 'int'];
    const reactionWorkflow = await workflowUtils.syntheticActivityDataRoll(activityData, item, [workflow.token.document], {userId});
    if (!reactionWorkflow?.failedSaves.size) return;
    const removedTarget = Array.from(workflow.targets).find(target => (target.document ?? target) === sourceToken);
    if (removedTarget) await workflowUtils.removeTargets(workflow, [removedTarget]);
    if (!workflow.item.system.level) return;
    if (!actorUtils.hasSpellSlots(sourceToken.actor, workflow.item.system.level)) return;
    const sourceEffect = item.effects.contents[0];
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(activity, sourceEffect.id);
    const effect = (await effectUtils.createEffects(sourceToken.actor, [effectData]))?.[0];
    if (!effect) return;
    const spellData = workflow.item.toObject();
    delete spellData._id;
    spellData.system.method = 'spell';
    spellData.system.prepared = 1;
    await itemUtils.createItems(sourceToken.actor, [spellData], {favorite: true, parentEntity: effect});
    const enchantData = documentUtils.getBaseEffectData(activity, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {key: 'system.prepared', type: 'override', value: 0, priority: 20},
            {key: 'system.method', type: 'override', value: 'spell', priority: 20},
            {key: 'name', type: 'override', value: '{} (' + _loc('CHRISPREMADES.Macros.Modern.SpellThief.Disabled') + ')', priority: 20}
        ]
    });
    const casterItem = workflow.token.actor.items.get(workflow.item.id) ?? workflow.item;
    const enchantment = await itemUtils.enchantItem(casterItem, enchantData);
    if (enchantment) await documentUtils.makeDependent(effect, [enchantment]);
}
export const spellThief = {
    name: 'Spell Thief',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'targetPreambleComplete',
            macro: react,
            priority: 100
        }
    ]
};

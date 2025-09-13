import {activityUtils, actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../../../utils.js';
async function targeted({trigger, workflow}) {
    if (!workflow.targets.size || workflow.item.type != 'spell') return;
    let removeTargets = [];
    for (let token of workflow.targets) {
        let item = itemUtils.getItemByIdentifier(token.actor, 'spellThief');
        if (!item?.system?.uses?.value) continue;
        if (actorUtils.hasUsedReaction(token.actor)) continue;
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), {userId: socketUtils.firstOwner(token.document, true)});
        if (!selection) continue;
        let targetWorkflow = await workflowUtils.syntheticItemRoll(item, [workflow.token], {userId: socketUtils.firstOwner(token.document, true), consumeResources: true, consumeUsage: true});
        if (!targetWorkflow.failedSaves.size) continue;
        removeTargets.push(token);
        if (!workflow.item.system.level) continue;
        if (!actorUtils.hasSpellSlots(token.actor, workflow.item.system.level)) continue;
        let sourceEffect = item.effects.contents?.[0];
        if (!sourceEffect) continue;
        let activity = activityUtils.getActivityByIdentifier(item, 'use', {strict: true});
        if (!activity) continue;
        let effectData = genericUtils.duplicate(sourceEffect.toObject());
        effectData.duration = itemUtils.convertDuration(activity);
        let effect = await effectUtils.createEffect(token.actor, effectData);
        let itemData = genericUtils.duplicate(workflow.item);
        delete itemData._id;
        itemData.system.method = 'spell';
        itemData.system.prepared = 1;
        await itemUtils.createItems(token.actor, [itemData], {favorite: true, parentEntity: effect});
        let enchantData = {
            name: item.name,
            img: item.img,
            duration: itemUtils.convertDuration(activity),
            changes: [
                {
                    key: 'system.prepared',
                    mode: 5,
                    value: 0,
                    priority: 20
                },
                {
                    key: 'system.method',
                    mode: 5,
                    value: 'spell',
                    priority: 20
                },
                {
                    key: 'name',
                    mode: 5,
                    value: '{} (' + genericUtils.translate('CHRISPREMADES.Generic.Disabled') + ')',
                    priority: 20
                }
            ],
            origin: item.uuid
        };
        await itemUtils.enchantItem(workflow.item, enchantData, {parentEntity: effect});
    }
    if (removeTargets.length) await workflowUtils.removeTargets(workflow, removeTargets);
}
export let spellThief = {
    name: 'Spell Thief',
    version: '1.3.53',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'targetPreambleComplete',
                macro: targeted,
                priority: 100
            }
        ]
    }
};
import {effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function early({trigger, workflow}) {
    let sourceEffect = itemUtils.getEffectByIdentifier(workflow.item, 'envenomWeaponsEffect');
    console.log(sourceEffect);
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    let effects = await Promise.all(workflow.targets.map(async token => {
        return await effectUtils.createEffect(token.actor, effectData, {animate: false});
    }));
    genericUtils.setProperty(workflow, 'chris-premades.envenomWeapons.effectUuids', effects.map(i => i.uuid));
}
async function late({trigger, workflow}) {
    let effectUuids = workflow['chris-premades']?.envenomWeapons?.effectUuids;
    if (!effectUuids) return;
    await Promise.all(effectUuids.map(async uuid => {
        let effect = await fromUuid(uuid);
        if (!effect) return;
        await genericUtils.remove(effect);
    }));
}
async function turnEnd({trigger: {entity: effect, token}}) {
    let item = await effectUtils.getOriginItem(effect);
    if (!item) return;
    let itemData = genericUtils.duplicate(item.toObject());
    itemData.system.activities[item.system.activities.contents[0].id].effectConditionText = 'false';
    let workflow = await workflowUtils.syntheticItemDataRoll(itemData, item.actor, [token]);
    if (workflow.failedSaves.size) return;
    await genericUtils.remove(effect);
}
export let envenomWeapons = {
    name: 'Envenom Weapons',
    version: '1.3.54',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: '50'
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: '50'
            }
        ]
    }
};
export let envenomPoison = {
    name: 'Envenom Poison',
    version: envenomWeapons.version,
    rules: envenomWeapons.rules,
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: '50'
        }
    ]
};
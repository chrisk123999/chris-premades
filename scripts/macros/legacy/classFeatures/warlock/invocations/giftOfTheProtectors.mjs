import {documentUtils, effectUtils, workflowUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    if (workflow.workflowOptions?.['chris-premades']?.giftOfTheProtectors) return;
    if (!workflow.targets.size) return;
    const sourceEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'giftOfTheProtectorsSource',
        activityUuid: workflow.activity.uuid
    });
    const [sourceEffect] = await effectUtils.createEffects(workflow.actor, [sourceEffectData]);
    if (!sourceEffect) return;
    const targetEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'giftOfTheProtectorsTarget',
        activityUuid: workflow.activity.uuid,
        macros: [{type: 'roll', macros: [{source: 'chris-premades', rules: '2014', identifier: 'gift-of-the-protectors-protected'}]}]
    });
    for (const target of workflow.targets) {
        await effectUtils.createEffects(target.actor, [targetEffectData], {parentEntity: sourceEffect});
    }
}
async function damage({document, ditem, actor}) {
    if (!ditem.isHit) return;
    if (ditem.oldHP + (ditem.oldTempHP ?? 0) - ditem.totalDamage > 0) return;
    const originActivity = await effectUtils.getOriginActivity(document);
    const originItem = originActivity?.item;
    if (!originItem) return;
    await workflowUtils.preventZeroHP(ditem, {actor});
    const sourceEffect = documentUtils.getEffectByIdentifier(originItem.actor, 'giftOfTheProtectorsSource');
    await documentUtils.deleteDocument(document);
    if (sourceEffect) await documentUtils.deleteDocument(sourceEffect);
    await workflowUtils.completeItemUse(originItem, [], {
        consumeUsage: false,
        consumeResources: false,
        options: {workflowOptions: {'chris-premades': {giftOfTheProtectors: true}}}
    });
}
export const giftOfTheProtectors = {
    name: 'Eldritch Invocations: Gift of the Protectors',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ]
};
export const giftOfTheProtectorsProtected = {
    name: 'Gift of the Protectors: Protected',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'targetDamageComplete', macro: damage, priority: 250}
    ]
};

import {actorUtils, dialogUtils, documentUtils, effectUtils, itemUtils, queryUtils, workflowUtils} from '../../../../proxy.mjs';
async function recovered({workflow}) {
    if (workflow.activity.identifier !== 'recover' || !workflow.token) return;
    if (!actorUtils.isBloodied(workflow.actor)) return;
    const temp = itemUtils.getActivityByIdentifier(workflow.item, 'bloodied-temp-hp');
    if (temp) {
        await workflowUtils.completeActivityUse(temp, [workflow.token.document]);
        if (!actorUtils.getEffectByIdentifier(workflow.actor, 'bloodiedButUnbowedTemp')) await effectUtils.createEffects(workflow.actor, [documentUtils.getBaseEffectData(workflow.item, {name: workflow.item.name, img: workflow.item.img, origin: workflow.item.uuid, identifier: 'bloodiedButUnbowedTemp'})]);
    }
    const downItem = actorUtils.getItemByIdentifier(workflow.actor, 'down-but-not-out');
    const down = downItem?.system.activities.contents[0];
    if (!down || !downItem.system.uses.value) return;
    if (!await dialogUtils.confirmUseItem(downItem, {userId: queryUtils.firstOwner(workflow.actor, true)})) return;
    await workflowUtils.completeActivityUse(down, [workflow.token.document]);
}
async function shortRest({document: item}) {
    const marker = actorUtils.getEffectByIdentifier(item.actor, 'bloodiedButUnbowedTemp');
    if (!marker) return;
    await documentUtils.update(item.actor, {'system.attributes.hp.temp': 0});
    await documentUtils.deleteDocument(marker);
}
async function longRest({document: item}) {
    const marker = actorUtils.getEffectByIdentifier(item.actor, 'bloodiedButUnbowedTemp');
    if (marker) await documentUtils.deleteDocument(marker);
}
export const bloodiedButUnbowed = {
    name: 'Bloodied But Unbowed',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: recovered,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorShort',
            macro: shortRest,
            priority: 50
        },
        {
            pass: 'actorLong',
            macro: longRest,
            priority: 50
        }
    ]
};

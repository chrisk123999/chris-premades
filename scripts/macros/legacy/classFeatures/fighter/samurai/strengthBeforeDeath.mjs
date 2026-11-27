import {actorUtils, documentUtils, effectUtils} from '../../../../../proxy.mjs';
async function use({document: item, workflow}) {
    if (workflow.activity.identifier === 'end-turn') {
        await endTurn(item);
        return;
    }
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        identifier: 'strengthBeforeDeath',
        unhideActivities: ['end-turn'],
        activityUuid: workflow.activity.uuid
    });
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
async function endTurn(item) {
    const actor = item.actor;
    const effect = actorUtils.getEffectByIdentifier(actor, 'strengthBeforeDeath');
    if (effect) await documentUtils.deleteDocument(effect);
    if (actor.system.attributes.hp.value > 1) return;
    await documentUtils.update(actor, {'system.attributes.hp.value': 0});
    await actorUtils.applyConditions(actor, ['unconscious'], {overlay: true});
}
export const strengthBeforeDeath = {
    name: 'Strength Before Death',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};

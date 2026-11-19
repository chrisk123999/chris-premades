import {activityUtils, documentUtils, effectUtils, Logging} from '../../../../../proxy.mjs';
async function use({document: item, macroClass: {identifier, source}, workflow}) {
    const target = workflow.targets.documents[0]?.actor ?? workflow.actor;
    const targetUuid = item.flags[source]?.blessingOfTheTrickster?.targetUuid;
    let effect;
    if (targetUuid) effect = await fromUuid(targetUuid);
    if (effect) await documentUtils.deleteDocument(effect);
    const sourceEffect = item.effects.contents?.[0];
    if (!sourceEffect) return Logging.addMacroWarning(source, identifier, `Blessing of the Trickster could not locate its active effect. (item) ${item.uuid}`);
    const effectData = documentUtils.getEffectData(item, sourceEffect.id, {duration: activityUtils.getEffectDuration(workflow.activity)});
    const targetEffect = (await effectUtils.createEffects(target, [effectData]))[0];
    await documentUtils.setFlag(item, source, 'blessingOfTheTrickster.targetUuid', targetEffect.uuid);
}
export const blessingOfTheTrickster = {
    name: 'Blessing of the Trickster',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};

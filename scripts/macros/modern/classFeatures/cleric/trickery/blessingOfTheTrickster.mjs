import {activityUtils, documentUtils, effectUtils, Logging} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    const target = workflow.targets.first()?.actor ?? workflow.actor;
    const targetUuid = document.flags['chris-premades']?.blessingOfTheTrickster?.targetUuid;
    let effect;
    if (targetUuid) effect = await fromUuid(targetUuid);
    if (effect) await documentUtils.deleteDocument(effect);
    const sourceEffect = document.effects.contents?.[0];
    if (!sourceEffect) return Logging.addMacroWarning('CPR', 'blessing-of-the-trickster', 'Blessing effect missing from item.', {notify: 'warn'});
    const effectData = documentUtils.getEffectData(document, sourceEffect.id, {duration: activityUtils.getEffectDuration(workflow.activity)});
    const targetEffect = (await effectUtils.createEffects(target, [effectData]))[0];
    await documentUtils.setFlag(document, 'chris-premades', 'blessingOfTheTrickster.targetUuid', targetEffect.uuid);
}
export const blessingOfTheTrickster = {
    name: 'Blessing of the Trickster',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};

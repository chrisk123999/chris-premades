import {activityUtils, dataUtils, documentUtils, effectUtils, Logging, summonUtils, workflowUtils} from '../../../../../proxy.mjs';
async function addSpecialDurations({document: activity, macroClass: {identifier, source}, workflow}) {
    if (workflowUtils.isSustainedRoll(workflow)) return;
    const effect = documentUtils.getEffectByIdentifier(activity.item, 'warGodsBlessing')?.toObject();
    if (!effect) return Logging.addMacroWarning(source, identifier, `War God's Blessing exited early without locating its active effect. (activity) ${activity.uuid} (effect identifier) warGodsBlessing`);
    effect.duration = activityUtils.getEffectDuration(workflow.activity);
    dataUtils.setOrigin(effect, activity);
    const altConcentration = (await effectUtils.createEffects(activity.actor, [effect]))?.[0];
    if (!altConcentration)
        return Logging.addMacroWarning(source, identifier, `War God's Blessing could not create its active effect. (activity) ${activity.uuid}`);
    const id = documentUtils.getIdentifier(workflow.item);
    let dependents = [];
    switch (id) {
        case 'shield-of-faith':
            dependents = workflow.effectTargets.documents.map(t => {
                if (!t.actor) return;
                return documentUtils.getEffectByIdentifier(t.actor, 'shieldOfFaith', {sourceActor: activity.actor});
            }).filter(Boolean);
            break;
        case 'spiritual-weapon':
            dependents = summonUtils.getSummonsBySource(workflow.item).map(w => {
                if (!w.actor) return;
                w.parentUuid = altConcentration.uuid;
                return w.actor;
            }).filter(Boolean);
            break;
    }
    if (dependents.length) await documentUtils.makeDependent(altConcentration, dependents);
}
export const warGodsBlessing = {
    name: 'War God\'s Blessing',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'castEnchantmentRollFinished',
            macro: addSpecialDurations,
            priority: 50
        }
    ]
};

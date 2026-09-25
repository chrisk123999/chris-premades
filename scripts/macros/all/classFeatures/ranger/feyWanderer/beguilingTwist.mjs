import {dialogUtils, documentUtils, effectUtils} from '../../../../../proxy.mjs';
const conditions = [
    ['DND5E.ConCharmed', 'beguilingTwistCharmed'],
    ['DND5E.ConFrightened', 'beguilingTwistFrightened']
];
async function use({document: item, workflow}) {
    if (workflow.targets.size !== 1 || !workflow.failedSaves.size) return;
    const available = conditions.filter(([, identifier]) => documentUtils.getEffectByIdentifier(item, identifier));
    if (!available.length) return;
    const selection = available.length === 1
        ? available[0][1]
        : await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.All.BeguilingTwist.Select', available);
    if (!selection) return;
    const sourceEffect = documentUtils.getEffectByIdentifier(item, selection);
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {activityUuid: workflow.activity.uuid});
    if (!effectData) return;
    effectData.name = item.name;
    await effectUtils.createEffects(workflow.failedSaves.first().actor, [effectData]);
}
export const beguilingTwist = {
    name: 'Beguiling Twist',
    version: '2.0.0',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};

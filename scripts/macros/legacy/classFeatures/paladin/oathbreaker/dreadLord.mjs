import {documentUtils, effectUtils, tokenUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'dread-lord') return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'dreadLord');
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {activityUuid: workflow.activity.uuid});
    effectUtils.pushImageChanges(effectData, document);
    const effect = (await effectUtils.createEffects(workflow.actor, [effectData]))?.[0];
    const fearEffect = documentUtils.getEffectByIdentifier(document, 'dreadLordFear');
    if (!effect || !fearEffect) return;
    const fearEffectData = documentUtils.getEffectData(workflow.activity, fearEffect.id, {activityUuid: workflow.activity.uuid});
    await effectUtils.createEffects(workflow.actor, [fearEffectData], {parentEntity: effect});
}
async function attacked({document, sourceToken, workflow}) {
    if (!sourceToken || !workflow.token || workflow.targets.size !== 1) return;
    if (tokenUtils.canSense(workflow.token.document, sourceToken, tokenUtils.getNonSightModes())) return;
    workflow.tracker.disadvantage.add('dread-lord', document.name);
}
export const dreadLord = {
    name: 'Dread Lord',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    get config() {
        return effectUtils.getImageConfig();
    }
};
export const dreadLordShadow = {
    name: 'Dread Lord: Shadow Aura',
    version: dreadLord.version,
    rules: dreadLord.rules,
    roll: [
        {
            pass: 'targetAttackRollConfig',
            macro: attacked,
            priority: 50
        }
    ]
};

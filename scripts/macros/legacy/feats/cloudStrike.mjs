import {actorUtils, documentUtils, effectUtils, workflowUtils} from '../../../proxy.mjs';
async function vanish({document: activity, workflow}) {
    const targetEffects = workflow.failedSaves.documents.flatMap(token => token.actor ? actorUtils.getEffects(token.actor).filter(effect => effectUtils.getOriginActivitySync(effect)?.uuid === activity.uuid) : []);
    if (!targetEffects.length) return;
    const effectData = documentUtils.getBaseEffectData(activity, {
        name: activity.item.name,
        img: activity.item.img,
        origin: activity.item.uuid,
        identifier: 'cloud-strike-invisible',
        duration: {value: 1, units: 'rounds', expiry: 'turnStart'}
    });
    const [sourceEffect] = await effectUtils.createEffects(workflow.actor, [effectData]) ?? [];
    if (sourceEffect) await documentUtils.makeDependent(sourceEffect, targetEffects);
}
async function reveal({workflow}) {
    if (workflow.item?.type !== 'spell' && !workflowUtils.isAttackType(workflow, 'attack')) return;
    const effects = documentUtils.getEffectByIdentifier(workflow.actor, 'cloud-strike-invisible', {multiple: true});
    await Promise.all(effects.map(effect => effect.flags['chris-premades']?.cloudStrikeArmed ? documentUtils.deleteDocument(effect) : documentUtils.setFlag(effect, 'chris-premades', 'cloudStrikeArmed', true)));
}
export const cloudStrike = {
    name: 'Strike of the Giants: Cloud Strike',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: vanish,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: reveal,
            priority: 50
        }
    ]
};

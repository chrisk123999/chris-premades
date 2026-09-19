import cprConstants from '../../../../../constants.mjs';
import {automationUtils, compendiumUtils, constants, documentUtils, effectUtils, summonUtils} from '../../../../../proxy.mjs';
const attackActivity = 'tentacle-of-the-deeps-attack';
function rangeOverrideData(item, parent) {
    return documentUtils.getBaseEffectData(item, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        identifier: 'tentacleOfTheDeepsAttack',
        duration: {seconds: 1},
        parentEntity: parent,
        changes: [
            {
                key: 'flags.midi-qol.rangeOverride.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ]
    });
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'tentacle-of-the-deeps') return;
    const existing = documentUtils.getEffectByIdentifier(workflow.actor, 'tentacleOfTheDeeps');
    if (existing) await documentUtils.deleteDocument(existing);
    const sourceActor = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.legacy.summons, 'spectralTentacle');
    if (!sourceActor) return;
    const markerEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'tentacleOfTheDeeps',
        activityUuid: workflow.activity.uuid,
        unhideActivities: [attackActivity]
    });
    const [markerEffect] = await effectUtils.createEffects(workflow.actor, [markerEffectData]);
    if (!markerEffect) return;
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        duration: automationUtils.getConfigValue(document, 'duration'),
        name: automationUtils.getConfigValue(document, 'name') || undefined,
        tokenImg: automationUtils.getConfigValue(document, 'token') || undefined,
        avatarImg: automationUtils.getConfigValue(document, 'avatar') || undefined,
        animation: automationUtils.getConfigValue(document, 'animation'),
        disposition: workflow.token.document.disposition,
        initiative: 'none',
        parent: markerEffect,
        sourceDocument: document
    });
    if (!summon) return;
    await summonUtils.placeSummons([summon], automationUtils.getConfigValue(document, 'range'), {token: workflow.token.document});
}
async function early({document, activity, actor}) {
    if (activity.identifier !== attackActivity) return;
    const markerEffect = documentUtils.getEffectByIdentifier(actor, 'tentacleOfTheDeeps');
    const tentacleActor = summonUtils.getSummonBySource(document)[0]?.actor;
    if (!markerEffect || !tentacleActor) return;
    const effectData = rangeOverrideData(document, markerEffect);
    await effectUtils.createEffects(actor, [effectData]);
    await effectUtils.createEffects(tentacleActor, [effectData]);
}
async function late({document, workflow}) {
    if (workflow.activity.identifier !== attackActivity) return;
    const tentacleActor = summonUtils.getSummonBySource(document)[0]?.actor;
    const effects = [documentUtils.getEffectByIdentifier(workflow.actor, 'tentacleOfTheDeepsAttack')];
    if (tentacleActor) effects.push(documentUtils.getEffectByIdentifier(tentacleActor, 'tentacleOfTheDeepsAttack'));
    for (const effect of effects.filter(effect => effect)) await documentUtils.deleteDocument(effect);
}
export const tentacleOfTheDeeps = {
    name: 'Tentacle of the Deeps',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50},
        {pass: 'itemPreTargeting', macro: early, priority: 50},
        {pass: 'itemAttackRollComplete', macro: late, priority: 50}
    ],
    config: {
        name: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Config.CustomName',
            category: 'summons'
        },
        token: {
            default: '',
            type: 'file',
            label: 'CHRISPREMADES.Config.CustomToken',
            category: 'summons'
        },
        avatar: {
            default: '',
            type: 'file',
            label: 'CHRISPREMADES.Config.CustomAvatar',
            category: 'summons'
        },
        duration: {
            default: 60,
            type: 'number',
            label: 'CHRISPREMADES.Config.DurationSeconds',
            category: 'summons'
        },
        range: {
            default: 60,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'summons'
        },
        animation: {
            default: {source: 'chris-premades', identifier: 'waterSummon'},
            type: 'selectAnimation',
            inputs: ['summon', 'location', 'token'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};

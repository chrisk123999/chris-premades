import {automationUtils, summonUtils, activityUtils, effectUtils, itemUtils, documentUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'activityId');
    if (activityId != workflow.activity.id) return;
    const summonsData = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'summons');
    if (!summonsData.length) return;
    const duration = activityUtils.getDuration(workflow.activity);
    const parent = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const summons = await Promise.all(summonsData.map(async summonData => {
        const {sourceActorUuid, name, avatarImg, tokenImg, animation, sounds, items, initiative} = summonData;
        const sourceActor = await fromUuid(sourceActorUuid);
        if (!sourceActor) return;
        return await summonUtils.createSummon(workflow.actor, sourceActor, {duration, avatarImg, tokenImg, name, animation, parent, sounds, sourceDocument: document, items, initiative});
    }));
    if (!summons.length) return;
    const placeActivityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'placeActivityId');
    const recallActivityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'recallActivityId');
    const otherActivityIdentifiers = [placeActivityId, recallActivityId].map(id => document.system.activities.get(id)).filter(Boolean).map(activity => documentUtils.getIdentifier(activity));
    if (otherActivityIdentifiers.length) await itemUtils.unhideActivities(document, otherActivityIdentifiers);
    if (workflow.token) await summonUtils.placeSummons(summons, workflow.activity.range.value, {token: workflow.token.document});
}
async function place({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'placeActivityId');
    if (activityId != workflow.activity.id) return;
    await summonUtils.placeAllSourceSummons(document, workflow.activity.range.value, {token: workflow.token.document});
}
async function recall({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'recallActivityId');
    if (activityId != workflow.activity.id) return;
    await summonUtils.recallAllSourceSummons(document);
}
async function deleted({document, summon}) {
    const summons = summonUtils.getSummonBySource(document).filter(i => i !== summon);
    if (summons.length) return;
    const concentrationEffect = effectUtils.getConcentrationEffect(summon.owner, summon.sourceDocument);
    if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
    const placeActivityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'placeActivityId');
    const recallActivityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'recallActivityId');
    const otherActivityIdentifiers = [placeActivityId, recallActivityId].map(id => document.system.activities.get(id)).filter(Boolean).map(activity => documentUtils.getIdentifier(activity));
    if (!otherActivityIdentifiers.length) return;
    await itemUtils.rehideActivities(document, otherActivityIdentifiers);
}
export const summon = {
    rules: 'all',
    version: '1.6.2',
    category: 'summons',
    generic: true,
    documents: ['Item'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: place,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: recall,
            priority: 50
        }
    ],
    summon: [
        {
            pass: 'delete',
            macro: deleted,
            priority: 50
        }
    ],
    genericConfig: {
        activityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.CreateActivity',
            hint: ''
        },
        placeActivityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.PlaceActivity',
            hint: ''
        },
        recallActivityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.RecallActivity',
            hint: ''
        },
        summons: {
            default: [],
            type: 'selectSummons',
            label: 'CHRISPREMADES.Config.Summons',
            hint: ''
        }
    }
};
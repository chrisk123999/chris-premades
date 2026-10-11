import {activityUtils, actorUtils, automationUtils, documentUtils, effectUtils, itemUtils, Logging, summonUtils, tokenUtils} from '../../proxy.mjs';
function getOtherActivityIdentifiers(document, {placeActivityId, recallActivityId, moveActivityId}) {
    return [placeActivityId, recallActivityId, moveActivityId].map(id => document.system.activities.get(id)).filter(Boolean).map(activity => documentUtils.getIdentifier(activity));
}
async function use({document, workflow}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'summon', configKeys);
    if (config.activityId != workflow.activity.id) return;
    if (!config.summons.length) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(document), 'No summon creatures configured.', {notify: 'warn'});
    if (config.replaceExisting) await Promise.all(summonUtils.getSummonsBySource(document).map(summon => summonUtils.deleteSummon(summon)));
    const duration = activityUtils.getDuration(workflow.activity);
    const parent = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const summons = await Promise.all(config.summons.map(async summonData => {
        const {sourceActorUuid, name, avatarImg, tokenImg, animation, sounds, items, initiative} = summonData;
        const sourceActor = await fromUuid(sourceActorUuid);
        if (!sourceActor) return;
        return await summonUtils.createSummon(workflow.actor, sourceActor, {duration, avatarImg, tokenImg, name, animation, parent, sounds, sourceDocument: document, items, initiative});
    }));
    if (!summons.length) return;
    const otherActivityIdentifiers = getOtherActivityIdentifiers(document, config);
    if (otherActivityIdentifiers.length) await itemUtils.unhideActivities(document, otherActivityIdentifiers, {favorite: config.favorite ?? false});
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
async function move({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'moveActivityId');
    if (activityId != workflow.activity.id) return;
    const summons = summonUtils.getSummonsBySource(document).filter(summon => summon.token);
    for (const summon of summons) await summon.move(workflow.activity.range.value, {token: workflow.token?.document});
    await leash({document});
}
async function leash({document}) {
    const maxDistance = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'maxDistance');
    const token = actorUtils.getFirstToken(document.actor);
    if (!maxDistance || !token) return;
    const summons = summonUtils.getSummonsBySource(document).filter(summon => summon.token && tokenUtils.getDistance(token, summon.token) > maxDistance);
    await Promise.all(summons.map(summon => summonUtils.deleteSummon(summon)));
}
async function deleted({document, summon}) {
    const summons = summonUtils.getSummonsBySource(document).filter(i => i !== summon);
    if (summons.length) return;
    const concentrationEffect = effectUtils.getConcentrationEffect(summon.owner, summon.sourceDocument);
    if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'summon', configKeys);
    const otherActivityIdentifiers = getOtherActivityIdentifiers(document, config);
    if (!otherActivityIdentifiers.length) return;
    await itemUtils.rehideActivities(document, otherActivityIdentifiers, {favorite: config.favorite ?? false});
}
/**
 * Creates summons from this item and handles placing, recalling, moving and dismissing them.
 * Bound on an item. Fires on `itemRollFinished`, `nearbyMoved` and `delete`.
 * Creating summons unhides the place, recall and move activities.
 * When the last summon is deleted, concentration ends and those activities are hidden again.
 *
 * Config:
 * - `activityId`: activity that creates the summons.
 * - `placeActivityId`: activity that places this item's summons within its range.
 * - `recallActivityId`: activity that recalls this item's summons.
 * - `moveActivityId`: rolling this activity moves this item's placed summons up to the activity's range.
 * - `summons`: summons created by the create activity.
 * - `maxDistance`: summons farther than this many feet from the summoner are dismissed when either moves. 0 disables it.
 * - `replaceExisting`: dismiss this item's existing summons before creating new ones.
 * - `favorite`: favorite the unhidden activities.
 */
export const summon = {
    rules: 'all',
    version: '1.8.0',
    category: 'summons',
    generic: true,
    documents: ['item'],
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
        },
        {
            pass: 'itemRollFinished',
            macro: move,
            priority: 50
        }
    ],
    move: [
        {
            pass: 'nearbyMoved',
            macro: leash,
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
        moveActivityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Macros.Generic.Summon.MoveActivity',
            hint: 'CHRISPREMADES.Macros.Generic.Summon.MoveActivityHint'
        },
        summons: {
            default: [],
            type: 'selectSummons',
            label: 'CHRISPREMADES.Config.Summons',
            hint: ''
        },
        maxDistance: {
            default: 0,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Generic.Summon.MaxDistance',
            hint: 'CHRISPREMADES.Macros.Generic.Summon.MaxDistanceHint'
        },
        replaceExisting: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Generic.Summon.ReplaceExisting',
            hint: 'CHRISPREMADES.Macros.Generic.Summon.ReplaceExistingHint'
        },
        favorite: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.FavoriteActivities',
            hint: ''
        }
    }
};
const configKeys = Object.keys(summon.genericConfig);

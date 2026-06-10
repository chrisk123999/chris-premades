import {automationUtils, animationUtils, summonUtils, activityUtils, effectUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'activityId');
    if (activityId != workflow.activity.id) return;
    const summons = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'summons');
    if (!summons.length) return;
    const {sourceActorUuid, name, avatarImg, tokenImg} = summons[0];
    const sourceActor = await fromUuid(sourceActorUuid);
    if (!sourceActor) return;
    const preRemoveAnimation = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'preRemoveAnimation');
    const postRemoveAnimation = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'postRemoveAnimation');
    const prePlaceAnimation = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'prePlaceAnimation');
    const postPlaceAnimation = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'postPlaceAnimation');
    const duration = activityUtils.convertDuration(workflow.activity).seconds;
    //const summonItems = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'summonItems');
    const parent = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const placeAlpha = (prePlaceAnimation?.source && prePlaceAnimation?.identifier) ? 0 : 1;
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {duration, avatarImg, tokenImg, name, placeAlpha, preRemoveAnimation, postRemoveAnimation, prePlaceAnimation, postPlaceAnimation, parent});
    await summon.place(workflow.activity.range.value);
}
export const summon = {
    rules: 'all',
    version: '1.6.1',
    category: 'summons',
    generic: true,
    documents: ['Item'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        activityId: {
            default: '',
            type: 'selectActivity',
            label: 'CHRISPREMADES.Config.Activity',
            hint: ''
        },
        summons: {
            default: [],
            type: 'selectSummons',
            label: 'CHRISPREMADES.Config.Summons',
            hint: '',
            max: 1
        },
        preRemoveAnimation: {
            default: {
                source: '',
                identifier: ''
            },
            type: 'selectAnimation',
            inputs: ['summon', 'location', 'token'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: ''
        },
        postRemoveAnimation: {
            default: {
                source: '',
                identifier: ''
            },
            type: 'selectAnimation',
            inputs: ['summon', 'location', 'token'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: ''
        },
        prePlaceAnimation: {
            default: {
                source: '',
                identifier: ''
            },
            type: 'selectAnimation',
            inputs: ['summon', 'location', 'token'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: ''
        },
        postPlaceAnimation: {
            default: {
                source: '',
                identifier: ''
            },
            type: 'selectAnimation',
            inputs: ['summon', 'location', 'token'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: ''
        }
    }
};
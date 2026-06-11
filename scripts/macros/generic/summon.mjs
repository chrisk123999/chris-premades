import {automationUtils, summonUtils, activityUtils, effectUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    const activityId = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'activityId');
    if (activityId != workflow.activity.id) return;
    const summons = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'summons');
    if (!summons.length) return;
    const {sourceActorUuid, name, avatarImg, tokenImg, animation, sounds} = summons[0];
    const sourceActor = await fromUuid(sourceActorUuid);
    if (!sourceActor) return;
    const duration = activityUtils.convertDuration(workflow.activity).seconds;
    //const summonItems = automationUtils.getGenericConfigValue(document, 'chris-premades', 'summon', 'summonItems');
    const parent = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {duration, avatarImg, tokenImg, name, animation, parent, sounds, sourceDocument: workflow.item});
    await summon.place(workflow.activity.range.value);
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
        }
    }
};
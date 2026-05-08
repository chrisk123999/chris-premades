import {activityUtils, dialogUtils, effectUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let target = workflow.targets.first();
    if (!target) return;
    let failedSave = false;
    let clairvoyant = itemUtils.getItemByIdentifier(workflow.actor, 'clairvoyantCombatant');
    let useClairvoyant = clairvoyant ? activityUtils.getActivityByIdentifier(clairvoyant, 'use', {strict: true}) : false;
    if (useClairvoyant && clairvoyant?.system.uses.value && await dialogUtils.confirmUseItem(clairvoyant)) {
        let featureRoll = await workflowUtils.syntheticActivityRoll(useClairvoyant, [target], {consumeUsage: true, consumeResources: true});
        failedSave = featureRoll?.failedSaves.size > 0;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        flags: {
            'chris-premades': {
                info: {
                    identifier: 'awakenedMind'
                }
            },
            dae: {
                stackable: 'noneName'
            }
        }
    };
    let sourceEffect = await effectUtils.createEffect(workflow.actor, effectData);
    if (failedSave) {
        effectData.changes = [
            {
                key: 'flags.midi-qol.disadvantage.attack.all',
                mode: 5,
                value: 'targetId === "' + workflow.token.id + '"',
                priority: 20
            },
            {
                key: 'flags.midi-qol.grants.advantage.attack.all',
                mode: 5,
                value: 'targetId === "' + workflow.token.id + '"',
                priority: 20
            }
        ];
    }
    await effectUtils.createEffect(target.actor, effectData, {parentEntity: sourceEffect, strictlyInterdependent: true});
}
export let awakenedMind = {
    name: 'Awakened Mind',
    version: '1.5.21',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};

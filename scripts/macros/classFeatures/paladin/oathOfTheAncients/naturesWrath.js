import {dialogUtils, itemUtils, socketUtils} from '../../../../utils.js';

async function early({workflow}) {
    if (!workflow.targets.size) return;
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.NaturesWrath.Select', [
        ['DND5E.AbilityStr', 'str'],
        ['DND5E.AbilityDex', 'dex']
    ], {userId: socketUtils.firstOwner(workflow.targets.first(), true)});
    if (!selection || selection === 'str') return;
    let featureData = workflow.item.toObject();
    featureData.effects[0].changes[0].value = featureData.effects[0].changes[0].value.replace('saveAbility=str', 'saveAbility=dex');
    featureData.system.save.ability = 'dex';
    let feature = await itemUtils.syntheticItem(featureData, workflow.actor);
    workflow.item = feature;
}
export let naturesWrath = {
    name: 'Channel Divinity: Nature\'s Wrath',
    version: '0.12.24',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};
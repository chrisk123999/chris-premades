import {compendiumUtils, constants, errors, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (!workflow.targets.size) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Balm of Peace', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BalmOfPeace.Balm'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    for (let target of workflow.targets) {
        await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [target]);
    }
}
export let balmOfPeace = {
    name: 'Channel Divinity: Balm of Peace',
    version: '0.12.40',
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
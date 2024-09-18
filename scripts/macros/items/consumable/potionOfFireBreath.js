import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let actor = workflow.targets.first?.actor ?? workflow.actor;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Potion of Fire Breath Attack', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.PotionOfFireBreath.Attack', identifier: 'potionOfFireBreathAttack'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.actor.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    let effect = await effectUtils.createEffect(actor, effectData, {identifier: 'potionOfFireBreath', vae: [{type: 'use', name: featureData.name, identifier: 'potionOfFireBreathAttack'}]});
    if (!effect) return;
    await itemUtils.createItems(actor, [featureData], {favorite:true, parentEntity: effect});
}
async function late({workflow}) {
    if (workflow.item.system.uses.value) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'potionOfFireBreath');
    if (effect) await genericUtils.remove(effect);
}
export let potionOfFireBreath = {
    name: 'Potion of Fire Breath',
    version: '0.12.70',
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
export let potionOfFireBreathAttack = {
    name: 'Potion of Fire Breath: Attack',
    version: potionOfFireBreath.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};
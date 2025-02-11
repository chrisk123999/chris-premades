import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

// TODO: Refactor this if https://github.com/foundryvtt/dnd5e/issues/4706 gets implemented
async function use({workflow}) {
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.targets.size) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let buttons = [
        ['DND5E.DamageAcid', 'acid', {image: 'icons/magic/acid/projectile-faceted-glob.webp'}],
        ['DND5E.DamageCold', 'cold', {image: 'icons/magic/air/wind-tornado-wall-blue.webp'}],
        ['DND5E.DamageFire', 'fire', {image: 'icons/magic/fire/beam-jet-stream-embers.webp'}],
        ['DND5E.DamageLightning', 'lightning', {image: 'icons/magic/lightning/bolt-blue.webp'}],
        ['DND5E.DamagePoison', 'poison', {image: 'icons/magic/death/skull-poison-green.webp'}]
    ];
    let damageType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.DamageType', buttons);
    if (!damageType) damageType = 'fire';
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Dragon Breath', {getDescription: true, translate: 'CHRISPREMADES.Macros.DragonsBreath.DragonBreath', identifier: 'dragonBreath', castDataWorkflow: workflow, object: true});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let diceNumber = workflowUtils.getCastLevel(workflow) + 1;
    let activityId = Object.keys(featureData.system.activities)[0];
    featureData.system.activities[activityId].damage.parts[0].number = diceNumber;
    featureData.system.activities[activityId].damage.parts[0].types = [damageType];
    featureData.system.activities[activityId].save.dc = {
        calculation: '',
        formula: itemUtils.getSaveDC(workflow.item).toString(),
        value: Number(itemUtils.getSaveDC(workflow.item))
    };
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    for (let target of workflow.targets) {
        let effect = await effectUtils.createEffect(target.actor, effectData, {concentrationItem: workflow.item, interdependent: true, vae: [{type: 'use', name: featureData.name, identifier: 'dragonBreath'}], identifier: 'dragonsBreath'});
        await itemUtils.createItems(target.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.Section.SpellFeatures')});
    }
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
export let dragonsBreath = {
    name: 'Dragon\'s Breath',
    version: '1.1.0',
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
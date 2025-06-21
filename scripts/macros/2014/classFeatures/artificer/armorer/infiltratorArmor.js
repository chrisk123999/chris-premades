import {combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';

async function use({workflow}) {
    let infiltratorEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'infiltratorArmor');
    if (infiltratorEffect) return;
    let guardianEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'guardianArmor');
    if (guardianEffect) {
        let infuseItem = itemUtils.getItemByIdentifier(workflow.actor, 'infuseItem');
        let {enhancedWeapon, radiantWeapon} = infuseItem?.flags['chris-premades']?.infusions ?? {};
        if (enhancedWeapon || radiantWeapon) {
            let gauntlets = itemUtils.getItemByIdentifier(workflow.actor, 'thunderGauntlets');
            if (gauntlets && [enhancedWeapon, radiantWeapon].includes(gauntlets.uuid)) {
                let actual = 'enhancedWeapon';
                if (radiantWeapon === gauntlets.uuid) actual = 'radiantWeapon';
                await genericUtils.setFlag(infuseItem, 'chris-premades', 'infusions.-=' + actual, null);
            }
        }
        await genericUtils.remove(guardianEffect);
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Infiltrator Armor: Lightning Launcher', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.InfiltratorArmor.LightningLauncher', identifier: 'lightningLauncher'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.attributes.movement.walk',
                mode: 2,
                value: genericUtils.handleMetric(5),
                priority: 20
            },
            {
                key: 'flags.midi-qol.advantage.skill.ste',
                mode: 0,
                value: 1,
                priority: 20
            }
        ]
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'infiltratorArmor', vae: [{type: 'use', name: featureData.name, identifier: 'lightningLauncher'}]});
    if (!effect) return;
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect});
}
async function damage({workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!combatUtils.perTurnCheck(workflow.item, 'lightningLauncher', true, workflow.token.id)) return;
    let selection = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.InfiltratorArmor.ExtraDamage');
    if (!selection) return;
    await combatUtils.setTurnCheck(workflow.item, 'lightningLauncher');
    let bonusDamageFormula = '1d6[lightning]';
    await workflowUtils.bonusDamage(workflow, bonusDamageFormula, {damageType: 'lightning'});
}
export let infiltratorArmor = {
    name: 'Arcane Armor: Infiltrator Model',
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
export let infiltratorArmorLightningLauncher = {
    name: 'Arcane Armor: Lightning Launcher',
    version: infiltratorArmor.version,
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};
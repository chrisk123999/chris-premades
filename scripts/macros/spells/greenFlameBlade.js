import {actorUtils, compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && i.system.actionType === 'mwak');
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.GreenFlameBlade.NoWeapons', 'warn');
        return;
    }
    let selectedWeapon;
    if (weapons.length === 1) {
        selectedWeapon = weapons[0];
    } else {
        selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.GreenFlameBlade.SelectWeapon', weapons);
    }
    if (!selectedWeapon) return;
    let level = actorUtils.getLevelOrCR(workflow.actor);
    let diceNumber = Math.floor((level + 1) / 6);
    let weaponData = genericUtils.duplicate(selectedWeapon.toObject());
    delete weaponData._id;
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    if (diceNumber) weaponData.system.damage.parts.push([diceNumber + 'd8[' + damageType + ']', damageType]);
    let attackWorkflow = await workflowUtils.syntheticItemDataRoll(weaponData, workflow.actor, [workflow.targets.first()]);
    if (!attackWorkflow) return;
    if (!attackWorkflow.hitTargets.size) return;
    let nearbyTargets = tokenUtils.findNearby(workflow.targets.first(), 5, 'ally');
    if (!nearbyTargets.length) return;
    let target = nearbyTargets[0];
    if (nearbyTargets.length > 1) {
        let targetSelect = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Macros.GreenFlameBlade.Leap', nearbyTargets);
        if (targetSelect) target = targetSelect[0];
    }
    if (!target) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.spellFeatures, 'Green-Flame Blade: Leap', {getDescription: true, translate: 'CHRISPREMADES.Macros.GreenFlameBlade.LeapFeature', object: true});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let modifier = itemUtils.getMod(workflow.item);
    let damageFormula = modifier + '[' + damageType + ']';
    if (diceNumber) damageFormula = diceNumber + 'd8[' + damageType + '] + ' + modifier;
    featureData.system.damage.parts = [
        [damageFormula, damageType]
    ];
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, [target]);
}
export let greenFlameBlade = {
    name: 'Green-Flame Blade',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'fire',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
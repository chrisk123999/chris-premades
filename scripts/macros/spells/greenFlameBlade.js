import {actorUtils, constants, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && i.system.actionType === 'mwak');
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.macros.greenFlameBlade.noWeapons', 'warn');
        return;
    }
    let selectedWeapon;
    if (weapons.length === 1) {
        selectedWeapon = weapons[0];
    } else {
        selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.macros.greenFlameBlade.selectWeapon', weapons);
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
        let targetSelect = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.macros.greenFlameBlade.leap', nearbyTargets);
        if (targetSelect) target = targetSelect[0];
    }
    if (!target) return;
    let modifier = itemUtils.getMod(workflow.item);
    let damageFormula = modifier + '[' + damageType + ']';
    if (diceNumber) damageFormula = diceNumber + 'd8[' + damageType + '] + ' + modifier;
    let damageRoll = await new CONFIG.Dice.DamageRoll(damageFormula, workflow.actor.getRollData()).evaluate();
    await workflowUtils.applyWorkflowDamage(workflow.token, damageRoll, damageType, [target], {flavor: workflow.item.name, itemCardId: attackWorkflow.itemCardId});
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
            label: 'CHRISPREMADES.config.damageType',
            type: 'select',
            default: 'fire',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
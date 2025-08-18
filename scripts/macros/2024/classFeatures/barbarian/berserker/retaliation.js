import {activityUtils, constants, dialogUtils, genericUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (workflow.targets.size !== 1) return;
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && constants.meleeWeaponTypes.includes(i.system.type?.value));
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.BoomingBlade.NoWeapons', 'warn');
        return;
    }
    let selectedWeapon;
    if (weapons.length === 1) {
        selectedWeapon = weapons[0];
    } else {
        selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Retaliation.Weapon', weapons);
        if (!selectedWeapon) return;
    }
    let weaponData = genericUtils.duplicate(selectedWeapon.toObject());
    let attackId = selectedWeapon.system.activities.getByType('attack')?.[0]?.id;
    if (!attackId) return;
    weaponData.system.activities[attackId].activation.type = 'special';
    await workflowUtils.syntheticItemDataRoll(weaponData, workflow.actor, [workflow.targets.first()]);
}
export let retaliation = {
    name: 'Retaliation',
    version: '1.3.10',
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
import {actorUtils, dialogUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    if (workflow.targets.size !== 1) return;
    const weapons = actorUtils.getEquippedWeapons(workflow.actor);
    if (!weapons.length) return;
    const selectedWeapon = weapons.length === 1 ? weapons[0] : await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Generic.BladeSpell.Weapon', weapons);
    if (!selectedWeapon) return;
    
}
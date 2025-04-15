import {actorUtils, constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && ['simpleM', 'simpleR', 'martialM', 'martialR'].includes(i.system.type?.value) && i.system.prof?.hasProficiency);
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.TrueStrike.NoWeapons', 'warn');
        return;
    }
    let selectedWeapon;
    if (weapons.length === 1) {
        selectedWeapon = weapons[0];
    } else {
        selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.TrueStrike.SelectWeapon', weapons);
    }
    if (!selectedWeapon) return;
    let level = actorUtils.getLevelOrCR(workflow.actor);
    let diceNumber = Math.floor((level + 1) / 6);
    let weaponData = genericUtils.duplicate(selectedWeapon.toObject());
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    let selection = await dialogUtils.confirm(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.TrueStrike.ReplaceDamage', {type: damageType}));
    for (let activity of selectedWeapon.system.activities.getByType('attack')) {
        let attackId = activity.id;
        if (!attackId) return;
        weaponData.system.activities[attackId].attack.ability = workflow.item.system.ability.length ? workflow.item.system.ability : workflow.actor.system.attributes.spellcasting;
        if (selection) {
            weaponData.system.damage.base.types = [damageType];
            weaponData.system.activities[attackId].damage.parts.forEach(part => 
                part.types = [damageType]
            );
        }
        if (diceNumber) {
            weaponData.system.activities[attackId].damage.parts.push({
                number: diceNumber,
                denomination: 6,
                types: [damageType]
            });
        }
    }
    await workflowUtils.syntheticItemDataRoll(weaponData, workflow.actor, [workflow.targets.first()]);
}
export let trueStrike = {
    name: 'True Strike',
    version: '1.2.24',
    rules: 'modern',
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
            default: 'radiant',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
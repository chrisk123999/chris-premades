import {dialogUtils, effectUtils, genericUtils, itemUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let validTypes = itemUtils.getConfig(workflow.item, 'damageTypes');
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let buttons = validTypes.map(i => ([CONFIG.DND5E.damageTypes[i].label, Object.keys(CONFIG.DND5E.damageTypes).find(j => j === i)]));
    if (!buttons.length) return;
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.elementalWeapon.selectDamageType', buttons);
    if (!selection) return;
    await Promise.all(workflow.targets.map(async token => {
        if (!token.actor) return;
        let weapons = token.actor.items.filter(i => i.type === 'weapon' && !i.system.properties.has('mgc') && i.system.equipped);
        let selectedWeapon;
        if (!weapons.length) {
            genericUtils.notify('CHRISPREMADES.elementalWeapon.noWeapons', 'warn');
            return;
        }
        if (weapons.length === 1) {
            selectedWeapon = weapons[0];
        } else {
            selectedWeapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.elementalWeapon.selectWeapon', weapons);
            if (!selectedWeapon) return;
        }
        let castLevel = workflow.castData.castLevel;
        let bonus = 1;
        if (castLevel >= 5 && castLevel < 7) {
            bonus = 2;
        } else if (castLevel > 7) {
            bonus = 3;
        }
        let effectData = {
            name: workflow.item.name,
            icon: workflow.item.img,
            origin: workflow.item,
            duration: {
                seconds: 3600 * workflow.item.system.duration.value
            },
            changes: [
                {
                    key: 'name',
                    mode: 5,
                    value: selectedWeapon.name + ' (' + CONFIG.DND5E.damageTypes[selection].label + ')',
                    priority: 20
                },
                {
                    key: 'system.properties',
                    mode: 2,
                    value: 'mgc',
                    priority: 20
                },
                {
                    key: 'system.magicalBonus',
                    mode: 5,
                    value: bonus,
                    priority: 20
                },
                {
                    key: 'system.damage.parts',
                    mode: 2,
                    value: JSON.stringify([[formula + '[' + selection + ']', selection]]),
                    priority: 20
                }
            ]
        };
        console.log(selectedWeapon);
        await itemUtils.enchantItem(selectedWeapon, effectData, {concentrationItem: workflow.item});
    }));
}
export let elementalWeapon = {
    name: 'Elemental Weapon',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priroity: 50
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.config.formula',
            type: 'text',
            default: '1d4',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.config.damageTypes',
            type: 'selectMultiple',
            default: [
                'acid',
                'cold',
                'fire',
                'lightning',
                'thunder'
            ],
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
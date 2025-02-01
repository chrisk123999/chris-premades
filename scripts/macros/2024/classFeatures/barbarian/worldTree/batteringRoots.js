import {constants, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';
import {pushMastery, toppleMastery} from '../../../../mechanics/masteries.js';
async function turnStart({trigger: {entity: item}}) {
    let weaponProperties = itemUtils.getConfig(item, 'weaponProperties');
    if (!weaponProperties.length) return;
    let range = Number(itemUtils.getConfig(item, 'range'));
    if (isNaN(range)) range = 10;
    let validWeapons = item.actor.items.filter(i => i.type === 'weapon' && i.system.properties?.some(j => weaponProperties.includes(j)));
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item,
        changes: [
            {
                key: 'system.range.reach',
                mode: 2,
                value: range,
                priority: 20
            }
        ],
        duration: {
            turns: 1
        }
    };
    await Promise.all(validWeapons.map(async weapon => {
        await itemUtils.enchantItem(weapon, effectData);
    }));
}
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || !workflow.item) return;
    let weaponProperties = itemUtils.getConfig(item, 'weaponProperties');
    if (!weaponProperties.length) return;
    if (!workflow.item.system.properties.some(i => weaponProperties.includes(i))) return;
    let selection;
    if (workflow.item.system.mastery != 'push' && workflow.item.system.mastery != 'topple') {
        selection = await dialogUtils.buttonDialog(item, 'CHRISPREMADES.Macros.BatteringRoots.Mastery', [['CHRISPREMADES.Mastery.Push', 'push'], ['CHRISPREMADES.Mastery.Topple', 'topple']]);
        if (!selection) return;
    } else if (workflow.item.system.mastery === 'push') {
        selection = 'topple';
    }
    if (selection === 'topple') {
        await toppleMastery.masteryMacro({workflow});
    } else {
        await pushMastery.masteryMacro({workflow});
    }
}
export let batteringRoots = {
    name: 'Battering Roots',
    version: '1.1.26',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: attack,
                priority: 250
            }
        ]
    },
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    config: [
        {
            value: 'weaponProperties',
            label: 'CHRISPREMADES.Config.WeaponProperties',
            type: 'select-many',
            default: ['hvy', 'ver'],
            options: constants.itemProperties,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'text',
            default: 10,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
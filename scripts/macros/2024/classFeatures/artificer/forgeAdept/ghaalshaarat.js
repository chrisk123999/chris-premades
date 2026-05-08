import {constants, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function imbueWeapon ({trigger: {entity: item}, workflow}) {
    if (itemUtils.getConfig(item, 'requireTools') && !workflow.actor.items.some(i => i.system.type?.baseItem === 'smith'))
        return genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.GhaalShaarat.NeedTools', {itemName: item.name}), 'warn');
    let weapons = workflow.actor.items.filter(i => {
        if (i.type !== 'weapon') return;
        if (!['simpleM', 'martialM'].some(t => i.system.type?.value === t)) return;
        if (constants.unarmedAttacks.includes(genericUtils.getIdentifier(i))) return;
        return true;
    });
    if (!weapons.length) return genericUtils.notify('CHRISPREMADES.Macros.GhaalShaarat.NoWeapons', 'warn');
    let selection = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.InfuseItem.WhichWeapon', weapons, {displayTooltips: true});
    if (!selection) return;
    let enchantmentData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'name',
                value: `${item.name}: {}`,
                mode: 5,
                priority: 20
            },
            {
                key: 'system.properties',
                value: 'mgc',
                mode: 2,
                priority: 20
            },
            {
                key: 'system.properties',
                value: 'thr',
                mode: 2,
                priority: 20
            },
            {
                key: 'system.properties',
                value: 'ret',
                mode: 2,
                priority: 20
            },
            {
                key: 'system.magicalBonus',
                value: getBonus(workflow.actor),
                mode: 4,
                priority: 20
            },
            {
                key: 'system.range.value',
                value: '30',
                mode: 5,
                priority: 20
            },
            {
                key: 'system.range.long',
                value: '120',
                mode: 5,
                priority: 20
            }
        ]
    };
    let enchant = await itemUtils.enchantItem(selection, enchantmentData, {parentEntity: item, identifier: 'ghaalShaaratEnchantment'});    
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'flags.chris-premades.activeGhaalShaarat',
                value: enchant.uuid,
                mode: 5,
                priority: 20
            }
        ],
        flags: {
            dae: {
                stackable: 'noneName',
                enableCondition: '!statuses.dead'
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: enchant, strictlyInterdependent: true, identifier: 'ghaalShaaratEffect'});
}
function getBonus(actor) {
    let bonus = 1;
    for (let i of actor.itemTypes.feat) {
        let id = genericUtils.getIdentifier(i);
        if (id === 'perfectWeapon') return 3;
        if (id === 'runesOfWar') bonus = 2;
    }
    return bonus;
}
async function upgradeBonus({trigger: {entity: item}}) {
    let activeGhaalShaarat = await fromUuid(item.parent.flags['chris-premades']?.activeGhaalShaarat);
    if (!activeGhaalShaarat) return;
    let bonus = activeGhaalShaarat.changes.find(c => c.key === 'system.magicalBonus');
    if (bonus) bonus.value = getBonus(item.parent);
    else activeGhaalShaarat.changes.push({
        key: 'system.magicalBonus',
        value: getBonus(item.parent),
        mode: 4,
        priority: 20
    });
    return await genericUtils.update(activeGhaalShaarat, {changes: activeGhaalShaarat.changes});
}
export let ghaalShaarat = {
    name: 'Ghaal\'Shaarat',
    version: '1.5.21',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: imbueWeapon,
                priority: 50
            }
        ]
    },
    config: [        
        {
            value: 'requireTools',
            label: 'CHRISPREMADES.Macros.GhaalShaarat.RequireTools',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let upgradeGhaalShaarat = {
    name: 'Upgrade Ghaal\'Shaarat',
    version: ghaalShaarat.version,
    rules: ghaalShaarat.rules,
    item: [
        {
            pass: 'created',
            macro: upgradeBonus,
            priority: 45
        },
        {
            pass: 'itemMedkit',
            macro: upgradeBonus,
            priority: 45
        },
        {
            pass: 'actorMunch',
            macro: upgradeBonus,
            priority: 45
        }
    ]
};

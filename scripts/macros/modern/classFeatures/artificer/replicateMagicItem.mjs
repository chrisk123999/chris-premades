import {genericUtils} from '../../../../proxy.mjs';
import {swapArtificerPlan} from '../../../all.mjs';
const itemIDs = {
    2: ['alchemy-jug', 'bag-of-holding', 'cap-of-water-breathing', 'goggles-of-night', 'manifold-tool', 'rope-of-climbing', 'sending-stones', 'shield-1', 'wand-of-magic-detection', 'wand-of-secrets', 'wand-of-the-war-mage-1', 'wraps-of-unarmed-power-1'],
    6: ['boots-of-elvenkind', 'boots-of-the-winding-path', 'cloak-of-elvenkind', 'cloak-of-the-manta-ray', 'eyes-of-charming', 'eyes-of-minute-seeing', 'gloves-of-thievery', 'helm-of-awareness', 'lantern-of-revealing', 'mind-sharpener', 'necklace-of-adaptation', 'pipes-of-haunting', 'repulsion-shield', 'ring-of-swimming', 'ring-of-water-walking', 'sentinel-shield', 'spell-refueling-ring', 'wand-of-magic-missiles', 'wand-of-web', 'weapon-of-warning'],
    10: ['dagger-of-venom', 'elven-chain', 'elven-chain-mail', 'elven-chain-shirt', 'ring-of-feather-falling', 'ring-of-jumping', 'ring-of-mind-shielding', 'shield-2', 'wand-of-the-war-mage-2', 'wraps-of-unarmed-power-2']
};
async function planFilter({document: item, data}) {
    const level = item.actor.classes[data.classIdentifier]?.system.levels ?? 0;
    if (!level) return;
    if (data.packIds?.length) return;
    genericUtils.setProperty(data, 'lockedFilters.additional.rarity', {
        _blank: -1,
        legendary: -1,
        artifact: -1
    });
    let identifiers = [];
    for (const [lvl, ids] of Object.entries(itemIDs))
        if (level >= Number(lvl)) identifiers.push(...ids);
    if (identifiers.length) identifiers = new Set(identifiers);
    // pass these key paths to pack indexer so the predicate can access them
    // !(system.xyz > undefined) should always be true, having no effect on filter results
    data.filters = [
        {o: 'NOT', v: {k: 'system.rarity', o: 'gt'}},
        {o: 'NOT', v: {k: 'system.identifier', o: 'gt'}},
        {o: 'NOT', v: {k: 'system.type.value', o: 'gt'}},
        {o: 'NOT', v: {k: 'system.properties', o: 'gt'}},
        {o: 'NOT', v: {k: 'system.magicalBonus', o: 'gt'}},
        {o: 'NOT', v: {k: 'system.armor.magicalBonus', o: 'gt'}}
    ];
    data.predicates.push(entry => {
        const id = entry.system.identifier;
        if (identifiers?.size && identifiers.has(id)) return true;
        const type = entry.system.type?.value;
        if (['potion', 'scroll'].includes(type)) return false;
        const tier1 = level >= 2;
        const tier2 = level >= 6;
        const tier3 = level >= 10;
        const tier4 = level >= 14;
        const rarity = entry.system.rarity;
        const props = entry.system.properties;
        const bonus = entry.system.magicalBonus;
        const armorBonus = entry.system.armor?.magicalBonus;
        const wondrous = type === 'wondrous' || type === 'trinket';
        if (tier1 && rarity === 'common') return true;
        if (tier3 && rarity === 'uncommon' && wondrous) return true;
        if (tier4 && rarity === 'rare' && wondrous) return true;
        if (tier1) {
            if (bonus == 1 && type === 'shield' && rarity === 'uncommon') return true;
            if (bonus == 1 && entry.type === 'weapon' && rarity === 'uncommon') return true;
            if (props.includes('repeating') || id.startsWith('repeating-shot')) return true;
            if (props.includes('returning') || id.startsWith('returning')) return true;
        }
        if (tier2) {
            if (armorBonus == 1 && rarity === 'rare') return true;
            if (props.includes('dazzling') || id.startsWith('dazzling')) return true;
        }
        if (tier3) {
            if (bonus == 2 && type === 'shield' && rarity === 'rare') return true;
            if (bonus == 2 && entry.type === 'weapon' && rarity === 'rare') return true;
            if (id.includes('armor-of-resistance') || id.match(/armor-of-[a-z]*-resistance-/)) return true;
        }
        if (tier4) {
            if (armorBonus == 2 && rarity === 'veryRare') return true;
        }
        return false;
    });
}
export const replicateMagicItem = {
    name: 'Replicate Magic Item',
    version: '2.0.4',
    rules: '2024',
    notes: swapArtificerPlan.notes,
    config: swapArtificerPlan.config,
    item: swapArtificerPlan.item,
    called: [
        {
            pass: 'actorArtificerPlanFilter',
            macro: planFilter,
            priority: 1 // all other macros should see the RAW filters
        }
    ],
    scales: [
        {
            identifier: 'replicate-magic-item',
            classIdentifier: 'artificer',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'replicate-magic-item',
                    type: 'number',
                    scale: {
                        2: {value: 2},
                        6: {value: 3},
                        10: {value: 4},
                        14: {value: 5},
                        18: {value: 6}
                    }
                },
                value: {},
                title: 'Replicate Magic Item'
            }
        },
        {
            identifier: 'magic-item-plans',
            classIdentifier: 'artificer',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'magic-item-plans',
                    type: 'number',
                    scale: {
                        2: {value: 4},
                        6: {value: 5},
                        10: {value: 6},
                        14: {value: 7},
                        18: {value: 8}
                    }
                },
                value: {},
                title: 'Magic Item Plans'
            }
        }
    ]
};

import {default as cpr} from '../../../../constants.mjs';
import {swapArtificerPlan} from '../../../all.mjs';
const itemIDs = {
    2: ['alchemy-jug', 'bag-of-holding', 'cap-of-water-breathing', 'goggles-of-night', 'rope-of-climbing', 'sending-stones', 'wand-of-magic-detection', 'wand-of-secrets'],
    6: ['boots-of-elvenkind', 'cloak-of-elvenkind', 'cloak-of-the-manta-ray', 'eyes-of-charming', 'gloves-of-thievery', 'lantern-of-revealing', 'pipes-of-haunting', 'ring-of-water-walking'],
    10: ['boots-of-striding-and-springing', 'boots-of-the-winterlands', 'bracers-of-archery', 'brooch-of-shielding', 'cloak-of-protection', 'eyes-of-the-eagle', 'gauntlets-of-ogre-power', 'gloves-of-missile-snaring', 'gloves-of-swimming-and-climbing', 'hat-of-disguise', 'headband-of-intellect', 'helm-of-telepathy', 'medallion-of-thoughts', 'necklace-of-adaptation', 'periapt-of-wound-closure', 'pipes-of-the-sewers', 'quiver-of-ehlonna', 'ring-of-jumping', 'ring-of-mind-shielding', 'slippers-of-spider-climbing', 'winged-boots'],
    14: ['amulet-of-health', 'belt-of-hill-giant-strength', 'boots-of-levitation', 'boots-of-speed', 'bracers-of-defense', 'cloak-of-the-bat', 'dimensional-shackles', 'gem-of-seeing', 'horn-of-blasting', 'ring-of-free-action', 'ring-of-protection', 'ring-of-the-ram']
};
async function infusionFilter({document: item, data}) {
    const level = item.actor.classes[data.classIdentifier]?.system.levels ?? 0;
    if (!level) return;
    const pack = game.packs.get(cpr.packs.legacy.features);
    await pack.getIndex({fields: ['system.identifier', 'system.prerequisites.level']});
    const infusions = pack.index.filter(i =>
        level >= (i.system.prerequisites?.level ?? 0) &&
        i.system.identifier.includes(swapArtificerPlan.keys.infusionIdentifier)
    ).map(i => i.system.identifier);
    const specificFilters = [];
    if (infusions.length) {
        data.tab = 'items';
        data.itemTypes.push('feat');
        specificFilters.push({o: 'AND', v: [
            {k: 'type', v: 'feat'},
            {k: 'system.identifier', o: 'in', v: new Set(infusions)}
        ]});
    }
    data.filters = [{o: 'OR', v: specificFilters}];
    if (data.packIds?.length) return;
    const identifiers = [];
    for (const lvl of Object.keys(itemIDs))
        if (level >= lvl) identifiers.push(...itemIDs[lvl]);
    if (identifiers.length) data.filters[0].v.push({k: 'system.identifier', o: 'in', v: new Set(identifiers)});
}
export const infuseItem = {
    name: 'Infuse Item',
    version: '2.0.5',
    rules: '2014',
    notes: swapArtificerPlan.notes,
    config: swapArtificerPlan.config,
    item: swapArtificerPlan.item,
    called: [
        {
            pass: 'actorArtificerPlanFilter',
            macro: infusionFilter,
            priority: 1 // all other macros should see the RAW filters
        }
    ],
    scales: [
        {
            identifier: 'infuse-item',
            classIdentifier: 'artificer',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'infuse-item',
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
                title: 'Infused Items Limit'
            }
        },
        {
            identifier: 'infusions-known',
            classIdentifier: 'artificer',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'infusions-known',
                    type: 'number',
                    scale: {
                        2: {value: 4},
                        6: {value: 6},
                        10: {value: 8},
                        14: {value: 10},
                        18: {value: 12}
                    }
                },
                value: {},
                title: 'Infusions Known'
            }
        }
    ]
};

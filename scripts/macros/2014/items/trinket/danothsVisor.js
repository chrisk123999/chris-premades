import {itemUtils} from '../../../../utils.js';
async function skill({trigger}, identifier) {
    let item = itemUtils.getItemByIdentifier(trigger.actor, identifier);
    if (!item) return;
    if (!itemUtils.getEquipmentState(item)) return;
    let validTypes = [
        'inv',
        'prc'
    ];
    if (!validTypes.includes(trigger.skillId)) return;
    return {label: 'CHRISPREMADES.Macros.DanothsVisor.Check', type: 'advantage'};
}
async function skillD({trigger}) {
    return await skill({trigger}, 'danothsVisorD');
}
async function skillA({trigger}) {
    return await skill({trigger}, 'danothsVisorA');
}
async function skillE({trigger}) {
    return await skill({trigger}, 'danothsVisorE');
}
export let danothsVisorD = {
    name: 'Danoth\'s Visor (Dormant)',
    version: '1.1.0',
    skill: [
        {
            pass: 'context',
            macro: skillD,
            priority: 50
        }
    ]
};
export let danothsVisorA = {
    name: 'Danoth\'s Visor (Awakened)',
    version: '1.1.0',
    skill: [
        {
            pass: 'context',
            macro: skillA,
            priority: 50
        }
    ],
    equipment: {
        danothsVisorSpyglass: {
            name: 'Danoth\'s Visor: Spyglass',
            compendium: 'itemEquipment',
            useJournal: true,
            translate: 'CHRISPREMADES.Macros.DanothsVisor.Spyglass'
        },
        danothsVisorXRay: {
            name: 'Danoth\'s Visor: X-Ray',
            compendium: 'itemEquipment',
            useJournal: true,
            uses: {
                spent: 0,
                max: 1,
                recovery: [
                    {
                        period: 'dawn',
                        type: 'recoverAll'
                    }
                ]
            },
            translate: 'CHRISPREMADES.Macros.DanothsVisor.XRay'
        }
    }
};
export let danothsVisorE = {
    name: 'Danoth\'s Visor (Exalted)',
    version: '1.1.0',
    skill: [
        {
            pass: 'context',
            macro: skillE,
            priority: 50
        }
    ],
    equipment: {
        danothsVisorSpyglass: {
            name: 'Danoth\'s Visor: Spyglass',
            compendium: 'itemEquipment',
            useJournal: true
        },
        danothsVisorXRay: {
            name: 'Danoth\'s Visor: X-Ray',
            compendium: 'itemEquipment',
            useJournal: true,
            uses: {
                spent: 0,
                max: 1,
                recovery: [
                    {
                        period: 'dawn',
                        type: 'recoverAll'
                    }
                ]
            }
        },
        antiMagicField: {
            name: 'Antimagic Field',
            compendium: 'personalSpell',
            uses: {
                spent: 0,
                max: 1,
                recovery: [
                    {
                        period: 'dawn',
                        type: 'recoverAll'
                    }
                ]
            },
            preparation: 'atwill'
        }
    }
};
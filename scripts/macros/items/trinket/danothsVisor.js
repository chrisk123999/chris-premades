import {itemUtils} from '../../../utils.js';
async function skill(actor, skillId, identifier) {
    let item = itemUtils.getItemByIdentifier(actor, identifier);
    if (!item) return;
    if (!itemUtils.getEquipmentState(item)) return;
    let validTypes = [
        'inv',
        'prc'
    ];
    if (!validTypes.includes(skillId)) return;
    return {label: 'CHRISPREMADES.Macros.DanothsVisor.Check', type: 'advantage'};
}
async function skillD(actor, skillId) {
    return await skill(actor, skillId, 'danothsVisorD');
}
async function skillA(actor, skillId) {
    return await skill(actor, skillId, 'danothsVisorA');
}
async function skillE(actor, skillId) {
    return await skill(actor, skillId, 'danothsVisorE');
}
export let danothsVisorD = {
    name: 'Danoth\'s Visor (Dormant)',
    version: '0.12.42',
    skill: [
        {
            macro: skillD
        }
    ]
};
export let danothsVisorA = {
    name: 'Danoth\'s Visor (Awakened)',
    version: '0.12.42',
    skill: [
        {
            macro: skillA
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
                value: 1,
                per: 'dawn',
                max: 1
            },
            translate: 'CHRISPREMADES.Macros.DanothsVisor.XRay'
        }
    }
};
export let danothsVisorE = {
    name: 'Danoth\'s Visor (Exalted)',
    version: '0.12.42',
    skill: [
        {
            macro: skillE
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
                value: 1,
                per: 'dawn',
                max: 1
            }
        },
        antiMagicField: {
            name: 'Antimagic Field',
            compendium: 'personalSpell',
            uses: {
                value: 1,
                per: 'dawn',
                max: 1
            },
            preparation: 'atwill'
        }
    }
};
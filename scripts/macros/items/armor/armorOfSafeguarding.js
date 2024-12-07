export let armorOfSafeguardingP = {
    name: 'Armor of Safeguarding, Plate',
    version: '0.12.51',
    equipment: {
        beaconOfHope: {
            name: 'Beacon of Hope',
            compendium: 'spell',
            uses: {
                max: 1,
                recovery: [
                    {
                        period: 'dawn',
                        type: 'recoverAll'
                    }
                ],
                spent: 0
            },
            preparation: 'atwill',
            override: {
                system: {
                    properties: [
                        'vocal',
                        'somatic',
                        'material',
                        'mgc'
                    ]
                }
            }
        }
    }
};
export let armorOfSafeguardingC = {
    name: 'Armor of Safeguarding, Chain Mail',
    version: armorOfSafeguardingP.version,
    equipment: armorOfSafeguardingP.equipment
};
export let armorOfSafeguardingR = {
    name: 'Armor of Safeguarding, Ring Mail',
    version: armorOfSafeguardingP.version,
    equipment: armorOfSafeguardingP.equipment
};
export let armorOfSafeguardingS = {
    name: 'Armor of Safeguarding, Splint',
    version: armorOfSafeguardingP.version,
    equipment: armorOfSafeguardingP.equipment
};
import {automationUtils} from '../../../../../proxy.mjs';
async function jump({actor, document: item, data, macroClass: {source}}) {
    if (!actor.flags[source]?.raging) return;
    switch(data.jumpType) {
        case 'long-jump':
            data.formula += ` + ${automationUtils.getConfigValue(item, 'long') ?? 0}`;
            break;
        case 'standing-high-jump':
        case 'running-high-jump':
            data.formula += ` + ${automationUtils.getConfigValue(item, 'high') ?? 0}`;
            break;
    }
}
export const tigerTotem = {
    name: 'Totem Spirit: Tiger',
    version: '2.1.4',
    rules: '2014',
    called: [
        {
            pass: 'actorJump',
            macro: jump,
            priority: 300
        }
    ],
    config: {
        long: {
            default: 10,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.TotemSpiritTiger.Long'
        },
        high: {
            default: 3,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.TotemSpiritTiger.High'
        }
    }
};

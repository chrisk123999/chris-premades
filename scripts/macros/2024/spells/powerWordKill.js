import {itemUtils, workflowUtils} from '../../../utils.js';
async function damage({trigger: {entity: item}, workflow, ditem}) {
    if (!ditem.isHit) return;
    let maxHP = Number(itemUtils.getConfig(item, 'hp'));
    if (isNaN(maxHP)) maxHP = 100;
    if (ditem.oldHP > maxHP) return;
    workflowUtils.setDamageItemDamage(ditem, 10000);
    ditem.newHP = 0;
}
export let powerWordKill = {
    name: 'Power Word Kill',
    version: '1.1.34',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'applyDamage',
                macro: damage,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'hp',
            label: 'CHRISPREMADES.Config.HitPoints',
            type: 'text',
            default: 100,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
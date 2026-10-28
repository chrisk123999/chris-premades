import {automationUtils, workflowUtils} from '../../../proxy.mjs';
async function damage({document, ditem}) {
    if (!ditem.isHit || ditem.oldHP > automationUtils.getConfigValue(document, 'hp')) return;
    workflowUtils.setDamageItemDamage(ditem, 10000);
    ditem.newHP = 0;
}
export const powerWordKill = {
    name: 'Power Word Kill',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemDamageComplete',
            macro: damage,
            priority: 50
        }
    ],
    config: {
        hp: {
            default: 100,
            type: 'number',
            label: 'CHRISPREMADES.Config.HitPoints',
            category: 'homebrew',
            homebrew: true
        }
    }
};

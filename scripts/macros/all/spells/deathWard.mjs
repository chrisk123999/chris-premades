import {documentUtils, workflowUtils} from '../../../proxy.mjs';
async function ward({document: effect, ditem}) {
    if (ditem.totalDamage <= 0 || ditem.oldHP <= 0) return;
    if (ditem.oldHP + (ditem.oldTempHP ?? 0) - ditem.totalDamage > 0) return;
    await workflowUtils.preventZeroHP(ditem);
    await documentUtils.deleteDocument(effect);
}
export const deathWard = {
    name: 'Death Ward',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'targetDamageComplete', macro: ward, priority: 250}
    ]
};

import {effectUtils, workflowUtils} from '../../../../proxy.mjs';
async function damaged({document: effect, ditem}) {
    if (ditem.totalDamage <= 0) return;
    const prof = effectUtils.getOriginActivitySync(effect)?.actor?.system.attributes.prof;
    if (prof) workflowUtils.modifyDamageAppliedFlat(ditem, prof);
}
export const interdictBoonSoulsDoom = {
    name: 'Interdict Boons: Soul\'s Doom',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'targetDamageFlatReductions',
            macro: damaged,
            priority: 50
        }
    ]
};

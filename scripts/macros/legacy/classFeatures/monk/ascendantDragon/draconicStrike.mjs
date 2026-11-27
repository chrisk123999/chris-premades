import {dialogUtils, documentUtils, queryUtils} from '../../../../../proxy.mjs';
import {applyDamageType} from '../../../../generic/selectDamageType.mjs';
const damageTypes = ['acid', 'cold', 'fire', 'lightning', 'poison'];
async function damage({document: item, workflow}) {
    if (documentUtils.getIdentifier(workflow.item) !== 'unarmed-strike' || !workflow.hitTargets.count) return;
    const type = await dialogUtils.selectDamageType(damageTypes, item.name, 'CHRISPREMADES.Generic.SelectDamageType', {addNo: true, userId: queryUtils.firstOwner(workflow.actor, true)});
    if (type) await applyDamageType(workflow, type);
}
export const draconicStrike = {
    name: 'Draconic Strike',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'actorDamageRoll',
            macro: damage,
            priority: 50
        }
    ]
};

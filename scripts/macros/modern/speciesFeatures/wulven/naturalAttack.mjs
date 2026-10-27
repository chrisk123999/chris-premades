import {dialogUtils, documentUtils} from '../../../../proxy.mjs';
import {applyDamageType, rememberCombat} from '../../../generic/selectDamageType.mjs';
const damageTypes = ['bludgeoning', 'piercing', 'slashing'];
async function damageType({workflow}) {
    if (documentUtils.getIdentifier(workflow.item) !== 'unarmed-strike') return;
    const type = await dialogUtils.selectDamageType(damageTypes, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType', rememberCombat(workflow.token, workflow.item));
    if (type) await applyDamageType(workflow, type);
}
export const naturalAttackClaws = {
    name: 'Natural Attack (Claws)',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'actorDamageRoll',
            macro: damageType,
            priority: 50
        }
    ]
};

import {documentUtils, itemUtils} from '../../../proxy.mjs';
import {attackBonus, damageBonus, isUnarmed} from '../../legacy/equipment/unarmedItems.mjs';
function getBonus(item, workflow) {
    if (!itemUtils.getEquipmentState(item) || !isUnarmed(workflow)) return 0;
    return Number(documentUtils.getIdentifier(item).at(-1));
}
async function attack({document: item, workflow}) {
    const bonus = getBonus(item, workflow);
    if (bonus) await attackBonus(workflow, bonus);
}
async function damage({document: item, workflow}) {
    const bonus = getBonus(item, workflow);
    if (bonus) await damageBonus(workflow, bonus);
}
export const wrapsOfUnarmedPower = {
    name: 'Wraps of Unarmed Power',
    version: '2.1.8',
    rules: '2024',
    roll: [
        {
            pass: 'actorAttackRollBonuses',
            macro: attack,
            priority: 50
        },
        {
            pass: 'actorDamageRollComplete',
            macro: damage,
            priority: 50
        }
    ]
};

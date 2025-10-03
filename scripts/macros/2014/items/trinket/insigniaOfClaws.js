import {constants, genericUtils, itemUtils} from '../../../../utils.js';

async function early({trigger: {entity: item}, workflow}) {
    if (!itemUtils.getEquipmentState(item)) return;
    let isUnarmed = constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item));
    let isNatural = workflow.item.system.type?.value === 'natural';
    if (!isUnarmed && !isNatural) return;
    let existingBonus = workflow.item.system.magicalBonus ?? 0;
    if (workflow.item.type === 'weapon') {
        workflow.item = workflow.item.clone({'system.properties': Array.from(workflow.item.system.properties).concat('mgc'), 'system.magicalBonus': existingBonus + 1}, {keepId: true});
    } else {
        workflow.item = workflow.item.clone({'system.properties': Array.from(workflow.item.system.properties).concat('mgc')}, {keepId: true});
        let activity = workflow.item.system.activities.get(workflow.activity.id);
        if (activity.type === 'attack') {
            activity.attack.bonus += ' + 1';
            activity.damage.parts[0].bonus += ' + 1';
        }
    }
    workflow.item.prepareData();
    workflow.item.applyActiveEffects();
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
export let insigniaOfClaws = {
    name: 'Insignia of Claws',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};
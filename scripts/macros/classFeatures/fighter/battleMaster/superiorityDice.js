import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function hit({workflow}) {
    if (genericUtils.getIdentifier(workflow.item) === 'sweepingAttackAttack') return;
    // TODO: Martial Adept, Superior Technique
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'superiorityDice');
    if (!originItem || !originItem.system.uses.value) return;
    let superiorityDie = workflow.actor.system.scale?.['battle-master']?.['combat-superiority-die']?.die ?? 'd8';
    let triggerManeuvers = [
        'maneuversDisarmingAttack',
        'maneuversDistractingStrike',
        'maneuversGoadingAttack',
        'maneuversGrapplingStrike',
        'maneuversManeuveringAttack',
        'maneuversMenacingAttack',
        'maneuversPushingAttack',
        'maneuversSweepingAttack',
        'maneuversTripAttack'
    ];
    let validManeuvers = triggerManeuvers.map(i => itemUtils.getItemByIdentifier(workflow.actor, i)).filter(i => i);
    if (!validManeuvers.length) return;
    let selected = await dialogUtils.selectDocumentDialog(originItem.name, 'CHRISPREMADES.Macros.Maneuvers.SelectManeuver', validManeuvers, {addNoneDocument: true});
    if (!selected) return;
    let selectedIdentifier = genericUtils.getIdentifier(selected);
    let rollTotal;
    if (!['maneuversGrapplingStrike', 'maneuversSweepingAttack'].includes(selectedIdentifier)) {
        await workflowUtils.bonusDamage(workflow, superiorityDie, {damageType: workflow.defaultDamageType});
        rollTotal = workflow.damageRolls.at(-1).total;
    } else if (selectedIdentifier === 'maneuversSweepingAttack') {
        await genericUtils.update(selected, {'flags.chris-premades.sweepingAttack': {
            currAttackRoll: workflow.attackRoll.total,
            currDamageType: workflow.defaultDamageType,
            currRange: workflow.item.system.range.value ?? 5
        }});
    }
    await selected.use();
    await genericUtils.update(originItem, {'system.uses.value': originItem.system.uses.value - 1});
}
export let superiorityDice = {
    name: 'Superiority Dice',
    version: '0.12.44',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: hit,
                priority: 50
            }
        ]
    }
};
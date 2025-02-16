import {constants, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function hit({workflow}) {
    await superiorityHelper(workflow);
}
export async function determineSuperiorityDie(actor) {
    let superiorityDie = actor.system.scale?.['battle-master']?.['combat-superiority-die']?.die ?? 'd6';
    let isBattleMaster = superiorityDie !== 'd6';
    let allSameDice = !isBattleMaster || (isBattleMaster && actor.classes.fighter?.system.levels >= 10);
    let superiorityDiceItem = itemUtils.getItemByIdentifier(actor, 'superiorityDice');
    let martialAdept = itemUtils.getItemByIdentifier(actor,'martialAdept');
    let superiorTechnique = itemUtils.getItemByIdentifier(actor, 'fightingStyleSuperiorTechnique');
    let itemToUse;
    if (!allSameDice && superiorityDiceItem.system.uses.value && (martialAdept?.system.uses.value || superiorTechnique?.system.uses.value)) {
        let buttons = [
            [superiorityDiceItem.name + ': ' + superiorityDie + ' (' + superiorityDiceItem.system.uses.value + '/' + superiorityDiceItem.system.uses.max + ')', 'superiorityDice'],
        ];
        if (martialAdept?.system.uses.value) {
            buttons.push([martialAdept.name + ': d6 (' + martialAdept.system.uses.value + '/' + martialAdept.system.uses.max + ')', 'martialAdept']);
        }
        if (superiorTechnique?.system.uses.value) {
            buttons.push([superiorTechnique.name + ': d6 (' + superiorTechnique.system.uses.value + '/' + superiorTechnique.system.uses.max + ')', 'fightingStyleSuperiorTechnique']);
        }
        buttons.push(['DND5E.None', false]);
        itemToUse = itemUtils.getItemByIdentifier(actor, await dialogUtils.buttonDialog(superiorityDiceItem.name, 'CHRISPREMADES.Macros.Maneuvers.SelectDice', buttons));
        if (itemToUse !== superiorityDiceItem) superiorityDie = 'd6';
    } else {
        if (superiorityDiceItem?.system.uses.value) {
            itemToUse = superiorityDiceItem;
        } else if (martialAdept?.system.uses.value) {
            itemToUse = martialAdept;
        } else if (superiorTechnique?.system.uses.value) {
            itemToUse = superiorTechnique;
        }
    }
    return [itemToUse, superiorityDie];
}
export async function superiorityHelper(workflow) {
    if (!constants.weaponAttacks.includes(workflow.activity.actionType)) return;
    if (genericUtils.getIdentifier(workflow.item) === 'sweepingAttackAttack') return;
    let [itemToUse, superiorityDie] = await determineSuperiorityDie(workflow.actor);
    if (!itemToUse) return;
    let triggerManeuvers = [
        'maneuversDisarmingAttack',
        'maneuversDistractingStrike',
        'maneuversGoadingAttack',
        'maneuversGrapplingStrike',
        'maneuversManeuveringAttack',
        'maneuversMenacingAttack',
        'maneuversPushingAttack',
        'maneuversTripAttack'
    ];
    if (workflow.activity.actionType === 'mwak') triggerManeuvers.push('maneuversSweepingAttack');
    let validManeuvers = triggerManeuvers.map(i => itemUtils.getItemByIdentifier(workflow.actor, i)).filter(i => i);
    if (!validManeuvers.length) return;
    let selected = await dialogUtils.selectDocumentDialog(itemToUse.name, 'CHRISPREMADES.Macros.Maneuvers.SelectManeuver', validManeuvers, {addNoneDocument: true});
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
            currRange: workflow.item.system.range.value ?? workflow.item.system.range.reach ?? 5
        }});
    }
    let useSmall = genericUtils.getProperty(workflow.actor, 'flags.chris-premades.useSmallSuperiorityDie');
    if (!useSmall && superiorityDie === 'd6') await genericUtils.setFlag(workflow.actor, 'chris-premades', 'useSmallSuperiorityDie', true);
    await workflowUtils.completeItemUse(selected);
    if (!useSmall && superiorityDie === 'd6') await genericUtils.update(workflow.actor, {'flags.chris-premades.-=useSmallSuperiorityDie': null});
    await genericUtils.update(itemToUse, {'system.uses.spent': itemToUse.system.uses.spent + 1});
}
export let superiorityDice = {
    name: 'Superiority Dice',
    version: '1.1.0',
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
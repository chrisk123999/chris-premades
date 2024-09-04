import {actorUtils, combatUtils, constants, dialogUtils, genericUtils, itemUtils, rollUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function attack({trigger, workflow}) {
    if (!workflow.hitTargets.size || !workflow.item) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let target = workflow.targets.first();
    let nearbyShields = tokenUtils.findNearby(target, 60, 'ally').filter(i => {
        let item = itemUtils.getItemByIdentifier(i.actor, 'runicShield');
        if (!item) return;
        if (!item.system.uses.value) return;
        if (combatUtils.inCombat() && actorUtils.hasUsedReaction(i.actor)) return;
        return true;
    });
    if (!nearbyShields.length) return;
    for (let i of nearbyShields) {
        let item = itemUtils.getItemByIdentifier(i.actor, 'runicShield');
        let userId = socketUtils.firstOwner(i.document, true);
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.RunicShield.Use', {item: item.name, name: i.actor.name}), {userId: userId});
        if (!selection) continue;
        workflow.aborted = true;
        let itemData = genericUtils.duplicate(workflow.item.toObject());
        delete itemData._id;
        let formula = '1d20';
        for (let i = 1; i < workflow.attackRoll.terms.length; i++) {
            formula += workflow.attackRoll.terms[i].formula;
        }
        await workflowUtils.syntheticItemRoll(item, [target], {config: {consumeUsage: true}});
        genericUtils.setProperty(itemData, 'flags.chris-premades.setAttackRoll', {formula: formula});
        let macros = workflow.item.flags['chris-premades']?.macros?.midi?.item ?? [];
        macros.push('setAttackRoll');
        genericUtils.setProperty(itemData, 'flags.chris-premades.macros.midi.item', macros);
        await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [target]);
        break;
    }
}
export let runicShield = {
    name: 'Runic Shield',
    version: '0.12.52',
    midi: {
        actor: [
            {
                pass: 'sceneAttackRollComplete',
                macro: attack,
                priority: 149
            }
        ]
    }
};
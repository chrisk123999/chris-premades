import {combatUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token || !combatUtils.inCombat()) return;
    let combatant = game.combat.combatants.contents.find(combatant => combatant.actorId === workflow.actor.id);
    if (!combatant) return;
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let combatantData = {
        tokenId: workflow.token.document.id,
        sceneId: workflow.token.document.parent.id,
        actorId: workflow.actor.id,
        initiative: combatant.initiative
    };
    let updates = [];
    for (let i = 0; i < workflow.utilityRolls[0].total; i++) {
        combatantData.initiative -= 0.01;
        updates.push(genericUtils.duplicate(combatantData));
    }
    let combatants = await genericUtils.createEmbeddedDocuments(game.combat, 'Combatant', updates);
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    genericUtils.setProperty(effectData, 'flags.chris-premades.timeStop.combatantUuids', combatants.map(i => i.uuid));
    genericUtils.setProperty(effectData, 'flags.chris-premades.timeStop.tokenId', workflow.token.document.id);
    await effectUtils.createEffect(workflow.actor, effectData);
}
async function remove({trigger: {entity: effect}}) {
    if (!combatUtils.inCombat()) return;
    let combatantUuids = effect.flags['chris-premades']?.timeStop?.combatantUuids;
    if (!combatantUuids) return;
    let combatants = await Promise.all(combatantUuids.map(async uuid => await fromUuid(uuid)).filter(i => i));
    await genericUtils.deleteEmbeddedDocuments(game.combat, 'Combatant', combatants.map(i => i.id));
}
async function targetOther({trigger: {entity: effect}, workflow}) {
    if (!workflow.targets.size) return;
    if (!workflow.targets.filter(token => token != workflow.token).size) return;
    let selection = await dialogUtils.confirm(effect.name, 'CHRISPREMADES.Macros.TimeStop.Affect', {userId: socketUtils.gmID()});
    if (!selection) return;
    await genericUtils.remove(effect);
}
async function turnEnd({trigger: {entity: effect}}) {
    let tokenId = effect.flags['chris-premades']?.timeStop?.tokenId;
    if (game.combat.current.tokenId != tokenId) await genericUtils.remove(effect);
}
export let timeStop = {
    name: 'Time Stop',
    version: '1.3.44',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let timeStopEffect = {
    name: 'Time Stop: Effect',
    version: timeStop.version,
    rules: timeStop.rules,
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: targetOther,
                priority: 200
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: remove,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};
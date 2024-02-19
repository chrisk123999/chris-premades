import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.item.system.properties.has('mgc') && workflow.item.name !== 'Force-Empowered Rend') return;
    let effect = chris.findEffect(workflow.actor, 'Arcane Jolt');
    if (!effect) return;
    let originFeature = await fromUuid(effect.origin);
    if (!originFeature) return;
    let scale = workflow.actor.system?.scale?.['battle-smith']?.['arcane-jolt'].formula; 
    if (!scale) {
        scale = workflow.actor.flags['chris-premades']?.feature?.arcaneJoltScale;
        if (!scale) return;
    }
    if (chris.inCombat()) {
        let turnCheck = chris.perTurnCheck(originFeature, 'feature', 'arcaneJolt', false);
        if (!turnCheck) return;
    }
    let selection = await chris.dialog('Use Arcane Jolt?', [['Yes', true], ['No', false]]);
    if (!selection) return;
    if (selection === false) return;
    let selection2 = await chris.dialog('Harm or Heal?', [['Harm', 'harm'], ['Heal', 'heal']]);
    if (!selection2) return;
    if (selection2 === 'harm') {
        let queueSetup = await queue.setup(workflow.item.uuid, 'arcaneJolt', 250);
        if (!queueSetup) return;
        if (chris.inCombat()) await originFeature.setFlag('chris-premades', 'feature.arcaneJolt.turn', game.combat.round + '-' + game.combat.turn);
        let bonusDamageFormula = scale + '[force]';
        await chris.addToDamageRoll(workflow, bonusDamageFormula);
        await originFeature.use();
        queue.remove(workflow.item.uuid);
    }
    if (selection2 === 'heal') {
        let targetToken = workflow.targets.first();
        let nearbyTargets = chris.findNearby(targetToken, 30, 'enemy');
        if (nearbyTargets.length === 0) return;
        let queueSetup = await queue.setup(workflow.item.uuid, 'arcaneJolt', 450);
        if (!queueSetup) return;
        if (chris.inCombat()) await originFeature.setFlag('chris-premades', 'feature.arcaneJolt.turn', game.combat.round + '-' + game.combat.turn);
        let selected = await chris.selectTarget('Who to heal?', constants.yesNo, nearbyTargets, true, 'one');
        if (selected.buttons === false) {
            queue.remove(workflow.item.uuid);
            return;
        }
        let healTargetTokenUuid = selected.inputs.find(id => id != false);
        if (!healTargetTokenUuid) {
            queue.remove(workflow.item.uuid);
            return;
        }
        let healTargetToken = await fromUuid(healTargetTokenUuid);
        let damageDice = scale + '[healing]';
        let diceRoll = await new Roll(damageDice).roll({'async': true});
        await chris.applyWorkflowDamage(workflow.token, diceRoll, 'healing', [healTargetToken], workflow.item.name, workflow.itemCardId);
        await originFeature.use();
        queue.remove(workflow.item.uuid);
    }
}
async function updateUses({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.actor.type === 'character') {
        let effect = chris.findEffect(workflow.actor, 'Arcane Jolt');
        if (!effect) return;
        let originFeature = await fromUuid(effect.origin);
        if (!originFeature) return;
        let effect2 = chris.findEffect(workflow.actor, 'Steel Defender');
        if (!effect2) return;
        let spawnedTokenUuid = effect2.flags?.['chris-premades']?.feature?.steelDefender?.spawnedTokenUuid;
        if (!spawnedTokenUuid) return;
        let spawnedToken = await fromUuid(spawnedTokenUuid);
        if (!spawnedToken) return;
        let spawnedItem = spawnedToken.actor.items.getName('Arcane Jolt');
        if (!spawnedItem) return;
        await spawnedItem.update({'system.uses.value': originFeature.system?.uses?.value});
    }
    if (workflow.actor.type === 'npc') {
        let effect3 = chris.findEffect(workflow.actor, 'Summoned Creature');
        if (!effect3) return;
        let origin = await fromUuid(effect3.origin);
        if (!origin) return;
        let itemToUpdate = origin.actor.items.getName('Arcane Jolt');
        if (!itemToUpdate) return;
        let originItem = workflow.actor.items.getName('Arcane Jolt');
        if (!originItem) return;
        await itemToUpdate.update({'system.uses.value': originItem.system?.uses?.value});
    }
}
async function combatEnd(origin) {
    await origin.setFlag('chris-premades', 'feature.arcaneJolt.turn', '');
}
export let arcaneJolt = {
    'item': item,
    'updateUses': updateUses,
    'combatEnd': combatEnd,
}
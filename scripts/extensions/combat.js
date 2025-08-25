import {genericUtils, socketUtils, workflowUtils, tokenUtils, dialogUtils} from '../utils.js';
import {DialogApp} from '../applications/dialog.js';
import {socket, sockets} from '../lib/sockets.js';
function legendaryActionsTrack(actor, data, options, id) {
    // Track legendary action use
    if (options.action === 'update' && data?.system?.resources?.legact?.spent && game.combat && actor.token) {
        let currentCombat = game.combat.current;
        let flag = game.combat.flags['chris-premades']?.legendaryActionsUsed ?? [];
        // Filter out old turns
        flag = flag.filter(i => i.round === currentCombat.round && i.turn == currentCombat.turn);
        let updates = {id: actor.token?.id, round: currentCombat.round, turn: currentCombat.turn};
        flag.push(updates);
        genericUtils.setFlag(game.combat, 'chris-premades', 'legendaryActionsUsed', flag);
    }
}
function legendaryActionsPrompt(combat, data, options, id) {
    // Is this an attempt to move combat forward?
    if (options.direction === 1) {
        // Give a way to guarentee going through
        if (combat.flags['chris-premades']?.bypass) {
            genericUtils.setFlag(combat, 'chris-premades', 'bypass', false);
            return;
        }
        // Have we already prompted this turn?
        let lastPrompt = combat.flags['chris-premades']?.lastPrompt;
        let currentCombat = combat.current;
        if (lastPrompt?.round === currentCombat.round && lastPrompt?.turn === currentCombat.turn) return;
        // Are there any combatants with legendary actions?
        let legendaryActionsUsed = combat.flags['chris-premades']?.legendaryActionsUsed;
        let legendaryCombatants = combat.combatants?.filter(i => {
            return i.id != combat.current.combatantId && 
            i.defeated === false && 
            i.token.disposition != 0 &&
            i.actor?.system.resources?.legact?.value &&
            !legendaryActionsUsed?.find(j => j.id === i.tokenId && j.round === currentCombat.round && j.turn === currentCombat.turn);
        });
        if (legendaryCombatants?.length) {
            // Check if we have valid actions to even take
            let documents = legendaryCombatants.reduce((docs, combatant) => {
                let combatantItems = combatant.actor.identifiedItems;
                let filteredItems = [];
                combatantItems.forEach(i => i.forEach(j => {
                    if (j.system.activities.find(k => {
                        return (k?.consumption?.targets[0]?.target === 'resources.legact.value' || k?.activation.type === 'legendary') && 
                        combatant.actor?.system.resources?.legact?.value >= k.activation?.value;
                    })) filteredItems.push(j);
                }));
                docs.push(filteredItems);
                return docs;
            }, []);
            if (documents) {
                genericUtils.setFlag(combat, 'chris-premades', 'lastPrompt', {round: combat.current.round, turn: combat.current.turn});
                prompt(documents);
                return false;
            }
        }        
    }
}
async function prompt(documents) {
    // Pause game, prompt, execute
    game.togglePause();
    let isMultiple = documents.length > 1;
    let inputs = documents.map(i => [isMultiple ? 'checkbox' : 'button', i.map(j => ({
        label: j.name + ' - ' + j.labels.activation + (isMultiple ? ' - ' + j.actor.name : ''),
        name: j.id,
        options: {
            image: j.img
        }
    })), {displayAsRows: true, totalMax: 1}]);
    let result;
    let title = 'CHRISPREMADES.Combat.LegendaryActions.Prompt.Title';
    let content = genericUtils.translate('CHRISPREMADES.Combat.LegendaryActions.Prompt.Content');
    documents.forEach(i => content += '<br>' + i[0].actor.name + ' - ' + i[0].actor.system.resources.legact.value + '/' + i[0].actor.system.resources.legact.max);
    if (game.user.id != socketUtils.gmID()) {
        result = await socket.executeAsUser(sockets.dialog.name, socketUtils.gmID(), title, content, inputs, isMultiple ? 'okCancel' : 'cancel', {height: 'auto'});
    } else {
        result = await DialogApp.dialog(title, content, inputs, isMultiple ? 'okCancel' : 'cancel', {height: 'auto'});
    }
    if (result?.buttons) {
        let legendaryActionsIds;
        if (Object.keys(result).length > 1) {
            legendaryActionsIds = Object.entries(result).filter(([key, value]) => key != 'buttons' && value != false).map(([key, value]) => key);
        } else {
            legendaryActionsIds = result.buttons;
        }
        let legendaryActions = documents.flat().filter(i => legendaryActionsIds.includes(i.id));
        for (let i of legendaryActions) {
            let actionType = i.system.activities.find(j => (j.type)).type;
            let needsTarget = (['attack', 'save'].includes(actionType) || i.system.activities.find(j => j.target.affects?.count > 0)) && !i.system.activities.find(j => (j.target?.template?.count));
            let options = {};
            if (needsTarget) {
                let range = i.system?.range?.reach ?? i.system?.range?.value ?? undefined;
                let disposition = ['attack', 'save'].includes(actionType) ? 'enemy' : undefined;
                let nearbyTargets = tokenUtils.findNearby(i.actor.token, range, disposition);
                let target;
                if (nearbyTargets) {
                    if (nearbyTargets.length > 1) {
                        target = [(await dialogUtils.selectTargetDialog('CHRISPREMADES.Combat.LegendaryActions.Target.Title', genericUtils.translate('CHRISPREMADES.Combat.LegendaryActions.Target.Content') + i.name + ' - ' + i.actor.name, nearbyTargets, {userId: socketUtils.gmID()}))[0]];
                    } else target = nearbyTargets;
                }
                if (target) genericUtils.setProperty(options, 'targetUuids', target.map(i => i.document.uuid));
            }
            await workflowUtils.completeItemUse(i, {}, options);
        }
    }
    game.togglePause();
    await game.combat.nextTurn();
}
export let combat = {
    legendaryActionsTrack,
    legendaryActionsPrompt
};
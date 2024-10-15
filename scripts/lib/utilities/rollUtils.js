import {epicRolls} from '../../integrations/epicRolls.js';
import {socket, sockets} from '../sockets.js';
import {genericUtils} from './genericUtils.js';
import {socketUtils} from './socketUtils.js';
async function getCriticalFormula(formula, rollData) {
    return new CONFIG.Dice.DamageRoll(formula, rollData, {critical: true, powerfulCritical: game.settings.get('dnd5e', 'criticalDamageMaxDice'), multiplyNumeric: game.settings.get('dnd5e', 'criticalDamageModifiers')}).formula;
}
async function contestedRoll({sourceToken, targetToken, sourceRollType, targetRollType, sourceAbilities, targetAbilities, sourceRollOptions={}, targetRollOptions={}}) {
    // TODO: add some checks in here to error gracefully
    let bestSourceAbility = sourceAbilities[0];
    let bestTargetAbility = targetAbilities[0];
    let bestSourceScore = 0;
    let bestTargetScore = 0;
    for (let abil of sourceAbilities) {
        let currTotal;
        if (sourceRollType === 'skill') {
            currTotal = sourceToken.actor.system.skills[abil].total;
        } else if (sourceRollType === 'check') {
            currTotal = sourceToken.actor.system.abilities[abil].mod;
        } else if (sourceRollType === 'save') {
            currTotal = sourceToken.actor.system.abilities[abil].save;
        }
        if (currTotal > bestSourceScore) {
            bestSourceScore = currTotal;
            bestSourceAbility = abil;
        }
    }
    for (let abil of targetAbilities) {
        let currTotal;
        if (targetRollType === 'skill') {
            currTotal = targetToken.actor.system.skills[abil].total;
        } else if (targetRollType === 'check') {
            currTotal = targetToken.actor.system.abilities[abil].mod;
        } else if (targetRollType === 'save') {
            currTotal = targetToken.actor.system.abilities[abil].save;
        }
        if (currTotal > bestTargetScore) {
            bestTargetScore = currTotal;
            bestTargetAbility = abil;
        }
    }

    if (genericUtils.getCPRSetting('epicRolls') && game.modules.get('epic-rolls-5e')?.active) {
        let results = await epicRolls.contestedCheck(sourceToken.actor, targetToken.actor, sourceRollType + '.' + bestSourceAbility, targetRollType + '.' + bestTargetAbility);
        if (results.canceled) return 0;
        let sourceRoll = results.results[0].value;
        let targetRoll = results.results[1].value;
        return sourceRoll - targetRoll;
    } else {
        let contestedData = {
            source: {
                token: sourceToken,
                rollType: sourceRollType,
                ability: bestSourceAbility,
                rollOptions: sourceRollOptions
            },
            target: {
                token: targetToken,
                rollType: targetRollType,
                ability: bestTargetAbility,
                rollOptions: targetRollOptions
            }
        };
        return (await MidiQOL.contestedRoll(contestedData)).result;
    }
}
async function requestRoll(token, request, ability, options={}) {
    let userID = socketUtils.firstOwner(token, true);
    let data = {
        targetUuid: token.document.uuid,
        request: request,
        ability: ability,
        options
    };
    return await MidiQOL.socket().executeAsUser('rollAbility', userID, data);
}
async function getChangedDamageRoll(origRoll, newType) {
    let newRoll = await new CONFIG.Dice.DamageRoll(origRoll.terms.map(i => i.expression + (i.flavor?.length ? '[' + newType + ']' : '')).join(''), origRoll.data, genericUtils.mergeObject(origRoll.options, {type: newType})).evaluate();
    return newRoll;
}
async function rollDice(formula, {actor, chatMessage, flavor, mode = 'publicroll'} = {}) {
    let roll = await new Roll(formula, actor?.getRollData()).evaluate();
    if (chatMessage) {
        let message = await roll.toMessage({
            speaker: {alias: name},
            flavor: flavor,
        }, {
            rollMode: mode
        });
        return {message: message, roll: roll};
    }
    return roll;
}
async function damageRoll(formula, actor, options = {}) {
    return await new CONFIG.Dice.DamageRoll(formula, actor.getRollData(), options).evaluate();
}
async function addToRoll(roll, formula, {rollData} = {}) {
    let bonusRoll = await new Roll(formula, rollData).evaluate();
    return MidiQOL.addRollTo(roll, bonusRoll);
}
async function remoteRoll(roll, userId) {
    let rollJSON = roll.toJSON();
    let resultJSON = await socket.executeAsUser(sockets.remoteRoll.name, userId, rollJSON);
    return Roll.fromData(resultJSON);
}
async function remoteDamageRolls(rolls, userId) {
    let rollJSONs = rolls.map(i => i.toJSON());
    let resultJSONs = await socket.executeAsUser(sockets.remoteDamageRolls.name, userId, rollJSONs);
    return resultJSONs.map(i => CONFIG.Dice.DamageRoll.fromData(i));
}
export let rollUtils = {
    getCriticalFormula,
    contestedRoll,
    getChangedDamageRoll,
    requestRoll,
    rollDice,
    damageRoll,
    addToRoll,
    remoteRoll,
    remoteDamageRolls
};
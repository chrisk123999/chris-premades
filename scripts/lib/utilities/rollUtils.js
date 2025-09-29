import {epicRolls} from '../../integrations/epicRolls.js';
import {socket, sockets} from '../sockets.js';
import {genericUtils, socketUtils} from '../../utils.js';
async function getCriticalFormula(formula, rollData) {
    return new CONFIG.Dice.DamageRoll(formula, rollData, {isCritical: true}).formula;
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
        [request]: ability,
        options
    };
    return await MidiQOL.socket().executeAsUser('rollAbility', userID, data);
}
async function getChangedDamageRoll(origRoll, newType) {
    let newRoll = await new CONFIG.Dice.DamageRoll(origRoll.terms.map(i => i.expression + (i.flavor?.length ? '[' + newType + ']' : '')).join(''), origRoll.data, genericUtils.mergeObject(origRoll.options, {type: newType})).evaluate();
    return newRoll;
}
async function rollDice(formula, {entity, chatMessage, flavor, mode = 'publicroll'} = {}) {
    let roll = await new Roll(formula, entity?.getRollData()).evaluate();
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
function rollDiceSync(formula, {entity, options: {strict = false, maximize = false, minimize = false} = {}} = {}) {
    return new Roll(formula, entity?.getRollData()).evaluateSync({strict, maximize, minimize});
}
async function damageRoll(formula, entity, options = {}) {
    return await new CONFIG.Dice.DamageRoll(formula, entity.getRollData(), options).evaluate();
}
async function addToRoll(roll, formula, {rollData} = {}) {
    let bonusRoll = await new Roll(String(formula), rollData).evaluate();
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
function hasDuplicateDie(rolls) {
    function hasDuplicate(arr) {
        let seen = new Set();
        for (let num of arr) {
            if (seen.has(num)) {
                return true;
            }
            seen.add(num);
        }
        return false;
    }
    return hasDuplicate(rolls.flatMap(i => i.dice.flatMap(j => j.results.filter(k => k.active).flatMap(l => l.result))));
}
async function replaceD20(roll, number) {
    let rollData = genericUtils.duplicate(roll.toJSON());
    rollData.terms[0].results = rollData.terms[0].results.map(result => {
        result.result = number;
        return result;
    });
    rollData.total = (number - roll.terms[0].total) + roll.total;
    return Roll.fromData(rollData);
}
function makeCritical(roll) {
    let rollData = genericUtils.duplicate(roll.toJSON());
    rollData.options.criticalSuccess = 2;
    rollData.terms[0].options.criticalSuccess = 2;
    return Roll.fromData(rollData);
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
    remoteDamageRolls,
    hasDuplicateDie,
    replaceD20,
    rollDiceSync,
    makeCritical
};

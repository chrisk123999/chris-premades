import {epicRolls} from '../../integrations/epicRolls.js';
import {genericUtils} from './genericUtils.js';
import {socketUtils} from './socketUtils.js';

async function getCriticalFormula(formula) {
    return new CONFIG.Dice.DamageRoll(formula, {}, {critical: true, powerfulCritical: game.settings.get('dnd5e', 'criticalDamageMaxDice'), multiplyNumeric: game.settings.get('dnd5e', 'criticalDamageModifiers')}).formula;
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
        } else if (sourceRollType === 'abil') {
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
        } else if (targetRollType === 'abil') {
            currTotal = targetToken.actor.system.abilities[abil].mod;
        } else if (targetRollType === 'save') {
            currTotal = targetToken.actor.system.abilities[abil].save;
        }
        if (currTotal > bestTargetScore) {
            bestTargetScore = currTotal;
            bestTargetAbility = abil;
        }
    }

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
    return await MidiQOL.contestedRoll(contestedData);
}
async function contestedCheck(token, contestantToken, skill, contestedType) {
    if (genericUtils.getCPRSetting('epicRolls') && game.modules.get('epic-rolls-5e')?.active) {
        let results = await epicRolls.contestedCheck(token.actor, contestantToken.actor, 'skill.' + skill, 'skill.' + contestedType);
        if (results.canceled || !results.success) return false;
        return true;
    } else {
        let sourceRoll = await token.actor.rollSkill(skill);
        let targetRoll = await requestRoll(contestantToken, 'skill', contestedType);
        return sourceRoll.total > targetRoll.total;
    }
}
async function requestRoll(token, request, ability) {
    let userID = socketUtils.firstOwner(token, true);
    let data = {
        targetUuid: token.document.uuid,
        request: request,
        ability: ability
    };
    return await MidiQOL.socket().executeAsUser('rollAbility', userID, data);
}
async function getChangedDamageRoll(origRoll, newType) {
    let newRoll = await new CONFIG.Dice.DamageRoll(origRoll.terms.map(i => i.expression + (i.flavor?.length ? '[' + newType + ']' : '')).join(''), origRoll.data, genericUtils.mergeObject(origRoll.options, {type: newType})).evaluate();
    return newRoll;
}
export let rollUtils = {
    getCriticalFormula,
    contestedRoll,
    getChangedDamageRoll,
    contestedCheck,
    requestRoll
};
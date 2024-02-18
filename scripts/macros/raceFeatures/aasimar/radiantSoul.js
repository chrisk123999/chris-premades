import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let pass = args[0].macroPass;
    if (workflow.hitTargets.size === 0) return;
    if (!(pass === 'postDamageRoll' || pass === 'preDamageApplication')) return;
    let effect = chris.findEffect(workflow.actor, 'Celestial Revelation (Radiant Soul)');
    if (!effect) effect = chris.findEffect(workflow.actor, 'Celestial Revelation (Radiant Consumption)');
    if (!effect) return;
    let feature = await fromUuid(effect.origin);
    if (!feature) return;
    let useFeature = chris.perTurnCheck(feature, 'feature', 'aasimarRadiantSoul', true, workflow.token.id);
    if (!useFeature) return;
    switch (pass) {
        case 'postDamageRoll':
            if (workflow.hitTargets.size != 1) return;
            let queueSetup = await queue.setup(workflow.item.uuid, 'aasimarRadiantSoul', 249);
            if (!queueSetup) return;
            let selected = await chris.dialog(feature.name, constants.yesNo, 'Add extra damage from ' + feature.name + '?');
            if (!selected) {
                queue.remove(workflow.item.uuid);
                return;
            }
            await chris.setTurnCheck(feature, 'feature', 'aasimarRadiantSoul');
            let damageFormula = workflow.actor.system.attributes.prof + '[radiant]';
            await chris.addToDamageRoll(workflow, damageFormula);
            await feature.displayCard();
            queue.remove(workflow.item.uuid);
            return;
        case 'preDamageApplication':
            if (workflow.hitTargets.size <= 1) return;
            let queueSetup2 = queue.setup(workflow.item.uuid, 'aasimarRadiantSoul', 249);
            if (!queueSetup2) return;
            let selection = await chris.selectTarget('Celestial Revelation: Add extra damage?', constants.yesNoButton, workflow.targets, true, 'one');
            if (selection.buttons === false) {
                queue.remove(workflow.item.uuid);
                return;
            }
            await chris.setTurnCheck(feature, 'feature', 'aasimarRadiantSoul');
            let targetTokenUuid = selection.inputs.find(i => i);
            if (!targetTokenUuid) {
                queue.remove(workflow.item.uuid);
                return;
            }
            let targetToken = await fromUuid(targetTokenUuid);
            if (!targetToken) {
                queue.remove(workflow.item.uuid);
                return;
            }
            chris.addDamageDetailDamage(targetToken, workflow.actor.system.attributes.prof, 'radiant', workflow);
            await feature.displayCard();
            queue.remove(workflow.item.uuid);
            return;
    }
}
async function combatEnd(origin) {
    await chris.setTurnCheck(origin, 'feature', 'aasimarRadiantSoul', true);
}
export let aasimarRadiantSoul = {
    'attack': attack,
    'combatEnd': combatEnd
}
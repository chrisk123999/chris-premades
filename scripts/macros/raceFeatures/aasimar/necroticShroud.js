import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    let pass = args[0].macroPass;
    if (workflow.hitTargets.size === 0) return;
    if (!(pass === 'postDamageRoll' || pass === 'preDamageApplication')) return;
    let feature = chris.getItem(workflow.actor, 'Celestial Revelation (Necrotic Shroud)')
    if (!feature) return;
    let useFeature = chris.perTurnCheck(feature, 'feature', 'necroticShroud', true, workflow.token.id);
    if (!useFeature) return;
    switch (pass) {
        case 'postDamageRoll':
            if (workflow.hitTargets.size != 1) return;
            let queueSetup = await queue.setup(workflow.item.uuid, 'necroticShroud', 249);
            if (!queueSetup) return;
            let selected = await chris.dialog(feature.name, constants.yesNo, 'Add extra damage from ' + feature.name + '?');
            if (!selected) {
                queue.remove(workflow.item.uuid);
                return;
            }
            await chris.setTurnCheck(feature, 'feature', 'necroticShroud');
            let damageFormula = workflow.actor.system.attributes.prof + '[necrotic]';
            await chris.addToDamageRoll(workflow, damageFormula);
            queue.remove(workflow.item.uuid);
            return;
        case 'preDamageApplication':
            if (workflow.hitTargets.size <= 1) return;
            let queueSetup2 = queue.setup(workflow.item.uuid, 'necroticShroud', 249);
            if (!queueSetup2) return;
            let selection = await chris.selectTarget('Celestial Revelation: Add extra damage?', constants.yesNoButton, workflow.targets, true, 'one');
            if (selection.buttons === false) {
                queue.remove(workflow.item.uuid);
                return;
            }
            await chris.setTurnCheck(feature, 'feature', 'necroticShroud');
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
            chris.addDamageDetailDamage(targetToken, workflow.actor.system.attributes.prof, 'necrotic', workflow);
            await feature.displayCard();
            queue.remove(workflow.item.uuid);
            return;
    }
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.necroticShroud.attack,all',
                'priority': 20
            }
        ],
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        }
    };
    await chris.createEffect(workflow.actor, effectData);
}
async function turn(origin) {
    await chris.setTurnCheck(origin, 'feature', 'necroticShroud', true);
}
export let necroticShroud = {
    'attack': attack,
    'turn': turn,
    'item': item
}
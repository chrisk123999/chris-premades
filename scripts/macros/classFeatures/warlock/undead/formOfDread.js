import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let validTypes = ['msak', 'rsak', 'mwak', 'rwak'];
    if (!validTypes.includes(workflow.item.system.actionType)) return;
    let feature = workflow.actor.items.getName('Form of Dread: Fear');
    let feature2 = workflow.actor.items.getName('Form of Dread');
    if (!feature || !feature2) return;
    let useFeature = chris.perTurnCheck(feature2, 'feature', 'formOfDread', true, workflow.token.id);
    if (!useFeature) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'formOfDread', 450);
    if (!queueSetup) return;
    let selection = await chris.dialog('Attempt to fear target?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    if (chris.inCombat()) await feature2.setFlag('chris-premades', 'feature.formOfDread.turn', game.combat.round + '-' + game.combat.turn);
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
    queue.remove(workflow.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feature.formOfDread.turn', '');
}
export let formOfDread = {
    'attack': attack,
    'end': end
}
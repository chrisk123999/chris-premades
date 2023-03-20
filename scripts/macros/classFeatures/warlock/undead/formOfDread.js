import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function attack({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let validTypes = ['msak', 'rsak', 'mwak', 'rwak'];
    if (!validTypes.includes(this.item.system.actionType)) return;
    let feature = this.actor.items.getName('Form of Dread: Fear');
    let feature2 = this.actor.items.getName('Form of Dread');
    if (!feature || !feature2) return;
    let useFeature = chris.perTurnCheck(feature2, 'feature', 'formOfDread', true, this.token.id);
    if (!useFeature) return;
    let queueSetup = await queue.setup(this.item.uuid, 'formOfDread', 450);
    if (!queueSetup) return;
    let selection = await chris.dialog('Attempt to fear target?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(this.item.uuid);
        return;
    }
    if (chris.inCombat()) await feature2.setFlag('chris-premades', 'feature.formOfDread.turn', game.combat.round + '-' + game.combat.turn);
    let options = {
		'showFullCard': false,
		'createWorkflow': true,
		'targetUuids': [this.targets.first().document.uuid],
		'configureDialog': false,
		'versatile': false,
		'consumeResource': false,
		'consumeSlot': false,
	};
    await MidiQOL.completeItemUse(feature, {}, options);
    queue.remove(this.item.uuid);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feature.formOfDread.turn', '');
}
export let formOfDread = {
    'attack': attack,
    'end': end
}
import {chris} from '../../../../helperFunctions.js';
async function attack(workflow) {
    if (workflow.hitTargets.size != 1) return;
    let validTypes = ['msak', 'rsak', 'mwak', 'rwak'];
    if (!validTypes.includes(workflow.item.system.actionType)) return;
    let feature = workflow.actor.items.getName('Form of Dread: Fear');
    let feature2 = workflow.actor.items.getName('Form of Dread');
    if (!feature || !feature2) return;
    let currentTurn = '';
    let doCheck = false;
    if (game.combat === null || game.combat === undefined) {
        doCheck = true;
    } else {
        if (workflow.token.id != game.combat.current.tokenId) return;
        currentTurn = game.combat.round + '-' + game.combat.turn;
        let previousTurn = feature2.flags['chris-premades']?.feature?.fod?.turn;
        if (!previousTurn || previousTurn != currentTurn) doCheck = true;
    }
    if (!doCheck) return;
    let selection = await chris.dialog('Attempt to fear target?', [['Yes', true], ['No', false]]);
    if (!selection) return;
    await feature2.setFlag('chris-premades', 'feature.fod.turn', currentTurn);
    let options = {
		'showFullCard': false,
		'createWorkflow': true,
		'targetUuids': [workflow.targets.first().document.uuid],
		'configureDialog': false,
		'versatile': false,
		'consumeResource': false,
		'consumeSlot': false,
	};
    await MidiQOL.completeItemUse(feature, {}, options);
}
async function end(origin) {
    await origin.setFlag('chris-premades', 'feature.fod.turn', '');
}
export let formOfDread = {
    'attack': attack,
    'end': end
}
import {chris} from '../../../helperFunctions.js';
export async function sufferingEchoes(workflow) {
    if (workflow.failedSaves.size === 0) {
        new Sequence().effect().atLocation(workflow.token).stretchTo(workflow.targets.first()).file('jb2a.eldritch_blast.purple.30ft').play();
        return;
    }
    let nearbyTargets = chris.findNearby(workflow.targets.first(), 30, 'ally');
    if (nearbyTargets.length === 0) return;
    let buttons = [
        {
            'label': 'OK',
            'value': true
        }, {
            'label': 'Cancel',
            'value': false
        }
    ];
    if (nearbyTargets.length > 3) {
        let selection = await chris.selectTarget('What additional targets? Max: 3', buttons, nearbyTargets, true, true);
        if (!selection.buttons) return;
		nearbyTargets = [];
        for (let i of selection.inputs) {
			if (i) nearbyTargets.push(await fromUuid(i));
		}
        if (nearbyTargets.length > 3) {
			ui.notifications.info('Too many targets selected!');
			return;
		}
    }
    let damageRoll = await new Roll('3d8[psychic]').roll({async: true});
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: workflow.item.name
    });
    await chris.applyDamage(nearbyTargets, damageRoll.total, 'psychic');
    new Sequence().effect().atLocation(workflow.token).stretchTo(workflow.targets.first()).file('jb2a.eldritch_blast.purple.30ft').play();
    await warpgate.wait(1000);
    for (let i of nearbyTargets) {
        new Sequence().effect().atLocation(workflow.targets.first()).stretchTo(i).file('jb2a.eldritch_blast.purple.30ft').play();
    }
}
import {chris} from '../../../helperFunctions.js';
export async function sufferingEchoes({speaker, actor, token, character, item, args}) {
    if (this.failedSaves.size === 0) {
        new Sequence().effect().atLocation(this.token).stretchTo(this.targets.first()).file('jb2a.eldritch_blast.purple.30ft').play();
        return;
    }
    let nearbyTargets = chris.findNearby(this.targets.first(), 30, 'ally');
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
        let selection = await chris.selectTarget('What additional targets? Max: 3', buttons, nearbyTargets, true, 'multiple');
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
        flavor: this.item.name
    });
    await chris.applyDamage(nearbyTargets, damageRoll.total, 'psychic');
    new Sequence().effect().atLocation(this.token).stretchTo(this.targets.first()).file('jb2a.eldritch_blast.purple.30ft').play();
    await warpgate.wait(1000);
    for (let i of nearbyTargets) {
        new Sequence().effect().atLocation(this.targets.first()).stretchTo(i).file('jb2a.eldritch_blast.purple.30ft').play();
    }
}
import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function chainLightning({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let maxTargets = this.castData.castLevel - 3;
    let targetToken = this.targets.first();
    let nearbyTokens = chris.findNearby(targetToken, 30, 'ally');
    if (nearbyTokens.length === 0) return;
    let queueSetup = await queue.setup(this.item.uuid, 'chainLightning', 450);
    if (!queueSetup) return;
    let addedTargets = [];
    let addedTargetUuids = [];
    if (nearbyTokens.length > maxTargets) {
        let buttons = [
            {
                'label': 'OK',
                'value': true
            }, {
                'label': 'Cancel',
                'value': false
            }
        ];
        let selection = await chris.selectTarget('Where should the lightning bounce? Max: ' + maxTargets, buttons, nearbyTokens, true, 'multiple');
        if (!selection.buttons) {
            queue.remove(this.item.uuid);
            return;
        }
        for (let i of selection.inputs) {
            if (i) {
                addedTargets.push(await fromUuid(i));
                addedTargetUuids.push(i);
            }
        }
        if (addedTargets.length > maxTargets) {
            ui.notifications.info('Too many targets selected!');
            queue.remove(this.item.uuid);
            return;
        }
    } else {
        for (let i of nearbyTokens) {
            addedTargets.push(i);
            addedTargetUuids.push(i.document.uuid);
        }
    }
    new Sequence().effect().atLocation(this.token).stretchTo(targetToken).file('jb2a.chain_lightning.secondary.blue').play();
    let previousToken = targetToken;
    for (let i of addedTargets) {
        new Sequence().effect().atLocation(previousToken).stretchTo(i).file('jb2a.chain_lightning.secondary.blue').play();
        previousToken = i;
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Chain Lightning Leap', false);
    if (!featureData) {
        queue.remove(this.item.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Chain Lightning Leap');
    featureData.system.save.dc = chris.getSpellDC(this.item);
    featureData.system.damage.parts = [
        [
            this.damageTotal + '[lightning]',
            'lightning'
        ]
    ];
    featureData.flags['chris-premades'] = {
		'spell': {
			'castData': this.castData
		}
	}
	featureData.flags['chris-premades'].spell.castData.school = this.item.system.school;
    let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
    let options = {
		'showFullCard': false,
		'createWorkflow': true,
		'targetUuids': addedTargetUuids,
		'configureDialog': false,
		'versatile': false,
		'consumeResource': false,
		'consumeSlot': false
	};
    await MidiQOL.completeItemUse(feature, {}, options);
    queue.remove(this.item.uuid);
}
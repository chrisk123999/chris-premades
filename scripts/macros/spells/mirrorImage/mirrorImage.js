import {chris} from '../../../helperFunctions.js';
export async function mirrorImage(workflow) {
    if (workflow.targets.size != 1) return;
    if (workflow.isFumble === true) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let targetEffect = chris.findEffect(targetActor, 'Mirror Image');
    if (!targetEffect) return;
    let duplicates = targetActor.flags['chris-premades']?.spell?.mirrorImage;
    if (!duplicates) return;
    let roll = await new Roll('1d20').roll({async: true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: 'Mirror Image'
    });
    let rollTotal = roll.total;
    let rollNeeded;
    switch (duplicates) {
        case 3:
            rollNeeded = 6;
            break;
        case 2:
            rollNeeded = 8;
            break;
        case 1:
            rollNeeded = 11;
            break;
    }
    if (rollTotal < rollNeeded) return;
    workflow.isFumble = true;
    let duplicateAC = 10 + targetActor.system.abilities.dex.mod;
    if (workflow.attackTotal >= duplicateAC) {
        ChatMessage.create({
            speaker: {alias: name},
            content: 'Attack hit a duplicate and destroyed it.'
        });
        if (duplicates === 1) {
            await chris.removeEffect(targetEffect);
        } else {
            let updates = {
                'changes': [
			        {
				        'key': 'macro.tokenMagic',
				        'mode': 0,
				        'value': 'images',
				        'priority': 20
			        },
			        {
				        'key': 'flags.chris-premades.spell.mirrorImage',
				        'mode': 5,
				        'value': duplicates - 1,
				        'priority': 20
			        }
		        ]
            };
            await chris.updateEffect(targetEffect, updates);
        }
    } else {
        ChatMessage.create({
            speaker: {alias: name},
            content: 'Attack targeted a duplicate and missed.'
        });
    }
}
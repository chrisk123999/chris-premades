import {chris} from '../../../helperFunctions.js';
export async function radiantMace({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let nearbyTargets = chris.findNearby(workflow.targets.first(), 10, 'enemy');
    if (nearbyTargets.length === 0) return;
    let targetToken;
    if (nearbyTargets.length === 1) targetToken = nearbyTargets[0];
    if (!targetToken) {
        let buttons = [
            {
                'label': 'Ok',
                'value': true
            }, {
                'label': 'Cancel',
                'value': false
            }
        ];
        let selection = await chris.selectTarget('Who gets temporary hit points?', buttons, nearbyTargets, true, 'one');
        if (selection.buttons === false) return;
        let targetTokenID = selection.inputs.find(id => id != false);
        if (!targetTokenID) return;
        targetToken = await fromUuid(targetTokenID);
    }
    let roll = await new Roll('1d10[temphp]').roll({async: true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: workflow.item.name
    });
    await chris.applyDamage([targetToken], roll.total, 'temphp');
}
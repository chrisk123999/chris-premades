import {chris} from '../../../helperFunctions.js';
export async function stench(token, origin, range, duration) {
    let targetTokens = chris.findNearby(token, range);
    if (targetTokens.length === 0) return;
    let targetToken =  targetTokens.find(i => i.id === game.combat.current.tokenId);
    if (!targetToken) return;
    let sourceActor = game.actors.get(token.document.actorId);
    if (!sourceActor) return;
    let monsterName = sourceActor.name.toLowerCase();
    if (targetToken.actor.flags['chris-premades']?.monster?.[monsterName]?.feature?.stenchImmune) return;
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetToken.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    let featureWorkflow = await MidiQOL.completeItemUse(origin, {}, options);
    if (featureWorkflow.failedSaves.size != 0) return;
    let effectData = {
        'label': origin.name + ' Immune',
        'icon': origin.img,
        'origin': origin.uuid,
        'duration': {
            'seconds': duration
        },
        'changes': [
            {
                'key': 'flags.chris-premades.monster.' + monsterName + '.feature.stenchImmune',
                'mode': 5,
                'value': true,
                'priority': 20
            }
        ]
    }
    await chris.createEffect(targetToken.actor, effectData);
}
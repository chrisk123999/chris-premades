import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
export async function auraOfAnnihilation(token, origin) {
    if (token.actor.system.attributes.hp.value === 0) return;
    if (!game.combat.previous.tokenId) return;
    let targetToken = game.canvas.tokens.get(game.combat.previous.tokenId);
    if (!targetToken) return;
    if (targetToken.id === token.id) return;
    let type = chris.raceOrType(targetToken.actor);
    if (type === 'fiend' || type === 'undead') return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > 30) return;
    let featureData = duplicate(origin.toObject());
    featureData.system.activation.type = 'special';
    featureData.system.target.type = 'creature';
    featureData.system.damage.parts = [
        [
            '5[necrotic]',
            'necrotic'
        ]
    ];
    delete(featureData.effects);
    featureData.system.duration = {
        'units': 'inst',
        'value': ''
    };
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': token.actor});
    let options = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await MidiQOL.completeItemUse(feature, {}, options);
}
import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {translate} from '../../translations.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let maxStars = Math.floor(workflow.castData.castLevel / 2);
    let dimLight = (maxStars * 5);
    console.log(dimLight);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Stellar Body - Attack', false);
    if (!featureData) return;
    console.log("got feature");
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Stellar Body - Attack');
    async function effectMacro () {
        await warpgate.revert(token.document, 'Stellar Bodies');
        Sequencer.EffectManager.endEffects({'name': 'Stellar Bodies', 'object': token});
    }
    let effectData = {
        'name': 'Stellar Bodies',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60
        },
        'changes': [
            {
                'key': 'ATL.light.dim',
                'value': (maxStars * 5),
                'mode': 5,
                'priority': 20
            },
            {
                'key': 'ATL.light.color',
                'value': '#ffffff',
                'mode': 5,
                'priority': 20
            },
            {
                'key': 'ATL.light.alpha',
                'value': '0.25',
                'mode': 5,
                'priority': 20
            },
            {
                'key': 'ATL.light.animation',
                'value': '{\'type\': \'starlight\', \'speed\': 1,\'intensity\': 3}',
                'mode': 5,
                'priority': 20
            },
            {
                "key": "flags.chris-premades.feature.onHit.stellarBodies",
                "value": "true",
                "mode": 5,
                "priority": 20
            }
        ],
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'spell': {
                    'stellarBodies': {
                        'stars': maxStars
                    }
                },
                'vae': {
                    'button': featureData.name
                }
            }
        }
    };

    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Stellar Bodies',
        'description': effectData.name
    };

    await warpgate.mutate(workflow.token.document, updates, {}, options);

    if (chris.jb2aCheck() != 'patreon'){
        new Sequence()

        .effect()
        .attachTo(token)
        .name('Stellar Bodies')
        .file('jb2a.markers.circle_of_stars.blue')
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(1)
        .fadeIn(1500)
        .fadeOut(500)
        .zIndex(1)
        .persist(false)

        .waitUntilFinished(-1000)
        .play();
    }
    else {
        new Sequence()

        .effect()
        .attachTo(token)
        .name('Stellar Bodies')
        .file('jb2a.markers.circle_of_stars.blue')
        .scaleToObject(1.5 * token.document.texture.scaleX)
        .opacity(1)
        .fadeIn(1500)
        .fadeOut(500)
        .zIndex(1)
        .persist(false)

        .effect()
        .attachTo(token)
        .name('Stellar Bodies')
        .file('jb2a.token_border.circle.spinning.blue.013')
        .scaleToObject(2 * token.document.texture.scaleX)
        .opacity(1)
        .fadeIn(1500)
        .fadeOut(500)
        .zIndex(1)
        .persist()

        .waitUntilFinished(-1000)
        .play();
    }
}
async function update(workflow, targetToken) {
    let effect = chris.findEffect(workflow.token.actor, 'Stellar Bodies');
    if (!effect) return;
    let newStars = (effect.flags['chris-premades']?.spell?.stellarBodies.stars - 1);
    console.log(newStars);
    if (newStars == 0) {
        await warpgate.revert(workflow.token.document, 'Stellar Bodies');
        Sequencer.EffectManager.endEffects({'name': 'Stellar Bodies', 'object': token});
        return;
    }

    let updates = {
        'flags': {
            'chris-premades': {
                'spell': {
                    'stellarBodies': {
                        'stars': newStars
                    }
                },
            }
        }
    }
    await chris.updateEffect(effect, updates);
    //update to light effect?
}

async function onHit(workflow, targetToken) {
    if (workflow.hitTargets.size != 1) return;
    if (!constants.meleeAttacks.includes(workflow.item?.system?.actionType)) return;
    let effect = chris.findEffect(targetToken.actor, 'Stellar Bodies');
    console.log(effect);
    if (!effect) return;

    let stars = effect.flags['chris-premades']?.spell?.stellarBodies.stars;
    let damage = `${stars}d8`;
    console.log(damage);
    let queueSetup = await queue.setup(workflow.uuid, 'stellarBodies', 50);
    if (!queueSetup) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Stellar Bodies - Protect');
    console.log(featureData);
    if (!featureData) {
        queue.remove(workflow.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Stellar Bodies - Protect');
    delete featureData._id;
    featureData.system.damage.parts[0][0] = damage + '[' + translate.damageType('radiant') + ']';
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': targetToken.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.token.document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    queue.remove(workflow.uuid);
}
export let stellarBodies = {
    'onHit': onHit,
    'update': update,
    'item': item
};
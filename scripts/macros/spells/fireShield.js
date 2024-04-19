import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    let queueSetup = queue.setup(workflow.item.uuid, 'fireShield', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog(workflow.item.name, [['Warm Shield', 'fire'], ['Cold Shield', 'cold']], 'What kind of shield?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Fire Shield - Dismiss', false);
    if (!featureData) {
        queue.remove(workflow.item.uuid);
        return;
    }
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Fire Shield - Dismiss');
    async function effectMacro() {
        await chrisPremades.macros.fireShield.end(token, origin);
    }
    let resistance = {
        'fire': 'cold',
        'cold': 'fire'
    };
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 600
        },
        'changes': [
            {
                'key': 'system.traits.dr.value',
                'mode': 0,
                'value': resistance[selection],
                'priority': 20
            },
            {
                'key': 'flags.chris-premades.feature.onHit.fireShield',
                'mode': 5,
                'value': true,
                'priority': 20
            },
            {
                'key': 'ATL.light.dim',
                'mode': 4,
                'value': '20',
                'priority': 20
            },
            {
                'key': 'ATL.light.bright',
                'mode': 4,
                'value': '10',
                'priority': 20
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
                    'fireShield': selection
                },
                'vae': {
                    'button': featureData.name
                }
            },
            'autoanimations': {
                'isEnabled': false,
                'version': 5
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
        'name': 'Fire Shield',
        'description': 'Fire Shield'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    queue.remove(workflow.item.uuid);
    let useAnimation = chris.getConfiguration(workflow.item, 'animation') ?? chris.jb2aCheck() === 'patreon';
    if (!useAnimation) return;
    await animation(workflow.token, selection, 'Fire Shield');
}
async function animation(token, selection, name) {
    let colors = {
        'fire': 'orange',
        'cold': 'blue'
    };
    let altColors = {
        'fire': 'yellow',
        'cold': 'blue'
    };
    //Animations by: eskiemoh
    new Sequence()
        .effect()
        .file('jb2a.impact.ground_crack.' + colors[selection] + '.01')
        .atLocation(token)
        .belowTokens()
        .scaleToObject(3)

        .effect()
        .file('jb2a.particles.outward.' + colors[selection] + '.01.03')
        .atLocation(token)
        .delay(200)
        .scaleIn(0.5, 250)
        .fadeOut(3000)
        .duration(15000)
        .scaleToObject(2.75)
        .playbackRate(1)
        .zIndex(2)

        .effect()
        .file('jb2a.energy_strands.in.' + altColors[selection] + '.01.2')
        .atLocation(token)
        .delay(200)
        .scaleIn(0.5, 250)
        .duration(2000)
        .belowTokens()
        .scaleToObject(2.75)
        .playbackRate(1)
        .zIndex(1)

        .effect()
        .file('jb2a.token_border.circle.spinning.' + colors[selection] + '.004')
        .atLocation(token)
        .scaleToObject(2.2)
        .playbackRate(1)
        .attachTo(token)
        .persist()
        .name(name)

        .effect()
        .file('jb2a.shield_themed.below.fire.03.' + colors[selection])
        .atLocation(token)
        .delay(1000)
        .persist()
        .fadeIn(500)
        .attachTo(token)
        .fadeOut(200)
        .belowTokens()
        .scaleToObject(1.7)
        .playbackRate(1)
        .name(name)

        .effect()
        .file('jb2a.shield_themed.above.fire.03.' + colors[selection])
        .atLocation(token)
        .persist()
        .fadeIn(3500)
        .attachTo(token)
        .fadeOut(200)
        .scaleToObject(1.7)
        .zIndex(0)
        .playbackRate(1)
        .name(name)

        .play();
}
async function end(token, origin) {
    await warpgate.revert(token.document, 'Fire Shield');
    let animation = chris.getConfiguration(origin, 'animation') ?? chris.jb2aCheck() === 'patreon';
    if (!animation) return;
    await Sequencer.EffectManager.endEffects({'name': 'Fire Shield', 'object': token});
}
async function stop({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.getEffects(workflow.actor).find(i => i.flags['chris-premades']?.spell?.fireShield);
    if (!effect) return;
    await chris.removeEffect(effect);
}
async function onHit(workflow, targetToken) {
    if (!workflow.hitTargets.size) return;
    let distance = chris.getDistance(workflow.token, targetToken);
    if (distance > 5) return;
    if (!constants.meleeAttacks.includes(workflow.item.system.actionType)) return;
    let effect = chris.getEffects(targetToken.actor).find(i => i.flags['chris-premades']?.spell?.fireShield);
    if (!effect) return;
    let type = effect.flags['chris-premades'].spell.fireShield;
    let featureNames = {
        'cold': 'Chill Shield',
        'fire': 'Warm Shield'
    };
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', featureNames[type], false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', featureNames[type]);
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': targetToken.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.token.document.uuid]);
    let queueSetup = await queue.setup(workflow.item.uuid, 'fireShield', 50);
    if (!queueSetup) return;
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    queue.remove(workflow.item.uuid);
}
export let fireShield = {
    'item': item,
    'end': end,
    'stop': stop,
    'onHit': onHit,
    'animation': animation
};
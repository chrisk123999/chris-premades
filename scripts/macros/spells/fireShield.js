import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token) return;
    let selection = await chris.dialog(workflow.item.name, [['Warm Shield', 'fire'], ['Cold Shield', 'cold']], 'What kind of shield?');
    if (!selection) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Fire Shield - Dismiss', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Fire Shield - Dismiss');
    async function effectMacro() {
        await chrisPremades.macros.fireShield.end(token, origin);
    }
    let resistance = {
        'fire': 'cold',
        'cold': 'fire'
    };
    let effectData = {
        'label': workflow.item.name,
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
            }
        }
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Fire Shield',
        'description': 'Fire Shield'
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    let animation = chris.getConfiguration(workflow.item, 'animation') ?? chris.jb2aCheck() === 'patreon';
    if (!animation) return;
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
        .atLocation(workflow.token)
        .belowTokens()
        .scaleToObject(3)

        .effect()
        .file('jb2a.particles.outward.' + colors[selection] + '.01.03')
        .atLocation(workflow.token)
        .delay(200)
        .scaleIn(0.5, 250)
        .fadeOut(3000)
        .duration(15000)
        .scaleToObject(2.75)
        .playbackRate(1)
        .zIndex(2)

        .effect()
        .file('jb2a.energy_strands.in.' + altColors[selection] + '.01.2')
        .atLocation(workflow.token)
        .delay(200)
        .scaleIn(0.5, 250)
        .duration(2000)
        .belowTokens()
        .scaleToObject(2.75)
        .playbackRate(1)
        .zIndex(1)

        .effect()
        .file('jb2a.token_border.circle.spinning.' + colors[selection] + '.004')
        .atLocation(workflow.token)
        .scaleToObject(2.2)
        .playbackRate(1)
        .attachTo(workflow.token)
        .persist()
        .name('Fire Shield')

        .effect()
        .file('jb2a.shield_themed.below.fire.03.' + colors[selection])
        .atLocation(workflow.token)
        .delay(1000)
        .persist()
        .fadeIn(500)
        .attachTo(workflow.token)
        .fadeOut(200)
        .belowTokens()
        .scaleToObject(1.7)
        .playbackRate(1)
        .name('Fire Shield')

        .effect()
        .file('jb2a.shield_themed.above.fire.03.' + colors[selection])
        .atLocation(workflow.token)
        .persist()
        .fadeIn(3500)
        .attachTo(workflow.token)
        .fadeOut(200)
        .scaleToObject(1.7)
        .zIndex(0)
        .playbackRate(1)
        .name('Fire Shield')

        .play();
}
async function end(token, origin) {
    await warpgate.revert(token.document, 'Fire Shield');
    let animation = chris.getConfiguration(origin, 'animation') ?? chris.jb2aCheck() === 'patreon';
    if (!animation) return;
    await Sequencer.EffectManager.endEffects({'name': 'Fire Shield', 'object': token});
}
async function stop({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = workflow.actor.effects.find(i => i.flags['chris-premades']?.spell?.fireShield);
    if (!effect) return;
    await chris.removeEffect(effect);
}
async function onHit(workflow, targetToken) {
    if (!workflow.hitTargets.size) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let effect = targetToken.actor.effects.find(i => i.flags['chris-premades']?.spell?.fireShield);
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
    'onHit': onHit
}
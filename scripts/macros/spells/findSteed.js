import {summons} from '../../utility/summons.js';
import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let folder = chris.getConfiguration(workflow.item, 'folder') ?? 'Steeds';
    if (folder === '') folder = 'Steeds';
    let actors = game.actors.filter(i => i.folder?.name === folder);
    if (actors.length < 1) {
        ui.notifications.warn('No actors found in steeds folder! (Default named "Steeds")');
        return;
    }
    let sourceActor = await chris.selectDocument('Choose Steed', actors);
    if (!sourceActor) return;
    let creatureType = await chris.dialog('What creature type?', [['Celestial', 'celestial'], ['Fey', 'fey'], ['Fiend', 'fiend']]);
    if (!creatureType) return;
    let languageOptions = (Array.from(workflow.actor.system.traits.languages.value).map(i => [i.charAt(0).toUpperCase() + i.slice(1), i]));
    if (!languageOptions) return;
    let languageSelected = new Set(await chris.dialog('What language?', languageOptions));
    if (!languageSelected) return;
    let sourceActorIntelligence = sourceActor[0].system.abilities.int.value;
    if (sourceActorIntelligence < 6) sourceActorIntelligence = 6;
    let name = await chris.getConfiguration(workflow.item, 'name') ?? sourceActor[0].name + ' Steed';
    let updates = {
        'actor': {
            'name': name,
            'system': {
                'abilities': {
                    'int': {
                        'value': sourceActorIntelligence
                    }
                },
                'details': {
                    'type': {
                        'value': creatureType
                    }
                },
                'traits': {
                    'languages': languageSelected
                }
            },
            'prototypeToken': {
                'name': name
            }
        },
        'token': {
            'name': name,
            'disposition': workflow.token.document.disposition
        }
    };
    let updates2 = {
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'priority': 20,
                'value': 'function.chrisPremades.macros.findSteed.onUse,preambleComplete'
            }
        ],
        'flags': {
            'chris-premades': {
                'spell': {
                    'findSteed': true
                }
            }
        }
    };
    await summons.spawn(sourceActor, updates, 86400, workflow.item);
    let effect = chris.findEffect(workflow.actor, workflow.item.name);
    await chris.updateEffect(effect, updates2);
}
async function onUse({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.type != 'spell') return;
    if (workflow.targets.size != 1) return;
    if (workflow.targets.first().id != workflow.token.id) return;
    let effect = Array.from(workflow.actor.effects).find((e) => e.flags['chris-premades']?.spell?.findSteed === true);
    if (!effect) return;
    let steedId = effect.flags['chris-premades']?.summons?.ids[effect.name][0];
    if (!steedId) return;
    let steedToken = canvas.scene.tokens.get(steedId).object;
    if (!steedToken) return;
    if (chris.getDistance(workflow.token, steedToken) > 5) return;
    if (await chris.dialog('Find Steed', [['Yes', false], ['No', true]], 'Target Steed as well? (If mounted)')) return;
    let newTargets = [workflow.token.id, steedId];
    chris.updateTargets(newTargets);
}
export let findSteed = {
    'item': item,
    'onUse': onUse
}
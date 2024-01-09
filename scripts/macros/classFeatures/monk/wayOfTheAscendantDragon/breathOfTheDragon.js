import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function breathOfTheDragon({speaker, actor, token, character, item, args, scope, workflow}) {
    let ki = chris.getItem(workflow.actor, 'Ki Points');
    let augmentBreath = chris.getItem(workflow.actor, 'Augment Breath');
    let queueSetup = await queue.setup(workflow.item.uuid, 'breathOfTheDragon', 50);
    if (!queueSetup) return;
    let inputs = [
        {
            'type': 'select',
            'label': 'Type:',
            'options': [
                {
                    'html': 'Cone',
                    'value': 'cone'
                },
                {
                    'html': 'Line',
                    'value': 'line'
                }
            ]
        },
        {
            'type': 'select',
            'label': 'Damage Type:',
            'options': [
                {
                    'html': '🧪 Acid',
                    'value': 'acid'
                },
                {
                    'html': '❄️ Cold',
                    'value': 'cold'
                },
                {
                    'html': '🔥 Fire',
                    'value': 'fire'
                },
                {
                    'html': '⚡ Lightning',
                    'value': 'lightning'
                },
                {
                    'html': '☠️ Poison',
                    'value': 'poison'
                }
            ]
        }
    ];
    if (augmentBreath && ki?.system?.uses?.value) {
        inputs.push(
            {
                'label': 'Augment (1 Ki):',
                'type': 'checkbox',
                'options': false
            }
        );
    }
    let selection = await chris.menu(workflow.item.name, constants.okCancel, inputs, true);
    if (!selection.buttons) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let type = selection.inputs[0];
    let damageType = selection.inputs[1];
    let augment = augmentBreath ? selection.inputs[2] : false;
    let parts = duplicate(workflow.item.system.damage.parts);
    let target = duplicate(workflow.item.system.target);
    parts[0][0] += '[' + damageType + ']';
    parts[0][1] = damageType;
    if (type === 'line') {
        target.type = 'line';
        target.value = augment ? 90 : 30;
        target.width = 5;
    } else if (type === 'cone') {
        target.value = augment ? 60 : 20;
        target.type = 'cone'
    }
    target.units = 'ft';
    if (augment) {
        let scale = workflow.actor.system.scale['way-of-the-ascendant-dragon']?.['breath-of-the-dragon'];
        if (!scale) {
            queue.remove(workflow.item.uuid);
            return;
        }
        parts[0][0] = (scale.number + 1) + 'd' + scale.faces + '[' + damageType + ']';
        await augmentBreath.displayCard();
        await ki.update({'system.uses.value': ki.system.uses.value - 1});
    }
    workflow.item = workflow.item.clone({'system.damage.parts': parts}, {'keepId': true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    let templateData = {
        'user': game.user,
        't': target.type === 'cone' ? 'cone' : 'ray',
        'distance': target.value,
        'width': target.type === 'cone' ? null : 5,
        'fillColor': game.user.color,
        'flags': {
            'dnd5e': {
                'origin': workflow.item.uuid
            },
            'midi-qol': {
                'originUuid': workflow.item.uuid
            }
        }
    };
    let {template, tokens} = await chris.placeTemplate(templateData, true);
    let targetIds = tokens.filter(i => i.uuid != workflow.token.document.uuid).map(i => i.id);
    chris.updateTargets(targetIds);
    let effectData = {
        'origin': workflow.item.uuid,
        'icon': workflow.item.img,
        'label': workflow.item.name + ' Template',
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.dae.deleteUuid',
                'value': template.uuid,
                'mode': 5,
                'priority': 20
            }
        ]
    };
    await chris.createEffect(workflow.actor, effectData);
    queue.remove(workflow.item.uuid);
    if (!chris.getConfiguration(workflow.item, 'animation') ?? true) return;
    let file = '';
    if (type === 'cone') {
        switch (damageType) {
            case 'acid':
            case 'poison':
                file = 'jb2a.breath_weapons.poison.cone.green';
                break;
            case 'cold':
                file = 'jb2a.breath_weapons.cold.cone.blue';
                break;
            case 'fire':
                file = 'jb2a.breath_weapons.fire.cone.orange.01';
            case 'lightning':
                if (chris.jb2aCheck() != 'patreon') return;
                file = 'jb2a.breath_weapons.fire.cone.blue.02';
                break;
        }
    } else {
        switch (damageType) {
            case 'acid':
            case 'poison':
                file = 'jb2a.breath_weapons.acid.line.green';
                break;
            case 'fire':
                file = 'jb2a.breath_weapons.fire.line.orange';
                break;
            case 'lightning':
                file = 'jb2a.breath_weapons.lightning.line.blue';
                break;
            case 'cold':
                if (chris.jb2aCheck() != 'patreon') return;
                file = 'jb2a.breath_weapons.fire.line.blue';
                break;
        }
    }
    new Sequence()
        .effect()
        .file(file)
        .atLocation(template.object.position)
        .stretchTo(template.object)
        .play();
}
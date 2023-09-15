import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function heal({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.system.damage.parts[0][0] != '0[healing') return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'crystalBladeHealing', 50);
    if (!queueSetup) return;
    function dialogRender(html) {
        let ths = html[0].getElementsByTagName('th');
        for (let t of ths) {
            t.style.width = 'auto';
            t.style.textAlign = 'left';
        }
        let tds = html[0].getElementsByTagName('td');
        for (let t of tds) {
            t.style.width = '50px';
            t.style.textAlign = 'center';
            t.style.paddingRight = '5px';
        }
    }
    let selection = await warpgate.menu({
        'inputs': [
            {
                'label': 'Healing:',
                'type': 'number'
            }
        ],
        'buttons': [
            {
                'label': 'Cancel',
                'value': false
            },
            {
                'label': 'Ok',
                'value': true
            }
        ]
    },
    {
        'title': workflow.item.name,
        'render': dialogRender,
        'options': {
            'width': '400px'
        }
    });
    if (!selection.buttons) {
        queue.remove(workflow.item.uuid);
        return;
    }
    if (isNaN(selection.inputs[0])) {
        queue.remove(workflow.uuid);
        return;
    }
    let damageRoll = await new Roll(selection.inputs[0] + '[healing]').roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (!chris.getConfiguration(workflow.item, 'healprompt') ?? true) return;
    let healItem = workflow.actor.items.find(i => i.flags?.['chris-premades']?.equipmentFeature?.uniqueName === 'crystalBladeHeal');
    if (!healItem) return;
    let uses = healItem.system.uses.value;
    if (!uses) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'crystalBlade', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog(workflow.item.name, [['Yes,', true], ['No', false]], 'Use a charge to heal yourself?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let featureData = duplicate(healItem.toObject());
    delete featureData._id;
    featureData.system.damage.parts[0][0] = workflow.damageRoll.terms[4].total + '[healing]';
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.token.document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    await healItem.update({'system.uses.value': uses - 1});
    queue.remove(workflow.item.uuid);
}
async function light({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect1 = chris.findEffect(workflow.actor, 'Crystal Blade - Bright Light');
    let effect2 = chris.findEffect(workflow.actor, 'Crystal Blade - Dim Light');
    let options = [];
    if (!effect1) options.push(['Bright Light', 'bright']);
    if (!effect2) options.push(['Dim Light', 'dim']);
    if (effect1 || effect2) options.push(['Douse Light', 'douse']);
    let selection = await chris.dialog(workflow.item.name, options, 'What type of light do you want?');
    if (!selection) return;
    let effectData;
    switch (selection) {
        case 'bright':
            if (effect2) await chris.removeEffect(effect2);
            effectData = {
                'label': 'Crystal Blade - Bright Light',
                'icon': workflow.item.img,
                'origin': workflow.item.uuid,
                'duration': {
                    'seconds': 86400
                },
                'changes': [
                    {
                        'key': 'ATL.light.dim',
                        'mode': 4,
                        'value': '60',
                        'priority': 20
                    },
                    {
                        'key': 'ATL.light.bright',
                        'mode': 4,
                        'value': '30',
                        'priority': 20
                    }
                ]
            }
            await chris.createEffect(workflow.actor, effectData);
            return;
        case 'dim':
            if (effect1) await chris.removeEffect(effect1);
            effectData = {
                'label': 'Crystal Blade - Dim Light',
                'icon': workflow.item.img,
                'origin': workflow.item.uuid,
                'duration': {
                    'seconds': 86400
                },
                'changes': [
                    {
                        'key': 'ATL.light.dim',
                        'mode': 4,
                        'value': '30',
                        'priority': 20
                    }
                ]
            }
            await chris.createEffect(workflow.actor, effectData);
            return;
        case 'douse':
            if (effect1) await chris.removeEffect(effect1);
            if (effect2) await chris.removeEffect(effect2);
            return;
    }
}
export let crystalBlade = {
    'heal': heal,
    'item': item,
    'light': light
}
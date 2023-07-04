import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function hook(workflow) {
    if (!workflow.token) return;
    if (workflow.targets.size != 1) return;
    let invalidTypes = [
        'cone',
        'cube',
        'cylinder',
        'line',
        'radious',
        'sphere',
        'square',
        'wall'
    ];
    if (invalidTypes.includes(workflow.item.system.target?.type)) return;
    let targetToken = workflow.targets.first();
    if (targetToken.document.disposition === workflow.token.document.disposition) return;
    let targetActor = targetToken.actor;
    let targetEffect = chris.findEffect(targetActor, 'Sanctuary');
    if (!targetEffect) return;
    let targetItem = await fromUuid(targetEffect.origin);
    if (!targetItem) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Sanctuary - Save', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Sanctuary - Save');
    featureData.system.save.dc = chris.getSpellDC(targetItem);
    setProperty(featureData, 'flags.chris-premades.spell.sanctuary.ignore', true);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': targetItem.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.token.document.uuid]);
    let queueSetup = await queue.setup(workflow.item.uuid, 'sanctuary', 48);
    if (!queueSetup) return;
    await warpgate.wait(100);
    let spellWorkflow = await MidiQOL.completeItemUse(feature, config, options);
    if (spellWorkflow.failedSaves.size != 1) {
        queue.remove(workflow.item.uuid);
        return;
    }
    queue.remove(workflow.item.uuid);
    new Sequence().effect().atLocation(targetToken).scaleToObject(1.25).fadeIn(500).fadeOut(500).playbackRate(2).file('jb2a.energy_field.02.above.blue').play();
    return false;
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.item.flags['chris-premades']?.spell?.sanctuary?.ignore) return;
    let remove = false;
    if (workflow.damageRoll && (workflow.defaultDamageType != 'healing' || workflow.defaultDamageType != 'temphp')) {
        remove = true;
    }
    if (!remove) {
        let validTypes = [
            'mwak',
            'rwak',
            'msak',
            'rsak'
        ];
        if (validTypes.includes(workflow.item.system.actionType)) remove = true;
    }
    if (!remove && workflow.item.type === 'spell') {
        for (let i of Array.from(workflow.targets)) {
            if (workflow.token.document.disposition != i.document.disposition) {
                remove = true;
                break;
            }
        }
    }
    if (!remove) return;
    let effect = chris.findEffect(workflow.actor, 'Sanctuary');
    if (!effect) return;
    await chris.removeEffect(effect);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let effectData = {
        'label': 'Sanctuary',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 60,
        },
        'changes': [
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.sanctuary.attack,postActiveEffects',
                'priority': 20
            }
        ]
    };
    await chris.createEffect(workflow.targets.first().actor, effectData);
}
export let sanctuary = {
    'item': item,
    'hook': hook,
    'attack': attack
}
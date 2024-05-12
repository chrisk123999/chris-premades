import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}, altName, selection) {
    if (!workflow.failedSaves.size) return;
    if (!selection) {
        await chris.gmDialogMessage();
        if (!selection) selection = await chris.remoteSelectTarget(chris.lastGM(), workflow.item.name, constants.okCancel, Array.from(workflow.failedSaves), true, 'multiple', undefined, false, 'Select all targets that are not from this plane.');
        await chris.clearGMDialogMessage();
    }
    if (!selection.buttons) return;
    let targetTokens = selection.inputs.filter(i => i);
    let effectData = {
        'name': altName ?? workflow.item.name,
        'changes': [
            {
                'key': 'flags.midi-qol.superSaver.all',
                'mode': 0,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'system.attributes.ac.bonus',
                'mode': 0,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.min.ability.save.all',
                'mode': 0,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.fail.critical.all',
                'mode': 0,
                'value': '1',
                'priority': 20
            },
            {
                'key': 'macro.tokenMagic',
                'mode': 0,
                'value': 'spectral-body',
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.neverTarget',
                'mode': 0,
                'value': '1',
                'priority': 20
            }
        ],
        'origin': workflow.item.uuid,
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': 'await chrisPremades.macros.banishment.end(effect, token);'
                }
            }
        }
    };
    for (let i of Array.from(workflow.failedSaves)) {
        let appliedEffectData;
        if (targetTokens.includes(i.document.uuid)) {
            appliedEffectData = effectData;
        } else {
            appliedEffectData = duplicate(effectData);
            setProperty(appliedEffectData, 'flags.chris-premades.spell.banishment', true);
            appliedEffectData.changes.push({
                'key': 'macro.CE',
                'mode': 2,
                'value': 'Incapacitated',
                'priority': 20
            });
        }
        await chris.createEffect(i.actor, appliedEffectData);
    }
}
async function end(effect, token) {
    if (effect.flags['chris-premades']?.spell?.banishment || effect.duration.remaining != 0) return;
    await token.document.update({
        'hidden': true
    });
}
export let banishment = {
    'item': item,
    'end': end
};

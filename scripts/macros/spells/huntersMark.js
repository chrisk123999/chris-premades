import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Hunter\'s Mark - Move', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Hunter\'s Mark - Move');
    let seconds;
    switch (workflow.castData.castLevel) {
        case 3:
        case 4:
            seconds = 28800;
            break;
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
            seconds = 86400;
            break;
        default:
            seconds = 3600;
    }
    let targetEffectData = {
        'label': 'Marked',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': seconds
        }
    };
    await chris.createEffect(workflow.targets.first().actor, targetEffectData);
    async function effectMacro() {
        await warpgate.revert(token.document, 'Hunter\'s Mark');
        let targetTokenId = effect.changes[0].value;
        let targetToken = canvas.scene.tokens.get(targetTokenId);
        if (!targetToken) return;
        let targetActor = targetToken.actor;
        let targetEffect =  chrisPremades.helpers.findEffect(targetActor, 'Marked');
        if (!targetEffect) return;
        await chrisPremades.helpers.removeEffect(targetEffect);
    }
    let sourceEffectData = {
        'label': 'Hunter\'s Mark',
        'icon': workflow.item.img,
        'changes': [
            {
                'key': 'flags.chris-premades.spell.huntersMark',
                'mode': 5,
                'value': workflow.targets.first().id,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.huntersMark.attack,postDamageRoll',
                'priority': 20
            }
        ],
        'transfer': false,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': seconds
        },
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'chris-premades': {
                'vae': {
                    'button': featureData.name
                }
            }
        }
    }
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [sourceEffectData.label]: sourceEffectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': sourceEffectData.label,
        'description': sourceEffectData.label
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    let conEffect = chris.findEffect(workflow.actor, 'Concentrating');
    if (conEffect) {
        let updates = {
            'duration': {
                'seconds': seconds
            }
        };
        await chris.updateEffect(conEffect, updates);
    }
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let attackType = workflow.item.system.actionType;
    if (!(attackType === 'mwak' || attackType === 'rwak')) return;
    let sourceActor = workflow.actor;
    let markedTarget = sourceActor.flags['chris-premades']?.spell?.huntersMark;
    let targetToken = workflow.hitTargets.first();
    if (targetToken.id != markedTarget) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'huntersMark', 250);
    if (!queueSetup) return;
    let oldFormula = workflow.damageRoll._formula;
    let bonusDamageFormula = '1d6[' + workflow.defaultDamageType + ']'
    if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = oldFormula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
async function move({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let oldTargetTokenId = workflow.actor.flags['chris-premades']?.spell?.huntersMark;
    let oldTargetToken = canvas.scene.tokens.get(oldTargetTokenId);
    let oldTargetOrigin;
    if (oldTargetToken) {
        let oldTargetActor = oldTargetToken.actor;
        let oldTargetEffect =  chris.findEffect(oldTargetActor, 'Marked');
        if (oldTargetEffect) {
            await chris.removeEffect(oldTargetEffect);
            oldTargetOrigin = oldTargetEffect.origin;
        }
    }
    let effect = chris.findEffect(workflow.actor, 'Hunter\'s Mark');
    let duration = 3600;
    if (effect) duration = effect.duration.remaining;
    let effectData = {
        'label': 'Marked',
        'icon': workflow.item.img,
        'origin': oldTargetOrigin,
        'duration': {
            'seconds': duration
        }
    };
    await chris.createEffect(targetActor, effectData);
    if (effect) {
        let changes = effect.changes;
        changes[0].value = targetToken.id;
        let updates = {changes};
        await chris.updateEffect(effect, updates);
    }
}
export let huntersMark = {
    'item': item,
    'attack': attack,
    'move': move
};
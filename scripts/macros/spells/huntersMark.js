import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function item({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Hunter\'s Mark - Move', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Hunter\'s Mark - Move');
    let seconds;
    switch (this.castData.castLevel) {
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
        'icon': this.item.img,
        'origin': this.item.uuid,
        'duration': {
            'seconds': seconds
        }
    };
    await chris.createEffect(this.targets.first().actor, targetEffectData);
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
        'icon': this.item.img,
        'changes': [
            {
                'key': 'flags.chris-premades.spell.huntersMark',
                'mode': 5,
                'value': this.targets.first().id,
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
        'origin': this.item.uuid,
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
    await warpgate.mutate(this.token.document, updates, {}, options);
    let conEffect = chris.findEffect(this.actor, 'Concentrating');
    if (conEffect) {
        let updates = {
            'duration': {
                'seconds': seconds
            }
        };
        await chris.updateEffect(conEffect, updates);
    }
}
async function attack({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let attackType = workflow.item.system.actionType;
    if (!(attackType === 'mwak' || attackType === 'rwak')) return;
    let sourceActor = this.actor;
    let markedTarget = sourceActor.flags['chris-premades']?.spell?.huntersMark;
    let targetToken = this.hitTargets.first();
    if (targetToken.id != markedTarget) return;
    let queueSetup = await queue.setup(this.item.uuid, 'huntersMark', 250);
    if (!queueSetup) return;
    let oldFormula = this.damageRoll._formula;
    let diceNum = 1;
    if (this.isCritical) diceNum = 2;
    let damageFormula = oldFormula + ' + ' + diceNum + 'd6[' + this.defaultDamageType + ']';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}
async function move({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    let targetActor = targetToken.actor;
    let oldTargetTokenId = this.actor.flags['chris-premades']?.spell?.huntersMark;
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
    let effect = chris.findEffect(this.actor, 'Hunter\'s Mark');
    let duration = 3600;
    if (effect) duration = effect.duration.remaining;
    let effectData = {
        'label': 'Marked',
        'icon': this.item.img,
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
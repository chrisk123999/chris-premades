import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function hexItem({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Hex - Move', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Hex - Move');
    let selection = await chris.dialog('What ability should have disadvantage?', [
        ['Strength', 'str'],
        ['Dexterity', 'dex'],
        ['Constitution', 'con'],
        ['Intelligence', 'int'],
        ['Wisdom', 'wis'],
        ['Charisma', 'cha']
    ]);
    if (!selection) selection = 'str';
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
        'label': 'Hexed',
        'icon': 'icons/magic/perception/silhouette-stealth-shadow.webp',
        'origin': this.item.uuid,
        'duration': {
            'seconds': seconds
        },
        'changes': [
            {
                'key': 'flags.midi-qol.disadvantage.ability.check.' + selection,
                'mode': 5,
                'value': '1',
                'priority': 20
            }
        ]
    };
    await chris.createEffect(this.targets.first().actor, targetEffectData);
    async function effectMacro() {
        await warpgate.revert(token.document, 'Hex');
        let targetTokenId = effect.changes[0].value;
        let targetToken = canvas.scene.tokens.get(targetTokenId);
        if (!targetToken) return;
        let targetActor = targetToken.actor;
        let targetEffect =  chrisPremades.helpers.findEffect(targetActor, 'Hexed');
        if (!targetEffect) return;
        await chrisPremades.helpers.removeEffect(targetEffect);
    }
    let sourceEffectData = {
        'label': 'Hex',
        'icon': this.item.img,
        'changes': [
            {
                'key': 'flags.chris-premades.spell.hex',
                'mode': 5,
                'value': this.targets.first().id,
                'priority': 20
            },
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.chrisPremades.macros.hex.attack,postDamageRoll',
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
async function hexAttack({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 1) return;
    let sourceActor = this.actor;
    let hexedTarget = sourceActor.flags['chris-premades']?.spell?.hex;
    let targetToken = this.hitTargets.first();
    if (targetToken.id != hexedTarget) return;
    let queueSetup = await queue.setup(this.item.uuid, 'hex', 250);
    if (!queueSetup) return;
    let oldFormula = this.damageRoll._formula;
    let diceNum = 1;
    if (this.isCritical) diceNum = 2;
    let damageFormula = oldFormula + ' + ' + diceNum + 'd6[necrotic]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}
async function hexMoveItem({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    let targetActor = targetToken.actor;
    let oldTargetTokenId = this.actor.flags['chris-premades']?.spell?.hex;
    let oldTargetToken = canvas.scene.tokens.get(oldTargetTokenId);
    let oldTargetOrigin;
    let selection = 'flags.midi-qol.disadvantage.ability.check.str';
    if (oldTargetToken) {
        let oldTargetActor = oldTargetToken.actor;
        let oldTargetEffect =  chris.findEffect(oldTargetActor, 'Hexed');
        if (oldTargetEffect) {
            await chris.removeEffect(oldTargetEffect);
            oldTargetOrigin = oldTargetEffect.origin;
            selection = oldTargetEffect.changes[0].key;
        }
    }
    let effect = chris.findEffect(this.actor, 'Hex');
    let duration = 3600;
    if (effect) duration = effect.duration.remaining;
    let effectData = {
        'label': 'Hexed',
        'icon': 'icons/magic/perception/silhouette-stealth-shadow.webp',
        'origin': oldTargetOrigin,
        'duration': {
            'seconds': duration
        },
        'changes': [
            {
                'key': selection,
                'mode': 5,
                'value': '1',
                'priority': 20
            }
        ]
    };
    await chris.createEffect(targetActor, effectData);
    if (effect) {
        let changes = effect.changes;
        changes[0].value = targetToken.id;
        let updates = {changes};
        await chris.updateEffect(effect, updates);
    }
}
export let hex = {
    'item': hexItem,
    'attack': hexAttack,
    'move': hexMoveItem
};
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function hexItem({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Hex - Move', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Hex - Move');
    let queueSetup = await queue.setup(workflow.item.uuid, 'hex', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog(workflow.item.name, [
        ['Strength', 'str'],
        ['Dexterity', 'dex'],
        ['Constitution', 'con'],
        ['Intelligence', 'int'],
        ['Wisdom', 'wis'],
        ['Charisma', 'cha']
    ], 'What ability should have disadvantage?');
    if (!selection) selection = 'str';
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
        'name': 'Hexed',
        'icon': 'icons/magic/perception/silhouette-stealth-shadow.webp',
        'origin': workflow.item.uuid,
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
    await chris.createEffect(workflow.targets.first().actor, targetEffectData);
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
        'name': 'Hex',
        'icon': workflow.item.img,
        'changes': [
            {
                'key': 'flags.chris-premades.spell.hex',
                'mode': 5,
                'value': workflow.targets.first().id,
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
    };
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [sourceEffectData.name]: sourceEffectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': sourceEffectData.name,
        'description': sourceEffectData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    let conEffect = MidiQOL.getConcentrationEffect(workflow.actor, workflow.item);
    await conEffect.addDependents([workflow.actor.effects.getName(workflow.item.name)]);
    if (conEffect) {
        let updates = {
            'duration': {
                'seconds': seconds
            }
        };
        await chris.updateEffect(conEffect, updates);
    }
    queue.remove(workflow.item.uuid);
}
async function hexAttack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let validTypes = ['msak', 'rsak', 'mwak', 'rwak'];
    if (!validTypes.includes(workflow.item.system.actionType)) return;
    let sourceActor = workflow.actor;
    let hexedTarget = sourceActor.flags['chris-premades']?.spell?.hex;
    let targetToken = workflow.hitTargets.first();
    if (targetToken.id != hexedTarget) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'hex', 250);
    if (!queueSetup) return;
    let bonusDamageFormula = '1d6[necrotic]';
    await chris.addToDamageRoll(workflow, bonusDamageFormula);
    queue.remove(workflow.item.uuid);
}
async function hexMoveItem({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let oldTargetTokenId = workflow.actor.flags['chris-premades']?.spell?.hex;
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
    let effect = chris.findEffect(workflow.actor, 'Hex');
    let duration = 3600;
    if (effect) duration = effect.duration.remaining;
    let effectData = {
        'name': 'Hexed',
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
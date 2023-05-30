import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function turnStart(token, actor) {
    let options = {
        'showFullCard': false,
        'createthis': true,
        'targetUuids': [token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    let levels = actor.classes['blood-hunter'].system.levels
    let bonusHealth = 0;
    if (levels >= 11 && (actor.system.attributes.hp.max / 2) > actor.system.attributes.hp.value) {
        let featureData2 = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Lycan Regeneration', false);
        featureData2.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Lycan Regeneration');
        let feature2 = new CONFIG.Item.documentClass(featureData2, {parent: workflow.actor});
        if (levels >= 15) {
            let effectData2 = {
                'label': 'Condition Advantage',
                'icon': 'icons/magic/time/arrows-circling-green.webp',
                'duration': {
                    'seconds': 1,
                },
                'changes': [
                    {
                        'key': 'flags.midi-qol.advantage.ability.save.wis',
                        'mode': 5,
                        'value': '1',
                        'priority': 20
                    }
                ]
            }
            await chris.createEffect(actor, effectData2);
        }
        let featureWorkflow = await MidiQOL.completeItemUse(feature2, {}, options);
        if (levels >= 15) {
            let advEffect = chris.findEffect(actor, 'Condition Advantage')
            if (advEffect) await advEffect.delete();
        } 
        bonusHealth = featureWorkflow.damageTotal;
    }
    if ((actor.system.attributes.hp.max / 2) <= actor.system.attributes.hp.value + bonusHealth) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Bloodlust', false);
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Bloodlust');
    if (!featureData) return;
    let feature = new CONFIG.Item.documentClass(featureData, {parent: token.actor});
    await MidiQOL.completeItemUse(feature, {}, options);
}
async function transformation({speaker, actor, token, character, item, args, scope, workflow}) {
    let levels = workflow.actor.classes['blood-hunter'].system.levels
    let weaponData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Predatory Strike', false);
    weaponData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Predatory Strike');
    if (levels >= 7) {
        weaponData.system.attackBonus = '+1';
        weaponData.system.properties.mgc = true;
    }
    async function effectMacro () {
        await warpgate.revert(token.document, 'Hybrid Transformation');
    }
    let bonuses = '+1';
    if (levels >= 11) {
        bonuses = '+2';
        weaponData.system.attackBonus = '+2';
        weaponData.system.damage.parts = [
            [
                '1d8[bludgeoning] + @mod',
                'bludgeoning'
            ]
        ];
    }
    let seconds = 600;
    if (levels >= 18) {
        bonuses = '+3';
        weaponData.system.attackBonus = '+3';
        seconds = 604800
    }
    let changes = [
        {
            'key': 'flags.midi-qol.advantage.ability.check.str',
            'mode': 5,
            'value': '1',
            'priority': 20
        },
        {
            'key': 'flags.midi-qol.advantage.ability.save.str',
            'mode': 5,
            'value': '1',
            'priority': 20
        },
        {
            'key': 'system.traits.dr.custom',
            'mode': 0,
            'value': 'Non-Magical Damage',
            'priority': 20
        },
        {
            'key': 'system.attributes.ac.bonus',
            'mode': 2,
            'value': '+1',
            'priority': 20
        },
        {
            'key': 'system.bonuses.mwak.damage',
            'mode': 2,
            'value': bonuses,
            'priority': 20
        }
    ];
    if (levels >= 15) {
        changes.push(
            {
                'key': 'flags.midi-qol.onUseMacroName',
                'mode': 0,
                'value': 'function.await chrisPremades.macros.hybridTransformation.voracious,preAttackRoll',
                'priority': 20
            }
        );
    }
    let effectData = {
        'label': 'Hybrid Transformation',
        'icon': workflow.item.img,
        'changes': changes,
        'disabled': false,
        'duration': {
            'seconds': seconds
        },
        'origin': workflow.item.uuid,
        'flags': {
            'dae': {
                'selfTarget': true,
                'selfTargetAlways': false,
                'stackable': 'none',
                'durationExpression': '',
                'macroRepeat': 'none',
                'specialDuration': [
                    'zeroHP'
                ]
            },
            'effectmacro': {
                'onTurnStart': {
                    'script': 'await chrisPremades.macros.hybridTransformation.turnStart(token, actor);'
                },
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
            'dae': {
                'transfer': true
            }
        }
    }
    let updates = {
        'embedded': {
            'Item': {
                [weaponData.name]: weaponData
            },
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    };
    let image = workflow.actor.flags['chris-premades']?.feature?.hybridTransformation?.img;
    if (image != '') {
        updates.token = {
            'texture': {
                'src': image
            }
        }
    }
    let options = {
        'permanent': false,
        'name': effectData.label,
        'description': effectData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function voracious({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    let effect = chris.findEffect(targetActor, 'Brand of Castigation');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    if (originItem.actor.uuid != workflow.actor.uuid) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'voracious',150);
    if (!queueSetup) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution['Brand of the Voracious'] = true;
    queue.remove(workflow.item.uuid);
}
export let hybridTransformation = {
    'item': transformation,
    'turnStart': turnStart,
    'voracious': voracious
}
import {chris} from '../../../helperFunctions.js';
export async function touch({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let effect = chris.findEffect(targetActor, 'Douse Fire');
    if (effect) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Monster Feature Items', 'Douse Fire', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Douse Fire');
    async function effectMacro () {
        await warpgate.revert(token.document, 'Douse Fire');
    }
    let effectData = {
        'label': 'Douse Fire',
        'icon': featureData.img,
        'duration': {
            'seconds': 604800
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            },
        }
    };
    let effects = {[effectData.label]: effectData};
    let effect2 = chris.findEffect(targetActor, 'Fire Form');
    if (!effect2) {
        let effect2Data = {
            'label': 'Fire Form',
            'icon': 'icons/magic/fire/projectile-embers-orange.webp',
            'changes': [
                {
                    'key': 'flags.midi-qol.OverTime',
                    'mode': 0,
                    'value': 'turn=start,\ndamageRoll=1d10,\ndamageType=fire,\nlabel=Fire Form (Start of Turn)',
                    'priority': 20
                },
                {
                    'key': 'macro.tokenMagic',
                    'mode': 0,
                    'value': 'fire',
                    'priority': 20
                }
            ],
            'duration': {
                'seconds': 604800
            },
            'origin': workflow.item.uuid,
            'flags': {
                'effectmacro': {
                    'onDelete': {
                        'script': 'await chrisPremades.macros.monster.fireElemental.effectEnd(actor);'
                    }
                }
            }
        }
        effects[effect2Data.label] = effect2Data;
    }
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': effects
        }
    };
    let options = {
        'permanent': false,
        'name': featureData.name,
        'description': featureData.name
    };
    await warpgate.mutate(targetToken.document, updates, {}, options);
}
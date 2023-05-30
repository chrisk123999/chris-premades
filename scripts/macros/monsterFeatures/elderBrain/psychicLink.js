import {chris} from '../../../helperFunctions.js';
async function saveItem({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.failedSaves.size === 1) return;
    let effect = chris.findEffect(workflow.actor, 'Psychic Link');
    let damageRoll = await new Roll('3d6[psychic]').roll({async: true});
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: 'Psychic Link'
    });
    await chris.applyDamage(workflow.token, damageRoll.total, 'psychic');
    if (effect) chris.removeEffect(effect);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Monster Feature Items', 'Break Psychic Link', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Break Psychic Link');
    async function effectMacro () {
        await warpgate.revert(token.document, 'Break Psychic Link');
    }
    let effectData = {
        'label': 'Psychic Link',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
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
                [effectData.label]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': featureData.name,
        'description': featureData.name
    };
    await warpgate.mutate(workflow.targets.first().document, updates, {}, options);
}
async function sever({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let effect = chris.findEffect(workflow.targets.first().actor, 'Psychic Link');
    if (effect) await chris.removeEffect(effect);
}
async function pulse({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let nearbyTokens = chris.findNearby(targetToken, 30, 'ally');
    await chris.applyDamage(nearbyTokens, workflow.damageRoll.total, 'psychic');
}
export let psychicLink = {
    'item': item,
    'saveItem': saveItem,
    'sever': sever,
    'pulse': pulse
}
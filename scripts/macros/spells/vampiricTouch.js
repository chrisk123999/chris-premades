import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function vampiricTouchItem({speaker, actor, token, character, item, args, scope, workflow}) {
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Vampiric Touch Attack', false);
    if (!featureData) return;
    let spellLevel = workflow.castData.castLevel;
    featureData.system.damage.parts = [
        [
            spellLevel + 'd6[necrotic]',
            'necrotic'
        ]
    ];
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Vampiric Touch Attack');
    featureData.flags['chris-premades'] = {
        'spell': {
            'vampiricTouchAttack': true,
            'castData': workflow.castData
        }
    };
    featureData.flags['chris-premades'].spell.castData.school = workflow.item.system.school;
    async function effectMacro () {
        await warpgate.revert(token.document, 'Vampiric Touch');
    }
    let effectData = {
        'label': workflow.item.name,
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
                [workflow.item.name]: effectData
            }
        }
    };
    let options = {
        'permanent': false,
        'name': 'Vampiric Touch',
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
    let feature = workflow.actor.items.find(item => item.flags['chris-premades']?.spell?.vampiricTouchAttack);
    if (!feature) return;
    if (workflow.targets.size === 0) return;
    let [config, options2] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await MidiQOL.completeItemUse(feature, config, options2);
}
async function vampiricTouchAttack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'vampiricTouchAttack', 450);
    if (!queueSetup) return;
    let damage = chris.totalDamageType(workflow.targets.first().actor, workflow.damageDetail, 'necrotic');
    if (!damage) {
        queue.remove(workflow.item.uuid);
        return;
    }
    damage = Math.floor(damage / 2);
    await chris.applyDamage([workflow.token], damage, 'healing');
    queue.remove(workflow.item.uuid);
}
export let vampiricTouch = {
    'item': vampiricTouchItem,
    'attack': vampiricTouchAttack
};
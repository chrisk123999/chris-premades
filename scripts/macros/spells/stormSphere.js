import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.templateUuid) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Storm Sphere Bolt', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Storm Sphere Bolt');
    async function effectMacro () {
        await warpgate.revert(token.document, 'Storm Sphere Handler');
    }
    async function effectMacro2() {
        await chrisPremades.macros.stormSphere.turnStart(actor, effect);
    }
    let effectData = {
        'label': 'Storm Sphere Handler',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 60
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                },
                'onEachTurn': {
                    'script':chris.functionToString(effectMacro2)
                }
            },
            'chris-premades': {
                'spell': {
                    'stormSphere': {
                        'templateUuid': workflow.templateUuid,
                        'castLevel': workflow.castData.castLevel,
                        'spellSaveDC': chris.getSpellDC(workflow.item)
                    }
                },
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
        'name': effectData.label,
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates, {}, options);
}
async function boltItem({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let effect = chris.findEffect(workflow.actor, 'Storm Sphere Handler');
    if (!effect) return;
    let castLevel = effect.flags['chris-premades']?.spell?.stormSphere?.castLevel;
    if (!castLevel) castLevel = 4;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Storm Sphere Bolt Attack', false);
    if (!featureData) return;
    featureData.system.damage.parts = [
        [
            castLevel + 'd6[lightning]',
            'lightning'
        ]
    ];
    featureData.flags['chris-premades'] = {
        'spell': {
            'castData': {
                'castLevel': castLevel,
                'school': 'evo'
            }
        }
    };
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetToken.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    let templateUuid = effect.flags['chris-premades']?.spell?.stormSphere?.templateUuid;
    if (!templateUuid) return;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    let chatMessage = game.messages.get(workflow.itemCardId);
    if (chatMessage) await chatMessage.delete();
    let flag = workflow.actor.flags['midi-qol']?.ignoreNearbyFoes;
    if (!flag) workflow.actor.flags['midi-qol'].ignoreNearbyFoes = 1;
    let position = canvas.grid.getSnappedPosition(template.object.center.x, template.object.center.y);
    let savedX = workflow.token.document.x;
    let savedY = workflow.token.document.y;
    workflow.token.document.x = position.x;
    workflow.token.document.y = position.y;
    await MidiQOL.completeItemUse(feature, {}, options);
    workflow.token.document.x = savedX;
    workflow.token.document.y = savedY;
    if (!flag) workflow.actor.flags['midi-qol'].ignoreNearbyFoes = 0;
    new Sequence().effect().atLocation(template.object).stretchTo(targetToken).file('jb2a.chain_lightning.primary.blue').play();
}
async function boltAttackItem({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let effect = chris.findEffect(workflow.actor, 'Storm Sphere Handler');
    if (!effect) return;
    let templateUuid = effect.flags['chris-premades']?.spell?.stormSphere?.templateUuid;
    if (!templateUuid) return;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    let targetToken = workflow.targets.first();
    if (!chris.tokenInTemplate(targetToken.document, template)) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'stormSphere', 50);
    if (!queueSetup) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add('Advantage: Storm Sphere');
    queue.remove(workflow.item.uuid);
}
async function turnStart(actor, effect) {
    let previousTurnId = game.combat.previous.tokenId;
    if (!previousTurnId) return;
    let templateUuid = effect.flags['chris-premades']?.spell?.stormSphere?.templateUuid;
    if (!templateUuid) return;
    let template = await fromUuid(templateUuid);
    if (!template) return;
    let targetToken = game.canvas.tokens.get(previousTurnId);
    if (!chris.tokenInTemplate(targetToken, template)) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Storm Sphere Turn', false);
    if (!featureData) return;
    let stormSphere = effect.flags['chris-premades']?.spell?.stormSphere;
    if (!stormSphere) return;
    featureData.system.save.dc = stormSphere.spellSaveDC;
    featureData.system.damage.parts = [
        [
            (stormSphere.castLevel - 2) + 'd6[bludgeoning]',
            'bludgeoning'
        ]
    ];
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': actor});
    let options = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await MidiQOL.completeItemUse(feature, {}, options);
}
export let stormSphere = {
    'item': item,
    'turnStart': turnStart,
    'boltItem': boltItem,
    'boltAttackItem': boltAttackItem
}
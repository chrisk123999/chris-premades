import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
export async function danseMacabre({speaker, actor, token, character, item, args, scope, workflow}) {
    let zombieActor = game.actors.getName('CPR - Zombie');
    let skeletonActor = game.actors.getName('CPR - Skeleton');
    if (!zombieActor || !skeletonActor) return;
    let nearbyTokens = await chris.findNearby(workflow.token, 60, 'all', true).filter(t => t.actor.system.attributes.hp.value === 0 && !chris.findEffect(t.actor, 'Unconscious'));
    if (!nearbyTokens.length) return;
    let options = [
        'Ignore',
        'Skeleton',
        'Zombie'
    ];
    let bonusHP = 0;
    let damageBonus;
    if (workflow.actor.flags["chris-premades"]?.feature?.undeadThralls) {
        let wizardLevels = workflow.actor.classes.wizard?.system?.levels;
        if (wizardLevels) bonusHP += wizardLevels;
        damageBonus = workflow.actor.system.attributes.prof;
    }
    let maxTargets = 5 + ((workflow.castData.castLevel - 5) * 2);
    let selection = await chris.selectTarget('Select your targets. (Max: ' + maxTargets + ')', constants.okCancel, nearbyTokens, true, 'select', options);
    if (!selection.buttons) return;
    let totalSelected = selection.inputs.filter(i => i != 'Ignore').length;
    if (totalSelected > maxTargets) {
        ui.notifications.info('Too many targets selected!');
        return;
    }
    let zombieActorUpdates = zombieActor.toObject();
    delete zombieActorUpdates.token;
    delete zombieActorUpdates.items;
    delete zombieActorUpdates.effects;
    delete zombieActorUpdates.type;
    delete zombieActorUpdates.flags;
    delete zombieActorUpdates.folder;
    zombieActorUpdates.name = 'Zombie';
    zombieActorUpdates.system.attributes.hp.value += bonusHP;
    zombieActorUpdates.system.attributes.hp.max += bonusHP;
    zombieActorUpdates.system.attributes.hp.formula += bonusHP;
    delete zombieActorUpdates.sort;
    delete zombieActorUpdates._id;
    delete zombieActorUpdates._stats;
    delete zombieActorUpdates.ownership;
    setProperty(zombieActorUpdates, 'ownership.' + game.user.id, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
    let zombieTokenUpdates = (await zombieActor.getTokenDocument()).toObject();
    zombieTokenUpdates.actorLink = false;
    delete zombieTokenUpdates.actorId;
    delete zombieTokenUpdates.x;
    delete zombieTokenUpdates.y;
    delete zombieTokenUpdates._id;
    zombieTokenUpdates.disposition = workflow.token.document.disposition;
    let zombieItems = zombieActor.getEmbeddedCollection('Item').reduce( (acc, element) => {acc[element.id] = element.toObject(); return acc;}, {});
    let skeletonActorUpdates = skeletonActor.toObject();
    delete skeletonActorUpdates.token;
    delete skeletonActorUpdates.items;
    delete skeletonActorUpdates.effects;
    delete skeletonActorUpdates.type;
    delete skeletonActorUpdates.flags;
    delete skeletonActorUpdates.folder;
    skeletonActorUpdates.name = 'Skeleton';
    skeletonActorUpdates.system.attributes.hp.value += bonusHP;
    skeletonActorUpdates.system.attributes.hp.max += bonusHP;
    skeletonActorUpdates.system.attributes.hp.formula += bonusHP;
    delete skeletonActorUpdates.sort;
    delete skeletonActorUpdates._id;
    delete skeletonActorUpdates._stats;
    delete skeletonActorUpdates.ownership;
    setProperty(skeletonActorUpdates, 'ownership.' + game.user.id, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
    let skeletonTokenUpdates = (await skeletonActor.getTokenDocument()).toObject();
    skeletonTokenUpdates.actorLink = false;
    delete skeletonTokenUpdates.actorId;
    delete skeletonTokenUpdates.x;
    delete skeletonTokenUpdates.y;
    delete skeletonTokenUpdates._id;
    skeletonTokenUpdates.disposition = workflow.token.document.disposition;
    let skeletonItems = skeletonActor.getEmbeddedCollection('Item').reduce( (acc, element) => {acc[element.id] = element.toObject(); return acc;}, {});
    let mutationName = 'Danse Macabre';
    let mutateOptions =  {
        'name': mutationName,
        'permanent': false,
        'comparisonKeys': {
            'Item': 'id'
        }
    };
    async function effectMacro () {
        await warpgate.revert(token.document, 'Danse Macabre');
        if (actor.type === 'character') await chrisPremades.helpers.addCondition(actor, 'Dead', true);
    }
    let spellMod = '+ ' + chris.getSpellMod(workflow.item);
    if (damageBonus) spellMod += ' + ' + damageBonus;
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'changes': [
            {
                'key': 'system.bonuses.All-Damage',
                'mode': 2,
                'value': spellMod,
                'priority': 20
            },
            {
                'key': 'system.bonuses.All-Attacks',
                'mode': 2,
                'value': spellMod,
                'priority': 20
            }
        ],
        'duration': {
            'seconds': 3600
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            }
        },
        'transfer': true
    };
    let targetTokens = [];
    for (let i = 0; nearbyTokens.length > i; i++) {
        if (selection.inputs[i] === 'Ignore') continue;
        let turnToken = nearbyTokens[i];
        targetTokens.push(turnToken.document.uuid);
        if (turnToken.actor.type === 'character') await chris.removeCondition(turnToken.actor, 'Dead');
        let newItems;
        let updates;
        let itemUpdates;
        if (selection.inputs[i] === 'Zombie') {
            newItems = zombieItems;
            itemUpdates = turnToken.actor.items.reduce( (acc, val) => {acc[val.id] = warpgate.CONST.DELETE; return acc;}, newItems);
            updates = {
                'token': zombieTokenUpdates,
                'actor': zombieActorUpdates,
                'embedded': {
                    'Item': itemUpdates,
                    'ActiveEffect': {
                        [effectData.name]: effectData
                    }
                }
            };
        } else if (selection.inputs[i] === 'Skeleton') {
            newItems = skeletonItems;
            itemUpdates = turnToken.actor.items.reduce( (acc, val) => {acc[val.id] = warpgate.CONST.DELETE; return acc;}, newItems);
            updates = {
                'token': skeletonTokenUpdates,
                'actor': skeletonActorUpdates,
                'embedded': {
                    'Item': itemUpdates,
                    'ActiveEffect': {
                        [effectData.name]: effectData
                    }
                }
            };
        }
        await warpgate.mutate(turnToken.document, updates, {}, mutateOptions);
    }
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Danse Macabre - Command Undead', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Danse Macabre - Command Undead');
    async function effectMacro2 () {
        let targetTokens = effect.flags['chris-premades']?.spell?.danseMacabre;
        if (targetTokens) {
            for (let i of targetTokens) {
                let targetToken = await fromUuid(i);
                if (!targetToken) continue;
                let targetEffect = chrisPremades.helpers.findEffect(targetToken.actor, 'Danse Macabre');
                if (targetEffect) chrisPremades.helpers.removeEffect(targetEffect);
            }
        }
        await warpgate.revert(token.document, 'Danse Macabre - Command Undead');
    }
    let effectData2 = {
        'name': workflow.item.name + ' - Caster',
        'icon': workflow.item.img,
        'duration': {
            'seconds': 3600
        },
        'origin': workflow.item.uuid,
        'flags': {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro2)
                }
            },
            'chris-premades': {
                'spell': {
                    'danseMacabre': targetTokens
                }
            }
        }
    };
    let updates2 = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            },
            'ActiveEffect': {
                [effectData2.name]: effectData2
            }
        }
    };
    let options2 = {
        'permanent': false,
        'name': 'Danse Macabre - Command Undead',
        'description': featureData.name
    };
    await warpgate.mutate(workflow.token.document, updates2, {}, options2);
}
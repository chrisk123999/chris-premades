import {chris} from '../../helperFunctions.js';
export async function danseMacabre({speaker, actor, token, character, item, args, scope, workflow}) {
    let zombieActor = game.actors.getName('CPR - Zombie');
    let skeletonActor = game.actors.getName('CPR - Skeleton');
    if (!zombieActor || !skeletonActor) {
        ui.notifications.warn('Missing required sidebar actor!');
        return;
    }
    let nearbyTokens = await chris.findNearby(workflow.token, 60, 'all', true).filter(t => t.actor.system.attributes.hp.value === 0 && !chris.findEffect(t.actor, 'Unconscious'));
    if (nearbyTokens.length === 0) return;
    let buttons = [
		{
			'label': 'Ok',
			'value': true
		}, {
			'label': 'Cancel',
			'value': false
		}
	];
    let options = [
        'Ignore',
        'Skeleton',
        'Zombie'
    ];
    let maxTargets = 5 + ((workflow.castData.castLevel - 5) * 2);
    let selection = await chris.selectTarget('Select your targets. (Max: ' + maxTargets + ')', buttons, nearbyTokens, true, 'select', options);
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
    console.log(skeletonTokenUpdates);
    let mutationName = 'Danse Macabre';
    let mutateOptions =  {
        'name': mutationName,
        'comparisonKeys': {
            'Item': 'id'
        }
    };
    async function effectMacro () {
        await warpgate.revert(token.document, 'Danse Macabre');
    }
    let effectData = {
        'label': workflow.item.name,
        'icon': workflow.item.img,
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
        }
    };
    for (let i = 0; nearbyTokens.length > i; i++) {
        if (selection.inputs[i] === 'Ignore') continue;
        let newItems;
        let updates;
        let itemUpdates;
        if (selection.inputs[i] === 'Zombie') {
            newItems = zombieItems;
            itemUpdates = nearbyTokens[i].actor.items.reduce( (acc, val) => {acc[val.id] = warpgate.CONST.DELETE; return acc;}, newItems);
            updates = {
                'token': zombieTokenUpdates,
                'actor': zombieActorUpdates,
                'embedded': {
                    'Item': itemUpdates,
                    'ActiveEffect': {
                        [effectData.label]: effectData
                    }
                }
            };
        } else if (selection.inputs[i] === 'Skeleton') {
            newItems = skeletonItems;
            itemUpdates = nearbyTokens[i].actor.items.reduce( (acc, val) => {acc[val.id] = warpgate.CONST.DELETE; return acc;}, newItems);
            updates = {
                'token': skeletonTokenUpdates,
                'actor': skeletonActorUpdates,
                'embedded': {
                    'Item': itemUpdates,
                    'ActiveEffect': {
                        [effectData.label]: effectData
                    }
                }
            };
        }
        await warpgate.mutate(nearbyTokens[i].document, updates, {}, mutateOptions);
    }
}
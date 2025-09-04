import {Summons} from '../../../lib/summons.js';
import {activityUtils, compendiumUtils, constants, genericUtils, itemUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.modernPacks.summons, 'CPR - Mage Hand');
    if (!sourceActor) return;
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = workflow.item.name;
    let updates = {
        actor: {
            name,
            prototypeToken: {
                name
            }
        },
        token: {
            name
        }
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation');
    let moveActivity = activityUtils.getActivityByIdentifier(workflow.item, 'move');
    if (!moveActivity) return;
    let additionalVaeButtons = [{
        type: 'use', 
        name: moveActivity.name,
        identifier: 'mageHand', 
        activityIdentifier: 'move'
    }];
    let unhideActivities = {
        itemUuid: workflow.item.uuid,
        activityIdentifiers: ['move'],
        favorite: true
    };
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: itemUtils.convertDuration(workflow.item).seconds,
        range: workflow.activity.range.value,
        animation,
        initiativeType: 'none',
        additionalVaeButtons,
        unhideActivities
    });
}
async function move({trigger, workflow}) {

}
export let mageHand = {
    name: 'Mage Hand',
    version: '1.3.38',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            },
            {
                pass: 'rollFinished',
                macro: move,
                priority: 50,
                activities: ['move', 'moveBonus']
            }
        ]
    }
};
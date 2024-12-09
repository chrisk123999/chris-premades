import {Summons} from '../../../lib/summons.js';
import {activityUtils, compendiumUtils, constants, dialogUtils, genericUtils, itemUtils} from '../../../utils.js';

async function late({workflow}) {
    if (!itemUtils.getEquipmentState(workflow.item)) return;
    if (activityUtils.getIdentifier(workflow.activity) !== 'forceSculpture') return;
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Force Sculpture');
    if (!sourceActor) return;
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Rage.LargeOrHuge', [
        ['DND5E.SizeLarge', 'lg'],
        ['DND5E.SizeMedium', 'med'],
        ['DND5E.SizeSmall', 'sm'],
        ['DND5E.SizeTiny', 'tiny']
    ]);
    if (!selection) return;
    let updates = {
        actor: {
            system: {
                traits: {
                    size: selection
                }
            },
            name: workflow.item.name,
            prototypeToken: {
                name: workflow.item.name,
                width: selection === 'lg' ? 2 : 1,
                height: selection === 'lg' ? 2 : 1
            }
        },
        token: {
            name: workflow.item.name,
            width: selection === 'lg' ? 2 : 1,
            height: selection === 'lg' ? 2 : 1
        }
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    if (selection === 'sm') {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.scaleX', 0.8);
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.scaleY', 0.8);
        genericUtils.setProperty(updates, 'token.texture.scaleX', 0.8);
        genericUtils.setProperty(updates, 'token.texture.scaleY', 0.8);
    } else if (selection === 'tiny') {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.scaleX', 0.5);
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.scaleY', 0.5);
        genericUtils.setProperty(updates, 'token.texture.scaleX', 0.5);
        genericUtils.setProperty(updates, 'token.texture.scaleY', 0.5);
    }
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        range: 10,
        animation: itemUtils.getConfig(workflow.item, 'playAnimation') ? 'earth' : 'none',
        initiativeType: 'none',
        duration: 28800
    });
}
export let bigbysBeneficentBracelet = {
    name: 'Bigby\'s Beneficent Bracelet',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ForceSculpture',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.ForceSculpture',
            type: 'file',
            default: '',
            category: 'summons'
        },
    ],
    equipment: {
        mageHand: {
            name: 'Mage Hand',
            compendium: 'personalSpell',
            translate: 'CHRISPREMADES.Macros.BigbysBeneficentBracelet.MageHand',
            preparation: 'atwill'
        }
    }
};
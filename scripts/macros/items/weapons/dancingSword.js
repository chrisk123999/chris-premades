import {Summons} from '../../../lib/summons.js';
import {activityUtils, animationUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Dancing Sword');
    if (!sourceActor) return;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'dancingSwordAttack', {strict: true});
    if (!feature) return;
    await genericUtils.update(feature, {'uses.spent': 0});
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.' + genericUtils.getIdentifier(workflow.item).replace('dancingSword','Dancing'));
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
    if (!tokenImg) {
        let weaponType = workflow.item.system.type?.baseItem;
        if (animationUtils.jb2aCheck() && weaponType) {
            tokenImg = Sequencer.Database.getEntry('jb2a.spiritual_weapon.' + weaponType + '.01.spectral.02.green', {softFail: true})?.file;
            if (!tokenImg) tokenImg = Sequencer.Database.getEntry('jb2a.spiritual_weapon.greatsword.01.spectral.02.green', {softFail: true})?.file;
        }
    }
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        range: 30,
        initiativeType: 'none',
        customIdentifier: 'dancingSword',
        additionalVaeButtons: [{
            type: 'use', 
            name: feature.name, 
            identifier: genericUtils.getIdentifier(workflow.item),
            activityIdentifier: 'dancingSwordAttack'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['dancingSwordAttack'],
            favorite: true
        }
    });
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'dancingSword');
    if (!effect) return;
    // This is stupied but workflow.activity doesn't have an up-to-date value at this point
    if (fromUuidSync(workflow.activity.uuid).uses.value) {
        let dancingActor = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0])?.actor;
        if (!dancingActor) return;
        let summonerEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'dancingSwordAttack');
        let summonedEffect = effectUtils.getEffectByIdentifier(dancingActor, 'dancingSwordAttack');
        if (summonerEffect) await genericUtils.remove(summonerEffect);
        if (summonedEffect) await genericUtils.remove(summonedEffect);
    } else {
        await genericUtils.remove(effect);
    }
}
async function early({activity, actor}) {
    let effect = effectUtils.getEffectByIdentifier(actor, 'dancingSword');
    if (!effect) return;
    let dancingActor = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0])?.actor;
    if (!dancingActor) return;

    let effectData = {
        name: activity.name,
        img: activity.item.img,
        origin: activity.item.uuid,
        changes: [
            {
                key: 'flags.midi-qol.rangeOverride.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    await effectUtils.createEffect(actor, effectData, {identifier: 'dancingSwordAttack', parentEntity: effect});
    await effectUtils.createEffect(dancingActor, effectData, {identifier: 'dancingSwordAttack', parentEntity: effect});
}
export let dancingSword = {
    name: 'Dancing Sword',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['dancingSwordAttack']
            },
            {
                pass: 'attackRollComplete',
                macro: late,
                priority: 50,
                activities: ['dancingSwordAttack']
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['dancingSwordToss']
            }
        ]
    }
};
let version = '1.1.0';
export let dancingSwordGreatsword = {
    name: 'Dancing Greatsword',
    version,
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingGreatsword',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingGreatsword',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingGreatsword',
            type: 'file',
            default: '',
            category: 'summons'
        }
    ]
};
export let dancingSwordLongsword = {
    name: 'Dancing Longsword',
    version,
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingLongsword',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingLongsword',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingLongsword',
            type: 'file',
            default: '',
            category: 'summons'
        }
    ]
};
export let dancingSwordRapier = {
    name: 'Dancing Rapier',
    version,
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingRapier',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingRapier',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingRapier',
            type: 'file',
            default: '',
            category: 'summons'
        }
    ]
};
export let dancingSwordScimitar = {
    name: 'Dancing Scimitar',
    version,
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingScimitar',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingScimitar',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingScimitar',
            type: 'file',
            default: '',
            category: 'summons'
        }
    ]
};
export let dancingSwordShortsword = {
    name: 'Dancing Shortsword',
    version,
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingShortsword',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingShortsword',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.DancingShortsword',
            type: 'file',
            default: '',
            category: 'summons'
        }
    ]
};
import {Summons} from '../../../lib/summons.js';
import {animationUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let originId = workflow.item.flags['chris-premades']?.equipment?.parent?.id;
    if (!originId) return;
    let originItem = workflow.actor.items.get(originId);
    if (!originItem) return;
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Dancing Sword');
    if (!sourceActor) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Dancing Sword: Attack', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.DancingSword.Attack', identifier: 'dancingSwordAttack'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.ability = originItem.system.ability;
    if (originItem.system.properties.has('fin') && workflow.actor.system.abilities.dex.mod > workflow.actor.system.abilities.str.mod && featureData.system.ability) featureData.system.ability = 'dex';
    featureData.system.damage.parts = originItem.system.damage.parts;
    featureData.img = originItem.img;
    let name = itemUtils.getConfig(originItem, 'name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.' + genericUtils.getIdentifier(originItem).replace('dancingSword','Dancing'));
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
    let avatarImg = itemUtils.getConfig(originItem, 'avatar');
    let tokenImg = itemUtils.getConfig(originItem, 'token');
    if (!tokenImg) {
        let weaponType = originItem.system.type?.baseItem;
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
        additionalVaeButtons: [{type: 'use', name: featureData.name, identifier: 'dancingSwordAttack'}]
    });
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'dancingSwordToss');
    if (!effect) return;
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect});
}
async function early({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'dancingSwordToss');
    if (!effect) return;
    let dancingActor = canvas.scene.tokens.get(effect.flags['chris-premades'].summons.ids[effect.name][0])?.actor;
    if (!dancingActor) return;

    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
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
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'dancingSwordAttack', parentEntity: effect});
    await effectUtils.createEffect(dancingActor, effectData, {identifier: 'dancingSwordAttack', parentEntity: effect});
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'dancingSwordToss');
    if (!effect) return;
    if (workflow.item.system.uses.value) {
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
export let dancingSword = {
    name: 'Dancing Sword',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    equipment: {
        dancingSwordToss: {
            name: 'Dancing Sword: Toss',
            compendium: 'itemEquipment',
            useJournal: true,
            translate: 'CHRISPREMADES.Macros.DancingSword.Toss'
        }
    }
};
export let dancingSwordToss = {
    name: 'Dancing Sword Toss',
    version: dancingSword.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
let version = '0.12.70';
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
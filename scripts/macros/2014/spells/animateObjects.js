import {Summons} from '../../../lib/summons.js';
import {compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let exit = async () => {if (concentrationEffect) await genericUtils.remove(concentrationEffect);};
    let baseCount = workflow.activity.target.affects.count || 10;
    let scaling = workflow.castData.scaling ?? 0;
    let totalSummons = Math.floor(baseCount + (scaling * 2));
    let actor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Animated Object');
    if (!actor) return await exit();
    let attackData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.summonFeatures, 'Slam (Animated Object)', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.AnimateObjects.Attack'});
    if (!attackData) return await exit();
    let weights = {};
    let compendiumDocs = [];
    let defaultName = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.AnimatedObject');
    for (let size of Object.keys(CONFIG.DND5E.actorSizes).filter(s => s !== 'grg')) {
        let s = CONFIG.DND5E.actorSizes[size];
        let number = s.numerical < 1 ? 1 : Math.pow(2, s.numerical - 1);
        let avatarImg = itemUtils.getConfig(workflow.item, 'avatar' + size);
        let tokenImg = itemUtils.getConfig(workflow.item, 'token' + size);
        weights[size] = number;
        compendiumDocs.push({
            name: `${s.label} (${genericUtils.format('DND5E.TARGET.Type.Object.Counted.' + (number > 1 ? 'other' : 'one'), {number})})`,
            summonName: itemUtils.getConfig(workflow.item, 'name' + size) || `${s.label} ${defaultName}`,
            img: tokenImg || avatarImg || 'icons/svg/mystery-man.svg',
            scale: s.dynamicTokenScale,
            width: s.token ?? 1,
            id: size,
            tokenImg,
            avatarImg
        });
    }
    let choices = await dialogUtils.selectDocumentsDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Summons.SelectSummons', {totalSummons}), compendiumDocs, {max: totalSummons, weights});
    if (choices?.length) choices = choices.filter(i => i.amount);
    if (!choices?.length) return await exit();
    let updates = [];
    choices.forEach(c => {
        let d = c.document;
        let token = {
            sight: {enabled: true},
            detectionModes: [
                {id: 'blindsight', range: 30, enabled: true},
                {id: 'lightPerception', range: 30, enabled: true}
            ],
            disposition: workflow.token.document.disposition,
            name: d.summonName,
            width: d.width,
            height: d.width
        };
        let update = {
            actor: {
                name: d.summonName
            }
        };
        if (d.avatarImg) update.actor.img = d.avatarImg;
        if (d.tokenImg) genericUtils.setProperty(token, 'texture.src', d.tokenImg);
        if (d.scale) {
            genericUtils.setProperty(token, 'texture.scaleX', d.scale);
            genericUtils.setProperty(token, 'texture.scaleY', d.scale);
        }
        genericUtils.setProperty(update, 'actor.system.traits.size', d.id);
        let data = getDataForSize(d.id);
        genericUtils.setProperty(update, 'actor.system.attributes.hp', {value: data.hp, max: data.hp});
        genericUtils.setProperty(update, 'actor.system.attributes.ac', {calc: 'custom', formula: data.ac});
        genericUtils.setProperty(update, 'actor.system.abilities.str.value', data.str);
        genericUtils.setProperty(update, 'actor.system.abilities.dex.value', data.dex);
        let attack = foundry.utils.duplicate(attackData);
        let activityIds = Object.keys(attack.system.activities);
        for (let id of activityIds) {
            if (attack.system.activities[id].type !== 'attack') continue;
            attack.system.activities[id].attack = {ability: data.ability, bonus: data.attack, flat: true};
            attack.system.activities[id].damage.parts[0].custom = {enabled: true, formula: data.damage};
            attack.system.activities[id].damage.includeBase = false;
        }
        update.actor.items = [attack];
        update.token = token;
        genericUtils.setProperty(update, 'actor.prototypeToken', token);
        for (let i = 0; i < c.amount; i++) updates.push(update);
    });
    await Summons.spawn(new Array(updates.length).fill(actor), updates, workflow.item, workflow.token, {
        animation: itemUtils.getConfig(workflow.item, 'animation') ?? 'none',
        duration: itemUtils.convertDuration(workflow.item)?.seconds ?? 60,
        range: workflow.activity.range.value ?? 120,
        initiativeType: 'follows'
    });
}
function getDataForSize(size) {
    switch(size) {
        case 'tiny': return {
            hp: 20,
            ac: 18,
            str: 4,
            dex: 18,
            attack: 8,
            ability: 'dex',
            damage: '1d4 + @mod[bludgeoning]'
        };
        case 'sm': return {
            hp: 25,
            ac: 16,
            str: 6,
            dex: 14,
            attack: 6,
            ability: 'dex',
            damage: '1d8 + @mod[bludgeoning]'
        };
        case 'med': return {
            hp: 40,
            ac: 13,
            str: 10,
            dex: 12,
            attack: 5,
            ability: 'dex',
            damage: '2d6 + @mod[bludgeoning]'
        };
        case 'lg': return {
            hp: 50,
            ac: 10,
            str: 14,
            dex: 10,
            attack: 6,
            ability: 'str',
            damage: '2d10 + @mod[bludgeoning]'
        };
        case 'huge': return {
            hp: 80,
            ac: 10,
            str: 18,
            dex: 6,
            attack: 8,
            ability: 'str',
            damage: '2d12 + @mod[bludgeoning]'
        };
    }
}
export let animateObjects = {
    name: 'Animate Objects',
    version: '1.5.35',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.Animation',
            type: 'select',
            default: 'none',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'nametiny',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectTiny',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'tokentiny',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectTiny',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatartiny',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectTiny',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'namesm',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectSmall',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'tokensm',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectSmall',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatarsm',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectSmall',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'namemed',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectMedium',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'tokenmed',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectMedium',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatarmed',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectMedium',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'namelg',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectLarge',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'tokenlg',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectLarge',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatarlg',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectLarge',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'namehuge',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectHuge',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'tokenhuge',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectHuge',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatarhuge',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.AnimatedObjectHuge',
            type: 'file',
            default: '',
            category: 'summons'
        }
    ]
};

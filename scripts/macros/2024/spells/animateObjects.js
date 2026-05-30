import {Summons} from '../../../lib/summons.js';
import {compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
async function use({workflow}) {
    let scaling = workflow.castData.scaling ?? 0;
    let casterData = workflow.actor.getRollData();
    let mod = casterData.attributes.spell.mod;
    if (mod < 1) return;
    let prof = casterData.attributes.prof;
    let flatAttack = [mod, prof, casterData.bonuses.msak.attack].filter(i => !!i).join(' + ');
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let exit = async () => {if (concentrationEffect) await genericUtils.remove(concentrationEffect);};
    let actor = await compendiumUtils.getActorFromCompendium(constants.modernPacks.summons, 'CPR - Animated Object');
    if (!actor) return await exit();
    let attackData = await compendiumUtils.getItemFromCompendium(constants.modernFeaturePacks.summonFeatures, 'Slam (Animated Object)', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.AnimateObjects.Attack', flatAttack});
    if (!attackData) return await exit();
    let weights = {};
    let compendiumDocs = [];
    let defaultName = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.AnimatedObject');
    for (let size of Object.keys(CONFIG.DND5E.actorSizes).filter(s => s !== 'grg')) {
        let s = CONFIG.DND5E.actorSizes[size];
        let number = s.numerical < 2 ? 1 : (s.numerical - 1);
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
    let choices = await dialogUtils.selectDocumentsDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Summons.SelectSummons', {totalSummons: mod}), compendiumDocs, {max: mod, weights});
    if (choices?.length) choices = choices.filter(i => i.amount);
    if (!choices?.length) return await exit();
    let updates = [];
    let proficiencyEffect = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.attributes.prof',
                mode: 5,
                value: prof,
                priority: 20
            }
        ]
    };
    choices.forEach(c => {
        let d = c.document;
        let token = {
            sight: {enabled: true},
            detectionModes: [{id: 'blindsight', range: 30, enabled: true}],
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
        let data = getDataForSize(d.id);
        genericUtils.setProperty(update, 'actor.system.traits.size', d.id);
        genericUtils.setProperty(update, 'actor.system.attributes.hp', {value: data.hp, max: data.hp});
        genericUtils.setProperty(update, 'actor.system.traits.languages.custom', casterData.traits.languages.custom);
        genericUtils.setProperty(update, 'actor.system.traits.languages.value', Array.from(casterData.traits.languages.value));
        let attack = foundry.utils.duplicate(attackData);
        let activityIds = Object.keys(attack.system.activities);
        for (let id of activityIds) {
            if (attack.system.activities[id].type !== 'attack') continue;
            attack.system.activities[id].damage.parts[0].number = data.number + scaling;
            attack.system.activities[id].damage.parts[0].denomination = data.faces;
            attack.system.activities[id].damage.parts[0].bonus += data.bonus ? (' + ' + mod) : '';
            attack.system.activities[id].damage.includeBase = false;
        }
        update.actor.items = [attack];
        update.actor.effects = [proficiencyEffect];
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
        case 'tiny':
        case 'sm':
        case 'med': return {
            hp: 10,
            number: 1,
            faces: 4
        };
        case 'lg': return {
            hp: 20,
            number: 2,
            faces: 6,
            bonus: true
        };
        case 'huge': return {
            hp: 40,
            number: 2,
            faces: 12,
            bonus: true
        };
    }
}
export let animateObjects = {
    name: 'Animate Objects',
    version: '1.5.35',
    rules: 'modern',
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

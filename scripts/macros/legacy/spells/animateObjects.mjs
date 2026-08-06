import {automationUtils, compendiumUtils, summonUtils, activityUtils, effectUtils, itemUtils, dialogUtils, documentUtils, genericUtils, actorUtils} from '../../../proxy.mjs';
async function use({document, workflow, castData}) {
    console.log('Animate Objects Macro');
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const exit = async () => {if (concentrationEffect) await documentUtils.deleteDocument(concentrationEffect);};
    const baseCount = workflow.activity.target.affects.count ?? 10;
    const scaling = castData.scaling ?? 0;
    const totalSummons = Math.floor(baseCount + (scaling * 2));
    const sourceActor = await compendiumUtils.getDocumentByIdentifier('chris-premades.CPRSummons2014', 'animatedObject');
    if (!sourceActor) return await exit();
    const description = automationUtils.getConfigValue(workflow.item, 'slamDescription');
    const translate = 'CHRISPREMADES.Macros.Legacy.AnimateObjects.SlamName';
    const attackData = await compendiumUtils.getDocumentByIdentifier('chris-premades.CPRFeatures2014', 'animate-objects-slam', {object: true, description, translate});
    console.log(attackData);
    if (!attackData) return await exit();
    const weights = {};
    const documents = [];
    const defaultName = _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName');
    for (const size of Object.keys(CONFIG.DND5E.actorSizes).filter(s => s !== 'grg')) {
        const s = CONFIG.DND5E.actorSizes[size];
        const number = s.numerical < 1 ? 1 : Math.pow(2, s.numerical - 1);
        const avatarImg = automationUtils.getConfigValue(workflow.item, 'avatar' + size);
        const tokenImg = automationUtils.getConfigValue(workflow.item, 'token' + size);
        weights[size] = number;
        documents.push({
            name: `${s.label} (${_loc('DND5E.TARGET.Type.Object.Counted.' + (number > 1 ? 'other' : 'one'), {number})})`,
            summonName: automationUtils.getConfigValue(workflow.item, 'name' + size) || `${s.label} ${defaultName}`,
            img: tokenImg ?? avatarImg ?? 'icons/svg/mystery-man.svg',
            id: size,
            tokenImg,
            avatarImg
        });
    }
    console.log(documents);
    const choices = await dialogUtils.selectDocumentDialog(
        document.item.name,
        _loc('CHRISPREMADES.Summons.SelectSummons', {max: totalSummons}),
        documents,
        {max: totalSummons, weights}
    );
    console.log(choices);
    if (!choices?.length) return await exit();
    const summonsData = [];
    const animation = automationUtils.getConfigValue(workflow.item, 'animation') ?? 'none';
    choices.filter(i => i.amount).forEach(c => {
        const sizeData = getDataForSize(c.key);
        const activityIds = Object.keys(attackData.system.activities);
        for (const id of activityIds) {
            if (attackData.system.activities[id].type !== 'attack') continue;
            attackData.system.activities[id].attack = {ability: sizeData.ability, bonus: sizeData.attack, flat: true};
            attackData.system.activities[id].damage.parts[0].custom = {enabled: true, formula: sizeData.damage};
            attackData.system.activities[id].damage.includeBase = false;
        }
        const actorUpdates = {
            system: {
                attributes: {
                    hp: {value: sizeData.hp, max: sizeData.hp},
                    ac: {calc: 'custom', formula: sizeData.ac}
                },
                abilities: {
                    str: {value: sizeData.str},
                    dex: {value: sizeData.dex}
                }
            },
            items: [attackData]
        };
        console.log(actorUpdates);
        const data = {
            sourceActor, 
            name: c.document.summonName, 
            avatarImg: c.document.avatarImg, 
            tokenImg: c.document.tokenImg, 
            animation,
            initiative: 'follows',
            updates: actorUpdates,
            size: c.key
        };
        for (let i = 0; i < c.amount; i++) summonsData.push(data);
    });
    /** await Summons.spawn(new Array(updates.length).fill(actor), updates, workflow.item, workflow.token, {
        animation: automationUtils.getConfigValue(workflow.item, 'animation') ?? 'none',
        duration: itemUtils.convertDuration(workflow.item)?.seconds ?? 60,
        range: workflow.activity.range.value ?? 120,
        initiativeType: 'follows'
    });*/
    const summons = await Promise.all(summonsData.map(async summonData => {
        const {sourceActor, name, avatarImg, tokenImg, animation, initiative, updates, size} = summonData;
        return await summonUtils.createSummon(workflow.actor, sourceActor, {avatarImg, tokenImg, name, animation, sourceDocument: document, initiative, disposition: workflow.token.document.disposition, parent: concentrationEffect, updates, size});
    }));
    if (!summons.length) return;
    const otherActivities = ['animate-objects-command'];
    await itemUtils.unhideActivities(document.item, otherActivities);
    if (workflow.token) await summonUtils.placeSummons(summons, document.range.value, {token: workflow.token.document});
}
async function summonDelete({document, summon}) {
    console.log('delete');
    const summons = summonUtils.getSummonBySource(document).filter(i => i !== summon);
    if (summons.length) return;
    const otherActivities = ['animate-objects-command'];
    await itemUtils.rehideActivities(document.item, otherActivities);
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
export const animateObjects = {
    version: '2.0.2',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    summon: [
        {
            pass: 'delete',
            macro: summonDelete,
            priority: 50
        }
    ],
    get config() {return {
        animation: {
            default: {source: 'chris-premades', identifier: 'defaultSummon'}, 
            type: 'selectAnimation', 
            inputs: ['summon', 'location', 'token'], 
            label: 'CHRISPREMADES.Config.Animation', 
            category: 'animations'
        },
        slamDescription: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Config.SlamDescription',
            category: 'summons'
        },
        nametiny: {
            label: 'CHRISPREMADES.Config.CustomName',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.tiny.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'text',
            default: '',
            category: 'summons'
        },
        tokentiny: {
            label: 'CHRISPREMADES.Config.CustomToken',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.tiny.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'file',
            default: '',
            category: 'summons'
        },
        avatartiny: {
            label: 'CHRISPREMADES.Config.CustomAvatar',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.tiny.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'file',
            default: '',
            category: 'summons'
        },
        namesm: {
            label: 'CHRISPREMADES.Config.CustomName',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.sm.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'text',
            default: '',
            category: 'summons'
        },
        tokensm: {
            label: 'CHRISPREMADES.Config.CustomToken',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.sm.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'file',
            default: '',
            category: 'summons'
        },
        avatarsm: {
            label: 'CHRISPREMADES.Config.CustomAvatar',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.sm.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'file',
            default: '',
            category: 'summons'
        },
        namemed: {
            label: 'CHRISPREMADES.Config.CustomName',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.med.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'text',
            default: '',
            category: 'summons'
        },
        tokenmed: {
            label: 'CHRISPREMADES.Config.CustomToken',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.med.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'file',
            default: '',
            category: 'summons'
        },
        avatarmed: {
            value: 'avatarmed',
            label: 'CHRISPREMADES.Config.CustomAvatar',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.med.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'file',
            default: '',
            category: 'summons'
        },
        namelg: {
            label: 'CHRISPREMADES.Config.CustomName',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.lg.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'text',
            default: '',
            category: 'summons'
        },
        tokenlg: {
            label: 'CHRISPREMADES.Config.CustomToken',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.lg.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'file',
            default: '',
            category: 'summons'
        },
        avatarlg: {
            label: 'CHRISPREMADES.Config.CustomAvatar',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.lg.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'file',
            default: '',
            category: 'summons'
        },
        namehuge: {
            label: 'CHRISPREMADES.Config.CustomName',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.huge.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'text',
            default: '',
            category: 'summons'
        },
        tokenhuge: {
            label: 'CHRISPREMADES.Config.CustomToken',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.huge.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'file',
            default: '',
            category: 'summons'
        },
        avatarhuge: {
            label: 'CHRISPREMADES.Config.CustomAvatar',
            i18nOption: _loc('CHRISPREMADES.Generic.CreatureNameAndSize', {size: CONFIG.DND5E.actorSizes.huge.label, name: _loc('CHRISPREMADES.Macros.Legacy.AnimateObjects.SummonName')}),
            type: 'file',
            default: '',
            category: 'summons'
        }
    };}
};
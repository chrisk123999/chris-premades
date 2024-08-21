import {Summons} from '../../lib/summons.js';
import {Teleport} from '../../lib/teleport.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Fey Spirit');
    if (!sourceActor) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let spellLevel = workflow.castData.castLevel;
    let creatureButtons = [
        ['CHRISPREMADES.Macros.SummonFey.Fuming', 'fuming'],
        ['CHRISPREMADES.Macros.SummonFey.Mirthful', 'mirthful'],
        ['CHRISPREMADES.Macros.SummonFey.Tricksy', 'tricksy']
    ];
    let creatureType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.SummonFey.Type', creatureButtons);
    if (!creatureType) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let numAttacks = Math.floor(spellLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Fey Spirit)', {}, workflow.item, {translate: genericUtils.format('CHRISPREMADES.CommonFeatures.Multiattack', {numAttacks}), identifier: 'summonFeyMultiattack'});
    let shortswordFeatureData = await Summons.getSummonItem('Shortsword (Fey Spirit)', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonFey.Shortsword', identifier: 'summonFeyShortsword', flatAttack: true, damageBonus: spellLevel});
    let feyStepFeatureData = await Summons.getSummonItem('Fey Step (Fey Spirit)', {
        'flags.chris-premades.config.useRealDarkness': itemUtils.getConfig(workflow.item, 'useRealDarkness'),
        'flags.chris-premades.config.darknessAnimation': itemUtils.getConfig(workflow.item, 'darknessAnimation')
    }, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonFey.FeyStep', identifier: 'summonFeyFeyStep'});
    if (!multiAttackFeatureData || !shortswordFeatureData || !feyStepFeatureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let name = itemUtils.getConfig(workflow.item, creatureType + 'Name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.FeySpirit' + creatureType.capitalize());
    let hpFormula = 30 + ((spellLevel - 3) * 10);
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                attributes: {
                    ac: {
                        flat: 12 + spellLevel
                    },
                    hp: {
                        formula: hpFormula,
                        max: hpFormula,
                        value: hpFormula
                    }
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: [multiAttackFeatureData, shortswordFeatureData, feyStepFeatureData]
        },
        token: {
            name,
            disposition: workflow.token.document.disposition
        }
    };
    let avatarImg = itemUtils.getConfig(workflow.item, creatureType + 'Avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, creatureType + 'Token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let moodFeatureData = await Summons.getSummonItem(creatureType.capitalize(), {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SummonFey.' + creatureType.capitalize(), flatDC: creatureType === 'mirthful', identifier: 'summonFey' + creatureType.capitalize()});
    if (!moodFeatureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    updates.actor.items.push(moodFeatureData);
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 3600,
        range: 90,
        animation,
        initiativeType: 'follows',
        additionalSummonVaeButtons: [multiAttackFeatureData, shortswordFeatureData, feyStepFeatureData].map(i => {return {type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier};})
    });
}
async function late({workflow}) {
    await Teleport.target([workflow.token], workflow.token, {range: 30, animation: 'mistyStep'});
    let fumingItem = itemUtils.getItemByIdentifier(workflow.actor, 'summonFeyFuming');
    let mirthfulItem = itemUtils.getItemByIdentifier(workflow.actor, 'summonFeyMirthful');
    let tricksyItem = itemUtils.getItemByIdentifier(workflow.actor, 'summonFeyTricksy');
    if (fumingItem) {
        await workflowUtils.completeItemUse(fumingItem);
    } else if (mirthfulItem) {
        let nearbyTargets = tokenUtils.findNearby(workflow.token, 10, 'enemy');
        if (!nearbyTargets.length) return;
        let targetSelect = await dialogUtils.selectTargetDialog(workflow.item.name + ': ' + mirthfulItem.name, 'CHRISPREMADES.Macros.SummonFey.Select', nearbyTargets);
        if (!targetSelect?.length) return;
        await workflowUtils.syntheticItemRoll(mirthfulItem, [targetSelect[0]]);
    } else if (tricksyItem) {
        let tricksyWorkflow = await workflowUtils.syntheticItemRoll(tricksyItem, []);
        let template = tricksyWorkflow.template;
        if (!template) return;
        await genericUtils.update(template, {
            flags: {
                'chris-premades': {
                    template: {
                        name: workflow.item.name + ': ' + tricksyItem.name,
                        visibility: {
                            obscured: true,
                            magicalDarkness: true
                        }
                    }
                }
            }
        });
        let effect = workflow.actor.effects.find(i => i.flags?.dnd5e?.dependents?.map(j => j.uuid)?.includes(template.uuid));
        if (effect) await genericUtils.update(effect, {'duration.turns': 1});
        if (itemUtils.getConfig(workflow.item, 'useRealDarkness')) {
            let offset = (template.width / 2) * canvas.grid.size / canvas.grid.distance;
            let darknessSourceArr = await genericUtils.createEmbeddedDocuments(template.parent, 'AmbientLight', [{config: {negative: true, dim: template.width / 2, animation: {type: itemUtils.getConfig(workflow.item, 'darknessAnimation')}}, x: template.object.center.x + offset, y: template.object.center.y + offset}]);
            effectUtils.addDependent(template, darknessSourceArr);
        }
    }
}
export let summonFey = {
    name: 'Summon Fey',
    version: '0.12.11',
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
            value: 'fumingName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeySpiritFuming',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'mirthfulName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeySpiritMirthful',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'tricksyName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeySpiritTricksy',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'fumingToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeySpiritFuming',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'mirthfulToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeySpiritMirthful',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'tricksyToken',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeySpiritTricksy',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'fumingAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeySpiritFuming',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'mirthfulAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeySpiritMirthful',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'tricksyAvatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FeySpiritTricksy',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'fumingAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonFey.Fuming',
            type: 'select',
            default: 'nature',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'mirthfulAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonFey.Mirthful',
            type: 'select',
            default: 'nature',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'tricksyAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Macros.SummonFey.Tricksy',
            type: 'select',
            default: 'nature',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'useRealDarkness',
            label: 'CHRISPREMADES.Config.RealDarkness',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        },
        {
            value: 'darknessAnimation',
            label: 'CHRISPREMADES.Config.DarknessAnimation',
            type: 'select',
            default: null,
            options: [
                {
                    label: 'DND5E.None',
                    value: null
                },
                ...Object.entries(CONFIG.Canvas.darknessAnimations).flatMap(i => ({label: i[1].label, value: i[0]}))
            ],
            category: 'mechanics'
        }
    ]
};
export let summonFeyFeyStep = {
    name: 'Summon Fey: Fey Step',
    version: summonFey.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};
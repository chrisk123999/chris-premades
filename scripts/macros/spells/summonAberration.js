import {Summons} from '../../lib/summons.js';
import {dialogUtils, actorUtils, itemUtils, animationUtils, effectUtils, genericUtils, tokenUtils, compendiumUtils, constants, workflowUtils} from '../../utils.js';
async function use({speaker, actor, token, character, item, args, scope, workflow}){
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPPREMADES.Summons.SelectSummonType', [
        ['CHRISPREMADES.Macros.SummonAberration.Beholderkin', 'beholderkin'], 
        ['CHRISPREMADES.Macros.SummonAberration.Slaad', 'slaad'], 
        ['CHRISPREMADES.Macros.SummonAberration.StarSpawn', 'starspawn']]);
    if (!selection) return;
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Aberrant Spirit');
    if (!sourceActor) return;
    let attacks = Math.floor(workflow.castData.castLevel / 2);
    let multiAttackFeatureData = await Summons.getSummonItem('Multiattack (Aberrant Spirit)', {name: 'Multiattack (' + attacks + ' Attacks)'}, workflow.item);
    if (!multiAttackFeatureData) return;
    let hpFormula = 40 + ((workflow.castData.castLevel - 4) * 10);
    let name = itemUtils.getConfiguration(workflow.item, 'name-' + selection) ?? 'Aberrant Spirit (' + selection + ')';
    if (name === '') name = 'Aberrant Spirit (' + selection + ')';
    let updates = {
        'actor': {
            'name': name,
            'system': {
                'details': {
                    'cr': actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                'attributes': {
                    'ac': {
                        'flat': 11 + workflow.castData.castLevel
                    },
                    'hp': {
                        'formula': hpFormula,
                        'max': hpFormula,
                        'value': hpFormula
                    }
                }
            },
            'prototypeToken': {
                'name': name,
                'disposition': workflow.token.document.disposition
            },
            'items': [multiAttackFeatureData]
        },
        'token': {
            'name': name,
            'disposition': workflow.token.document.disposition
        }
    };
    let avatarImg = item.getConfiguration(workflow.item, 'avatar-' + selection);
    let tokenImg = item.getConfiguration(workflow.item, 'token-' + selection);
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    switch (selection) {
        case 'beholderkin': {
            let eyeRayData = await Summons.getSummonItem('Eye Ray (Beholderkin Only)', {}, workflow.item, ({flatAttack: true, damageBonus: workflow.castData.castLevel}));
            updates.actor.items.push(eyeRayData);
            updates.actor.system.attributes.movement = {
                'walk': 30,
                'fly': 30,
                'hover': true
            };
            break;
        }
        case 'slaad': {
            let clawsData = await Summons.getSummonItem('Claws (Slaad Only)', {}, workflow.item, ({flatAttack: true, damageBonus: workflow.castData.castLevel}));
            if (!clawsData) return;
            updates.actor.items.push(clawsData);
            let regenerationData = await Summons.getSummonItem('Regeneration (Slaad Only)', {}, workflow.item);
            if (!regenerationData) return;
            updates.actor.items.push(regenerationData);
            break;
        }
        case 'starspawn': {
            let slamData = await Summons.getSummonItem('Psychic Slam (Star Spawn Only)', {}, workflow.item, ({flatAttack: true, damageBonus: workflow.castData.castLevel}));
            if (!slamData) return;
            updates.actor.items.push(slamData);
            let auraData = await Summons.getSummonItem('Whispering Aura (Star Spawn Only)', {}, workflow.item, ({flatDC: true}));
            if (!auraData) return;
            updates.actor.items.push(auraData);
            genericUtils.setProperty(updates, 'actor.flags.chris-premades.castData', workflow.castData);
            genericUtils.setProperty(updates, 'actor.flags.chris-premades.castData.saveDC', itemUtils.getSaveDC(workflow.item));
            break;
        }
    }
    let animation = itemUtils.getConfiguration(workflow.item, 'animation-' + selection) ?? 'shadow';
    if (animationUtils.jb2aCheck() != 'patreon' || !animationUtils.aseCheck()) animation = 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {duration: 3600, range: 90, animation: animation});
}
async function whisperingAura({trigger}) {
    await trigger.document.use();
}
export let summonAberration = {
    name: 'Summon Aberration',
    version: '0.12.0',
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
            value: 'name-beholderkin',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Beholderkin',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'name-slaad',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Slaad',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'name-starspawn',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.StarSpawn',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token-beholderkin',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Beholderkin',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'token-slaad',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Slaad',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'token-starspawn',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.StarSpawn',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar-beholderkin',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Beholderkin',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar-slaad',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.Slaad',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar-starspawn',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Macros.SummonAberration.StarSpawn',
            type: 'file',
            default: '',
            category: 'summons'
        }
    ]
};
export let summonAberrationWhisperingAura = {
    name: 'Whispering Aura',
    version: summonAberration.version,
    combat: [
        {
            pass: 'turnStart',
            macro: whisperingAura,
            priority: 50
        }
    ]
};
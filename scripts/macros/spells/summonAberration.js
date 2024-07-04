import {Summons} from '../../lib/summons.js';
import {dialogUtils, actorUtils, itemUtils, animationUtils, effectUtils} from '../../utils.js';
async function use({speaker, actor, token, character, item, args, scope, workflow}){
    let selection = await dialogUtils.dialog('What type?', [['Beholderkin', 'Beholderkin'], ['Slaad', 'Slaad'], ['Star Spawn', 'Star Spawn']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Aberrant Spirit');
    if (!sourceActor) return;
    // import summon function
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
        case 'Beholderkin': {
            let eyeRayData = await Summons.getSummonItem('Eye Ray (Beholderkin Only)', {}, workflow.item, ({flatAttack: true, damageBonus: workflow.castData.castLevel}));
            updates.actor.items.push(eyeRayData);
            updates.actor.system.attributes.movement = {
                'walk': 30,
                'fly': 30,
                'hover': true
            };
            break;
        }
        case 'Slaad': {
            let clawsData = await Summons.getSummonItem('Claws (Slaad Only)', {}, workflow.item, ({flatAttack: true, damageBonus: workflow.castData.castLevel}));
            if (!clawsData) return;
            updates.actor.items.push(clawsData);
            let regenerationData = await Summons.getSummonItem('Regeneration (Slaad Only)', {}, workflow.item);
            if (!regenerationData) return;
            updates.actor.items.push(regenerationData);
            break;
        }
        case 'Star Spawn': {
            let slamData = await Summons.getSummonItem('Psychic Slam (Star Spawn Only)', {}, workflow.item, ({flatAttack: true, damageBonus: workflow.castData.castLevel}));
            if (!slamData) return;
            updates.actor.items.push(slamData);
            let auraData = await Summons.getSummonItem('Whispering Aura (Star Spawn Only)', {}, workflow.item, ({flatDC: true}));
            if (!auraData) return;
            updates.actor.items.push(auraData);
            break;
        }
    }
    let animation = itemUtils.getConfiguration(workflow.item, 'animation-' + selection) ?? 'shadow';
    if (animationUtils.jb2aCheck() != 'patreon' || !animationUtils.aseCheck()) animation = 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {duration: 3600, range: 90, animation: animation});
}
async function whisperingAura(actor, origin) {
    let incapacitatedEffect = effectUtils.getEffectByStatusID(actor, 'incapacitated');
    if (incapacitatedEffect) return;
    let hp = actor.system.attributes.hp.value;
    if (!hp) return;
    await origin.use();
}
export let summonAberration = {
    name: 'Spirit Guardians',
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
            i18nOption: 'CHRISPREMADES.Macro.Spell.SummonAberration.Beholderkin',
            type: 'text',
            default: 'Beholderkin',
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
            priority: 50,
            distance: 15,
            disposition: 'enemy'
        }
    ]
};
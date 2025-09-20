import {Summons} from '../../../../../lib/summons.js';
import {activityUtils, actorUtils, animationUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
import {arcaneJoltHelper} from './arcaneJolt.js';

async function use({workflow}) {
    let sourceActor = await compendiumUtils.getActorFromCompendium(constants.packs.summons, 'CPR - Steel Defender');
    if (!sourceActor) return;
    let deflectAttackData = await Summons.getSummonItem('Deflect Attack', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SteelDefender.DeflectAttack', identifier: 'steelDefenderDeflectAttack'});
    let rendData = await Summons.getSummonItem('Force-Empowered Rend', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SteelDefender.ForceEmpoweredRend', identifier: 'steelDefenderForceEmpoweredRend', flatAttack: true});
    let mendingData = await Summons.getSummonItem('Mending (Steel Defender)', {}, workflow.item, {translate: 'CHRISPREMADES.CommonFeatures.Mending', identifier: 'steelDefenderMending'});
    let repairData = await Summons.getSummonItem('Repair', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SteelDefender.Repair', identifier: 'steelDefenderRepair'});
    let vigilantData = await Summons.getSummonItem('Vigilant', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.SteelDefender.Vigilant', identifier: 'steelDefenderVigilant'});
    let dodgeData = await compendiumUtils.getItemFromCompendium(constants.packs.actions, 'Dodge', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Actions.Dodge', identifier: 'steelDefenderDodge'});
    let itemsToAdd = [deflectAttackData, rendData, mendingData, repairData, vigilantData, dodgeData];
    if (!itemsToAdd.every(i => i)) return;
    let classLevel = workflow.actor.classes?.artificer?.system.levels;
    if (!classLevel) return;
    let repairUses = workflow.item.flags['chris-premades']?.steelDefenderRepair?.spent;
    if (isNaN(repairUses)) await genericUtils.setFlag(workflow.item, 'chris-premades', 'steelDefenderRepair.spent', 0);
    repairData.system.uses.spent = repairUses;
    let hpValue = 2 + workflow.actor.system.abilities.int.mod + 5 * classLevel;
    let name = itemUtils.getConfig(workflow.item, 'name');
    if (!name?.length) name = genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.SteelDefender');
    let updates = {
        actor: {
            name,
            system: {
                details: {
                    cr: actorUtils.getCRFromProf(workflow.actor.system.attributes.prof)
                },
                attributes: {
                    hp: {
                        formula: hpValue,
                        max: hpValue,
                        value: hpValue
                    }
                },
                traits: {
                    languages: workflow.actor.system?.traits?.languages
                }
            },
            prototypeToken: {
                name,
                disposition: workflow.token.document.disposition
            },
            items: itemsToAdd
        },
        token: {
            name,
            disposition: workflow.token.document.disposition
        }
    };
    let originArcaneJolt = itemUtils.getItemByIdentifier(workflow.actor, 'arcaneJolt');
    if (originArcaneJolt) {
        let effectData = {
            name: originArcaneJolt.name,
            img: originArcaneJolt.img,
            origin: originArcaneJolt.uuid,
            flags: {
                'chris-premades': {
                    info: {
                        identifier: 'steelDefenderArcaneJolt'
                    }
                }
            }
        };
        effectUtils.addMacro(effectData, 'midi.actor', ['steelDefenderArcaneJolt']);
        updates.actor.effects = [effectData];
    }
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        genericUtils.setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates, 'token.texture.src', tokenImg);
    }
    let deflectActivityId = Object.keys(updates.actor.items[0].system.activities)[0];
    if (classLevel > 14) {
        updates.actor.system.attributes.ac = {flat: 17};
        updates.actor.items[0].system.activities[deflectActivityId].damage.parts[0].formula = '1d4[force] + ' + workflow.actor.system.abilities.int.mod;
    } else {
        updates.actor.items[0].system.activities[deflectActivityId].damage.parts = [];
    }
    let animation = itemUtils.getConfig(workflow.item, 'animation') ?? 'none';
    let commandFeature = activityUtils.getActivityByIdentifier(workflow.item, 'steelDefenderCommand', {strict: true});
    if (!commandFeature) return;
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        range: 10,
        animation,
        initiativeType: 'follows',
        additionalVaeButtons: [{
            type: 'use', 
            name: commandFeature.name, 
            identifier: 'steelDefender', 
            activityIdentifier: 'steelDefenderCommand'
        }],
        additionalSummonVaeButtons: 
            itemsToAdd
                .filter(i => ['steelDefenderForceEmpoweredRend', 'steelDefenderRepair', 'steelDefenderDodge'].includes(i.flags['chris-premades'].info.identifier))
                .map(i => ({type: 'use', name: i.name, identifier: i.flags['chris-premades'].info.identifier})),
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['steelDefenderCommand'],
            favorite: true
        }
    });
}
async function arcaneJolt({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'steelDefenderArcaneJolt');
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem || originItem.system.uses.value === 0) return;
    if (!combatUtils.perTurnCheck(originItem, 'arcaneJolt')) return;
    await arcaneJoltHelper(workflow, originItem);
}
async function early({trigger: {entity: item, token}, workflow}) {
    if (workflow.token.document.disposition === token.document.disposition) return;
    if (actorUtils.hasUsedReaction(token.actor)) return;
    if (workflow.targets.has(token)) return;
    if (tokenUtils.getDistance(token, workflow.token, {wallsBlock: true}) > genericUtils.handleMetric(5)) return;
    if (!tokenUtils.canSee(token, workflow.token)) return;
    let selection = await dialogUtils.confirm(token.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), {userId: socketUtils.firstOwner(item.parent, true)});
    if (!selection) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Disadvantage') + ': ' + item.name);
    await workflowUtils.syntheticItemRoll(item, [workflow.token]);
}
async function longRest({trigger: {entity: item}}) {
    await genericUtils.setFlag(item, 'chris-premades', 'steelDefenderRepair.spent', 0);
}
async function repair({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'summonedEffect');
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    await genericUtils.setFlag(originItem, 'chris-premades', 'steelDefenderRepair.spent', workflow.item.system.uses.spent);
}
export let steelDefender = {
    name: 'Steel Defender',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['steelDefender']
            }
        ]
    },
    rest: [
        {
            pass: 'long',
            macro: longRest,
            priority: 50
        }
    ],
    config: [
        {
            value: 'name',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SteelDefender',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SteelDefender',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SteelDefender',
            type: 'file',
            default: '',
            category: 'summons'
        },
        {
            value: 'animation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.SteelDefender',
            type: 'text',
            default: 'default',
            category: 'animation',
            options: constants.summonAnimationOptions
        }
    ],
    ddbi: {
        correctedItems: {
            'Steel Defender': {
                system: {
                    uses: {
                        max: 1,
                        per: 'lr',
                        recovery: '',
                        value: 1
                    }
                }
            }
        }
    }
};
export let steelDefenderArcaneJolt = {
    name: 'Steel Defender: Arcane Jolt',
    version: steelDefender.version,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: arcaneJolt,
                priority: 50
            }
        ]
    }
};
export let steelDefenderDeflectAttack = {
    name: 'Steel Defender: Deflect Attack',
    version: steelDefender.version,
    midi: {
        actor: [
            {
                pass: 'scenePreambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};
export let steelDefenderRepair = {
    name: 'Steel Defender: Repair',
    version: steelDefender.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: repair,
                priority: 50
            }
        ]
    }
};
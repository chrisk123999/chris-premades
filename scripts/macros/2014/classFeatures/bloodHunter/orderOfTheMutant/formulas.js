import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let positiveEffectData = {
        name: workflow.item.name + ': ' + genericUtils.translate('CHRISPREMADES.Macros.Mutagencraft.Positive'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'longRest',
                    'shortRest'
                ]
            }
        }
    };
    let negativeEffectData = {
        name: workflow.item.name + ': ' + genericUtils.translate('CHRISPREMADES.Macros.Mutagencraft.Negative'),
        img: workflow.item.img,
        origin: workflow.item.uuid
    };
    let flushData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Mutagencraft: Flush Mutagens', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Mutagencraft.Flush', identifier: 'flushMutagens'});
    if (!flushData) {
        errors.missingPackItem();
        return;
    }
    let classLevel = workflow.actor.classes?.['blood-hunter']?.system.levels ?? 0;
    let identifier = genericUtils.getIdentifier(workflow.item);
    switch (identifier) {
        case 'formulaAether':
            positiveEffectData.changes = [
                {
                    key: 'system.attributes.movement.fly',
                    mode: 4,
                    value: genericUtils.handleMetric(20),
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.check.str',
                    mode: 0,
                    value: 1,
                    priority: 20
                },
                {
                    key: 'flags.midi-qol.disadvantage.ability.check.dex',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            positiveEffectData.duration = itemUtils.convertDuration(workflow.activity);
            negativeEffectData.duration = itemUtils.convertDuration(workflow.activity);
            break;
        case 'formulaAlluring':
            positiveEffectData.changes = [
                {
                    key: 'flags.midi-qol.advantage.ability.check.cha',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'flags.dnd5e.flags.dnd5e.initiativeDisadv',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        case 'formulaCelerity':
            positiveEffectData.changes = [
                {
                    key: 'system.abilities.dex.value',
                    mode: 2,
                    value: classLevel >= 18 ? 5 : (classLevel >= 11 ? 4 : 3),
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.wis',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        case 'formulaConversant':
            positiveEffectData.changes = [
                {
                    key: 'flags.midi-qol.advantage.ability.check.int',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.check.wis',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        case 'formulaCruelty':
            positiveEffectData.changes = [];
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.int',
                    mode: 0,
                    value: 1,
                    priority: 20
                },
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.wis',
                    mode: 0,
                    value: 1,
                    priority: 20
                },
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.cha',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        case 'formulaDeftness':
            positiveEffectData.changes = [
                {
                    key: 'flags.midi-qol.advantage.ability.check.dex',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.check.wis',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        case 'formulaEmbers':
            positiveEffectData.changes = [
                {
                    key: 'system.traits.dr.value',
                    mode: 2,
                    value: 'fire',
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'system.traits.dv.value',
                    mode: 2,
                    value: 'cold',
                    priority: 20
                }
            ];
            break;
        case 'formulaGelid':
            positiveEffectData.changes = [
                {
                    key: 'system.traits.dr.value',
                    mode: 2,
                    value: 'cold',
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'system.traits.dv.value',
                    mode: 2,
                    value: 'fire',
                    priority: 20
                }
            ];
            break;
        case 'formulaImpermeable':
            positiveEffectData.changes = [
                {
                    key: 'system.traits.dr.value',
                    mode: 2,
                    value: 'piercing',
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'system.traits.dv.value',
                    mode: 2,
                    value: 'slashing',
                    priority: 20
                }
            ];
            break;
        case 'formulaMobility':
            positiveEffectData.changes = [
                {
                    key: 'system.traits.ci.value',
                    mode: 2,
                    value: 'grappled',
                    priority: 20
                },
                {
                    key: 'system.traits.ci.value',
                    mode: 2,
                    value: 'restrained',
                    priority: 20
                }
            ];
            if (classLevel >= 11) positiveEffectData.changes.push(
                {
                    key: 'system.traits.ci.value',
                    mode: 2,
                    value: 'paralyzed',
                    priority: 20
                }
            );
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.check.str',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        case 'formulaNighteye':
            positiveEffectData.changes = [
                {
                    key: 'system.attributes.senses.darkvision',
                    mode: 4,
                    value: (workflow.actor.system.attributes.senses.darkvision ?? 0) + 60,
                    priority: 30
                },
                {
                    key: 'ATL.sight.range',
                    mode: 2,
                    value: (workflow.actor.system.attributes.senses.darkvision ?? 0) + 60,
                    priority: 20
                }
            ];
            negativeEffectData.changes = [];
            effectUtils.addMacro(negativeEffectData, 'midi.actor', ['formulaNighteye']);
            effectUtils.addMacro(positiveEffectData, 'skill', ['formulaNighteye']);
            break;
        case 'formulaPercipient':
            positiveEffectData.changes = [
                {
                    key: 'flags.midi-qol.advantage.ability.check.wis',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.check.cha',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        case 'formulaPotency':
            positiveEffectData.changes = [
                {
                    key: 'system.abilities.str.value',
                    mode: 2,
                    value: classLevel >= 18 ? 5 : (classLevel >= 11 ? 4 : 3),
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.dex',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        case 'formulaPrecision':
            positiveEffectData.changes = [
                {
                    key: 'flags.dnd5e.weaponCriticalThreshold',
                    mode: 5,
                    value: 19,
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.str',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        case 'formulaRapidity':
            positiveEffectData.changes = [
                {
                    key: 'system.attributes.movement.all',
                    mode: 0,
                    value: '+' + (classLevel >= 15 ? genericUtils.handleMetric(15) : genericUtils.handleMetric(10)).toString(),
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.check.int',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        case 'formulaReconstruction':
            positiveEffectData.changes = [];
            effectUtils.addMacro(positiveEffectData, 'combat', ['formulaReconstruction']);
            negativeEffectData.changes = [
                {
                    key: 'system.attributes.movement.all',
                    mode: 0,
                    value: '-10',
                    priority: 20
                }
            ];
            positiveEffectData.duration = itemUtils.convertDuration(workflow.activity);
            negativeEffectData.duration = itemUtils.convertDuration(workflow.activity);
            break;
        case 'formulaSagacity':
            positiveEffectData.changes = [
                {
                    key: 'system.abilities.int.value',
                    mode: 2,
                    value: classLevel >= 18 ? 5 : (classLevel >= 11 ? 4 : 3),
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.ability.save.cha',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        case 'formulaShielded':
            positiveEffectData.changes = [
                {
                    key: 'system.traits.dr.value',
                    mode: 2,
                    value: 'slashing',
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'system.traits.dv.value',
                    mode: 2,
                    value: 'bludgeoning',
                    priority: 20
                }
            ];
            break;
        case 'formulaUnbreakable':
            positiveEffectData.changes = [
                {
                    key: 'system.traits.dr.value',
                    mode: 2,
                    value: 'bludgeoning',
                    priority: 20
                }
            ];
            negativeEffectData.changes = [
                {
                    key: 'system.traits.dv.value',
                    mode: 2,
                    value: 'piercing',
                    priority: 20
                }
            ];
            break;
        case 'formulaVermillion': {
            let feature = itemUtils.getItemByIdentifier(workflow.actor, 'bloodMaledict');
            if (feature) await genericUtils.update(feature, {'system.uses.spent': feature.system.uses.spent - 1});
            positiveEffectData.changes = [];
            negativeEffectData.changes = [
                {
                    key: 'flags.midi-qol.disadvantage.deathSave',
                    mode: 0,
                    value: 1,
                    priority: 20
                }
            ];
            break;
        }
    }
    await genericUtils.update(workflow.item, {'system.uses.max': workflow.item.system.uses.value, 'system.uses.spent': 0});
    let flushItem = itemUtils.getItemByIdentifier(workflow.actor, 'flushMutagens');
    if (!flushItem) [flushItem] = await itemUtils.createItems(workflow.actor, [flushData], {favorite: true});
    await effectUtils.createEffect(workflow.actor, positiveEffectData, {parentEntity: flushItem, interdependent: true, identifier, vae: [{type: 'use', name: flushData.name, identifier: 'flushMutagens'}]});
    await effectUtils.createEffect(workflow.actor, negativeEffectData, {parentEntity: flushItem, identifier: identifier + 'Negative'});
}
async function earlyNighteye({trigger: {entity: effect}, workflow}) {
    if (workflow.disadvantage) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    if (!workflow.targets.size) return;
    let lightLevelSource = tokenUtils.getLightLevel(workflow.token);
    let lightLevelTarget = tokenUtils.getLightLevel(workflow.targets.first());
    if (lightLevelSource !== 'bright' && lightLevelTarget !== 'bright') return;
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Macros.Mutagencraft.AttackSunlight', {sourceTokenName: workflow.token.name, targetTokenName: workflow.targets.first().name}), {userId: socketUtils.gmID()});
    if (!selection) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Disadvantage') + ': ' + effect.name);
}
async function skillNighteye(actor, skillId) {
    if (skillId !== 'prc') return;
    return {label: genericUtils.format('CHRISPREMADES.Macros.Mutagencraft.SkillSunlight', {actorName: actor.name}), type: 'disadvantage'};
}
async function turnStartReconstruction({trigger: {token}}) {
    let actor = token.actor;
    if (!actor) return;
    let currHP = actor.system.attributes.hp.value;
    let halfHP = Math.floor(actor.system.attributes.hp.max / 2);
    if (!currHP || currHP >= halfHP) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Reconstruction Formula: Healing', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.Mutagencraft.ReconstructionHealing'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    await workflowUtils.syntheticItemDataRoll(featureData, token.actor, [token]);
}
export let formulas = {
    name: 'Formulas: Generic',
    version: '1.1.0',
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
let version = '1.1.0';
export let formulaAether = {
    name: 'Formulas: Aether',
    version
};
export let formulaAlluring = {
    name: 'Formulas: Alluring',
    version
};
export let formulaCelerity = {
    name: 'Formulas: Celerity',
    version
};
export let formulaConversant = {
    name: 'Formulas: Conversant',
    version
};
export let formulaCruelty = {
    name: 'Formulas: Cruelty',
    version
};
export let formulaDeftness = {
    name: 'Formulas: Deftness',
    version
};
export let formulaEmbers = {
    name: 'Formulas: Embers',
    version
};
export let formulaGelid = {
    name: 'Formulas: Gelid',
    version
};
export let formulaImpermeable = {
    name: 'Formulas: Impermeable',
    version
};
export let formulaMobility = {
    name: 'Formulas: Mobility',
    version
};
export let formulaNighteye = {
    name: 'Formulas: Nighteye',
    version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: earlyNighteye,
                priority: 51
            }
        ]
    },
    skill: [
        {
            pass: 'context',
            macro: skillNighteye,
            priority: 50
        }
    ]
};
export let formulaPercipient = {
    name: 'Formulas: Percipient',
    version
};
export let formulaPotency = {
    name: 'Formulas: Potency',
    version
};
export let formulaPrecision = {
    name: 'Formulas: Precision',
    version
};
export let formulaRapidity = {
    name: 'Formulas: Rapidity',
    version
};
export let formulaReconstruction = {
    name: 'Formulas: Reconstruction',
    version,
    combat: [
        {
            pass: 'turnStart',
            macro: turnStartReconstruction,
            priority: 50
        }
    ]
};
export let formulaSagacity = {
    name: 'Formulas: Sagacity',
    version
};
export let formulaShielded = {
    name: 'Formulas: Shielded',
    version
};
export let formulaUnbreakable = {
    name: 'Formulas: Unbreakable',
    version
};
export let formulaVermillion = {
    name: 'Formulas: Vermillion',
    version
};
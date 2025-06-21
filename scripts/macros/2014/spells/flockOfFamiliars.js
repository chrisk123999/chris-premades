import {Summons} from '../../../lib/summons.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils} from '../../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let spellLevel = workflow.castData?.castLevel;
    if (!spellLevel) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let findFamiliarEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'findFamiliar');
    let totalSummons = findFamiliarEffect ? spellLevel : spellLevel + 1;
    let touchFeature = activityUtils.getActivityByIdentifier(workflow.item, 'flockOfFamiliarsTouch', {strict: true});
    if (!touchFeature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let unhideActivities = [{
        itemUuid: workflow.item.uuid,
        activityIdentifiers: ['flockOfFamiliarsTouch'],
        favorite: true
    }];
    let additionalVaeButtons = [
        {
            type: 'use',
            name: touchFeature.name,
            identifier: 'flockOfFamiliars',
            activityIdentifier: 'flockOfFamiliarsTouch'
        }
    ];
    let folder = itemUtils.getConfig(workflow.item, 'folder');
    if (!folder?.length) folder = 'Familiars';
    let actors = game.actors.filter(i => i.folder?.name === folder);
    if (!actors.length) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Error.NoActors', {folder}), 'warn', {localize: false});
        return;
    }
    let sourceActors = await dialogUtils.selectDocumentsDialog(workflow.activity.name, genericUtils.format('CHRISPREMADES.Summons.SelectSummons', {totalSummons}), actors, {
        max: totalSummons
    });
    if (!sourceActors?.length || !sourceActors.reduce((acc, x) => acc += x.amount, 0)) return;
    sourceActors = sourceActors.reduce((acc, i) => acc.concat(Array(i.amount).fill(i.document)), []);
    let creatureType;
    if (findFamiliarEffect) {
        let pocketDimensionEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'findFamiliarPocketDimension');
        creatureType = pocketDimensionEffect?.flags['chris-premades'].findFamiliarPocketDimension.updates.actor.system.details.type.value;
    }
    if (!creatureType) {
        let creatureButtons = [
            ['DND5E.CreatureCelestial', 'celestial'],
            ['DND5E.CreatureFey', 'fey'],
            ['DND5E.CreatureFiend', 'fiend']
        ];
        creatureType = await dialogUtils.buttonDialog(workflow.activity.name, 'CHRISPREMADES.Macros.FindSteed.Type', creatureButtons);
    }
    if (!creatureType) return;
    let updates = [];
    for (let i of sourceActors) {
        let name = genericUtils.format('CHRISPREMADES.Summons.FamiliarDefault', {option: i.name});
        updates.push({
            actor: {
                name,
                system: {
                    details: {
                        type: {
                            value: creatureType
                        }
                    }
                },
                prototypeToken: {
                    name
                }
            },
            token: {
                name,
                disposition: workflow.token.document.disposition
            }
        });
    }
    let investmentOfTheChainMaster = itemUtils.getItemByIdentifier(workflow.actor, 'investmentOfTheChainMaster');
    if (investmentOfTheChainMaster) {
        let movementButtons = [
            ['DND5E.MovementFly', 'fly'],
            ['DND5E.MovementSwim', 'swim']
        ];
        let movement = await dialogUtils.buttonDialog(investmentOfTheChainMaster.name, 'CHRISPREMADES.Macros.FindFamiliar.Movement', movementButtons);
        let itemUpdates = [];
        let saveDC = itemUtils.getSaveDC(workflow.item);
        for (let sourceActor of sourceActors) {
            let weaponItems = sourceActor.items.filter(i => i.type === 'weapon');
            let saveItems = sourceActor.items.filter(i => i.hasSave);
            let currItemUpdates = [];
            for (let i of weaponItems) {
                let properties = Array.from(i.system.properties);
                properties.push('mgc');
                currItemUpdates.push({_id: i.id, system: {properties}});
            }
            for (let i of saveItems) {
                let currItem = currItemUpdates.find(j => j._id === i.id);
                let saveActivities = i.system.activities.getByType('save');
                for (let saveActivity of saveActivities) {
                    if (currItem) {
                        genericUtils.setProperty(currItem, 'system.activities.' + saveActivity.id + '.save.dc', {
                            calculation: '',
                            formula: saveDC.toString(),
                            value: saveDC
                        });
                    } else {
                        currItemUpdates.push({_id: i.id, system: {
                            activities: {
                                [saveActivity.id]: {
                                    save: {
                                        dc: {
                                            calculation: '',
                                            formula: saveDC.toString(),
                                            value: saveDC
                                        }
                                    }
                                }
                            }
                        }});
                    }
                }
            }
            itemUpdates.push(currItemUpdates);
        }
        let resistanceData = await Summons.getSummonItem('Investment of the Chain Master: Familiar Resistance', {}, workflow.item, {translate: 'CHRISPREMADES.Macros.InvestmentOfTheChainMaster.Resistance', identifier: 'investmentOfTheChainMasterResistance'});
        if (!resistanceData) {
            errors.missingPackItem();
            return;
        }
        for (let i = 0; i < updates.length; i++) {
            itemUpdates[i].push(resistanceData);
            genericUtils.setProperty(updates[i], 'actor.items', itemUpdates[i]);
            genericUtils.setProperty(updates[i], 'actor.system.attributes.movement.' + movement, genericUtils.handleMetric(40));
        }
        if (!findFamiliarEffect) {
            let commandFeature = activityUtils.getActivityByIdentifier(investmentOfTheChainMaster, 'flockOfFamiliarsCommand', {strict: true});
            if (!commandFeature) return;
            unhideActivities.push({
                itemUuid: investmentOfTheChainMaster.uuid,
                activityIdentifiers: ['flockOfFamiliarsCommand'],
                favorite: true
            });
            additionalVaeButtons.push({
                type: 'use',
                name: commandFeature.name,
                identifier: 'investmentOfTheChainMaster',
                activityIdentifier: 'flockOfFamiliarsCommand'
            });
        }
    }
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    await Summons.spawn(sourceActors, updates, workflow.item, workflow.token, {
        duration: 864000, 
        range: 10, 
        animation,
        additionalVaeButtons,
        unhideActivities
    });
    let casterEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'flockOfFamiliars');
    if (!casterEffect) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
}
async function late({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'flockOfFamiliars');
    if (!effect) return;
    let familiarTokens = new Set(effect.flags['chris-premades'].summons.ids[effect.name].map(i => canvas.scene.tokens.get(i)));
    if (!familiarTokens?.size) return;
    for (let i of familiarTokens) {
        if (tokenUtils.getDistance(workflow.token, i) > 100) familiarTokens.delete(i);
    }
    if (!familiarTokens.size) {
        genericUtils.notify('CHRISPREMADES.Macros.FlockOfFamiliars.TooFar', 'info');
        return;
    }
    for (let i of familiarTokens) {
        if (actorUtils.hasUsedReaction(i.actor)) familiarTokens.delete(i);
    }
    if (!familiarTokens.size) {
        genericUtils.notify('CHRISPREMADES.Macros.FlockOfFamiliars.ReactionUsed', 'info');
        return;
    }
    let effectData = {
        name: workflow.activity.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.rangeOverride.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    '1Attack'
                ]
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['flockOfFamiliarsTouch']);
    let casterEffect = await effectUtils.createEffect(workflow.actor, effectData);
    for (let i of familiarTokens) await effectUtils.createEffect(i.actor, effectData, {parentEntity: casterEffect});
}
async function early({workflow}) {
    if (workflow.item.type !== 'spell' || workflow.item.system.range.units !== 'touch') {
        genericUtils.notify('CHRISPREMADES.Macros.FindFamiliar.InvalidSpell', 'info');
        workflow.aborted = true;
        return;
    }
    if (!workflow.targets.size) {
        workflow.aborted = true;
        return;
    }
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'flockOfFamiliars');
    if (!effect) return;
    let familiarTokens = new Set(effect.flags['chris-premades'].summons.ids[effect.name].map(i => canvas.scene.tokens.get(i)));
    if (!familiarTokens?.size) return;
    for (let i of familiarTokens) {
        if (tokenUtils.getDistance(workflow.targets.first(), i) > genericUtils.handleMetric(5)) familiarTokens.delete(i);
    }
    if (!familiarTokens.size) return;
    await actorUtils.setReactionUsed(familiarTokens.first().actor);
}
export let flockOfFamiliars = {
    name: 'Flock of Familiars',
    version: '1.2.28',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['flockOfFamiliars']
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50,
                activities: ['flockOfFamiliarsTouch']
            }
        ]
    },
    config: [
        {
            value: 'folder',
            label: 'CHRISPREMADES.Summons.Folder',
            type: 'text',
            default: 'Familiars',
            category: 'summons'
        },
        {
            value: 'celestialAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'Celestial',
            type: 'select',
            default: 'celestial',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'feyAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'Fey',
            type: 'select',
            default: 'nature',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'fiendAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'Fiend',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};
export let flockOfFamiliarsTouch = {
    name: 'Flock of Familiars: Touch',
    version: flockOfFamiliars.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};
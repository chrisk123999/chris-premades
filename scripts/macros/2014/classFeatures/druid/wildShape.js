import {DialogApp} from '../../../../applications/dialog.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (workflow.actor.isPolymorphed) return;
    let circleForms = itemUtils.getItemByIdentifier(workflow.actor, 'circleForms');
    let druidLevel = workflow.actor.classes.druid?.system?.levels;
    if (!druidLevel) return;
    let maxCR = 0;
    let disallowedMovements = [];
    if (druidLevel >= 8) {
        maxCR = 1;
    } else if (druidLevel >= 4) {
        maxCR = 0.5;
        disallowedMovements = ['fly'];
    } else {
        maxCR = 0.25;
        disallowedMovements = ['fly', 'swim'];
    }
    if (circleForms) {
        maxCR = Math.max(Math.floor(druidLevel / 3), 1);
    } 
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Wild Shape: Revert', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.WildShape.Revert', identifier: 'wildShapeRevert'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let packKey = itemUtils.getConfig(workflow.item, 'compendium');
    if (!packKey?.length) packKey = genericUtils.getCPRSetting('monsterCompendium');
    let compendiumDocs;
    let elementals = ['air', 'earth', 'fire', 'water'];
    let ignoreRestrictions = itemUtils.getConfig(workflow.item, 'ignoreRestrictions');
    let allowElementals = itemUtils.getConfig(workflow.item, 'allowElementals');
    let elementalWildShape = itemUtils.getItemByIdentifier(workflow.actor, 'elementalWildShape');
    if (elementalWildShape) {
        elementals = elementals.map(i => itemUtils.getConfig(elementalWildShape, i + 'Name'));
    } else {
        elementals = elementals.map(i => genericUtils.translate('CHRISPREMADES.Summons.CreatureNames.' + i.capitalize + 'Elemental'));
    }
    if (ignoreRestrictions) {
        compendiumDocs = await compendiumUtils.getFilteredActorDocumentsFromCompendium(packKey);
        if (!allowElementals && (!elementalWildShape || !workflow.item.system.uses.value)) {
            compendiumDocs = compendiumDocs.filter(i => !elementals.includes(i.name));
        }
    } else {
        compendiumDocs = await compendiumUtils.getFilteredActorDocumentsFromCompendium(packKey, {maxCR, creatureTypes: ['beast']});
        compendiumDocs = compendiumDocs.filter(i => !disallowedMovements.some(j => i.system.attributes.movement[j]));
        if (allowElementals || (elementalWildShape && workflow.item.system.uses.value)) {
            compendiumDocs = compendiumDocs.concat(await compendiumUtils.getFilteredActorDocumentsFromCompendium(packKey, {specificNames: elementals}));
        }
    }
    let sourceActor = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.WildShape.Select', compendiumDocs, {sortAlphabetical: true, sortCR: true, showCR: true});
    if (!sourceActor) return;
    if (!allowElementals && elementals.includes(sourceActor.name)) await genericUtils.update(workflow.item, {'system.uses.value': workflow.item.system.uses.value - 1});
    let equippedItems = workflow.actor.items.filter(i => i.system.equipped && i.type !== 'container');
    let selection;
    if (equippedItems.length) {
        let inputs = [];
        for (let i of equippedItems) {
            inputs.push({
                label: i.name,
                name: i.id,
                options: {
                    options: [
                        {
                            value: 'merge',
                            label: 'CHRISPREMADES.Macros.WildShape.Merge'
                        },
                        {
                            value: 'wear',
                            label: 'CHRISPREMADES.Macros.WildShape.Wear'
                        }
                    ],
                    currentValue: i.flags?.['chris-premades']?.wildShape?.mergeWear ?? 'merge'
                }
            });
        }
        selection = await DialogApp.dialog(workflow.item.name, 'CHRISPREMADES.Macros.WildShape.Equipment', [['selectOption', inputs, {displayAsRows: true}]], 'okCancel');
        if (!selection?.buttons) return;
    }
    let keepItems = [];
    if (selection) keepItems = Object.entries(selection).filter(i => i[1] === 'wear').map(j => workflow.actor.items.get(j[0]));
    if (keepItems) {
        let itemsUpdate = equippedItems.map(i => ({
            _id: i.id,
            'flags.chris-premades.wildShape.mergeWear': keepItems.includes(i) ? 'wear' : 'merge'
        }));
        await genericUtils.updateEmbeddedDocuments(workflow.actor, 'Item', itemsUpdate);
    }
    let customKeepSpells = itemUtils.getConfig(workflow.item, 'keepSpells');
    let keepSpells = druidLevel >= 18 || customKeepSpells;
    // eslint-disable-next-line no-undef
    let options = new dnd5e.dataModels.settings.TransformationSetting(CONFIG.DND5E.transformation.presets.wildshape.settings).toObject();
    options.keep.findSplice(i => i === 'hp');
    options.keep.findSplice(i => i === 'languages');
    options.keep.findSplice(i => i === 'type');
    options.spellLists = [];
    if (keepSpells) options.keep.push('spells');
    delete options.tempFormula;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: Math.floor(druidLevel / 2) * 3600
        },
        changes: []
    };
    if (!customKeepSpells && druidLevel < 20) {
        effectData.changes.push({
            key: 'flags.midi-qol.fail.spell.material',
            value: 1,
            mode: 0,
            priority: 20
        });
    }
    if (!customKeepSpells && druidLevel < 18) {
        effectData.changes.push(
            {
                key: 'flags.midi-qol.fail.spell.vocal',
                value: 1,
                mode: 0,
                priority: 20
            }, {
                key: 'flags.midi-qol.fail.spell.somatic',
                value: 1,
                mode: 0,
                priority: 20
            }
        );
    }
    effectUtils.addMacro(effectData, 'effect', ['wildShapeActive']);
    effectUtils.addMacro(effectData, 'midi.actor', ['wildShapeActive']);
    let oldSheetOpened = workflow.actor.sheet.rendered;
    let [newToken] = await actorUtils.polymorph(workflow.actor, sourceActor, options, false);
    let newActor = newToken?.actor;
    if (!newActor) return;
    await genericUtils.update(newToken, {
        'sight.enabled': true
    });
    if (oldSheetOpened) newActor.sheet.render(true);
    let effect = await effectUtils.createEffect(newActor, effectData, {vae: [{type: 'use', name: featureData.name, identifier: 'wildShapeRevert'}], identifier: 'wildShapeActive'});
    await itemUtils.createItems(newActor, [featureData], {favorite: true, parentEntity: effect});
    await genericUtils.createEmbeddedDocuments(newActor, 'Item', keepItems);
    let primalStrike = itemUtils.getItemByIdentifier(workflow.actor, 'primalStrike');
    let insigniaOfClaws = itemUtils.getItemByIdentifier(workflow.actor, 'insigniaOfClaws');
    let itemUpdates = [];
    for (let i of newActor.items) {
        let currItem = i.toObject();
        let shouldChange = false;
        if (currItem.type === 'weapon') {
            if (primalStrike) {
                currItem.system.properties.push('mgc');
                shouldChange = true;
            }
            if (insigniaOfClaws && currItem.system.type.value === 'natural') {
                currItem.system.properties.push('mgc');
                let currBonus = currItem.system.magicalBonus ?? 0;
                currItem.system.magicalBonus = currBonus + 1;
                shouldChange = true;
            }
        }
        if (shouldChange) itemUpdates.push(currItem);
    }
    await genericUtils.updateEmbeddedDocuments(newActor, 'Item', itemUpdates);
}
async function preRevert({workflow}) {
    // TODO: here or in revert, try to track changed item uses
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'wildShapeActive');
    if (effect) await genericUtils.remove(effect);
}
async function revert({trigger: {entity: effect}}) {
    let actor = effect.parent;
    if (!actor?.isPolymorphed) return;
    let damageFlags = effect.flags['chris-premades']?.wildShape?.overflow;
    let spellData = actor.system.spells;
    let oldSheetOpened = actor.sheet.rendered;
    let origActor = await actor.revertOriginalForm({renderSheet: false});
    if (!origActor) return;
    await genericUtils.update(origActor, {'system.spells': spellData});
    if (oldSheetOpened) origActor.sheet.render(true);
    if (!damageFlags) return;
    let [token] = actorUtils.getTokens(origActor);
    await token.movementAnimationPromise;
    await workflowUtils.applyDamage([token], damageFlags.damage, damageFlags.type);
}
async function hit({trigger: {entity: effect}, workflow}) {
    let actor = effect.parent;
    let ditem = workflow.damageList?.find(i => i.actorId === actor?.id);
    if (!ditem) return;
    if (ditem.newHP > 0) return;
    let overflowDamage = ditem.damageDetail.reduce((acc, i) => acc + i.value, 0) - ditem.oldTempHP - ditem.oldHP;
    await genericUtils.update(effect, {['flags.chris-premades.wildShape.overflow']: {
        damage: overflowDamage,
        type: workflow.defaultDamageType ?? 'none'
    }});
    await genericUtils.remove(effect);
}
export let wildShape = {
    name: 'Wild Shape',
    version: '1.1.0',
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
            value: 'compendium',
            label: 'CHRISPREMADES.Macros.WildShape.CustomCompendium',
            type: 'select',
            options: constants.actorCompendiumPacks,
            default: '',
            category: 'mechanics'
        },
        {
            value: 'keepSpells',
            label: 'CHRISPREMADES.Macros.WildShape.KeepSpells',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'ignoreRestrictions',
            label: 'CHRISPREMADES.Macros.WildShape.Ignore',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'allowElementals',
            label: 'CHRISPREMADES.Macros.WildShape.AllowElementals',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let wildShapeActive = {
    name: 'Wild Shape: Active',
    version: wildShape.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: preRevert,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'onHit',
                macro: hit,
                priority: 50
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: revert,
            priority: 50
        }
    ]
};
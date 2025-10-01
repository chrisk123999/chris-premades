import {DialogApp} from '../../../../applications/dialog.js';
import {activityUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    const newActor = fromUuidSync(workflow.transformedActorUuids?.[0]);
    if (!newActor) return;
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
    if (selection) keepItems = Object.entries(selection).filter(i => i[1] === 'wear').map(j => workflow.actor.items.get(j[0]).toObject());
    if (keepItems) {
        let itemsUpdate = equippedItems.map(i => ({
            _id: i.id,
            'flags.chris-premades.wildShape.mergeWear': keepItems.includes(i) ? 'wear' : 'merge'
        }));
        await genericUtils.updateEmbeddedDocuments(workflow.actor, 'Item', itemsUpdate);
        if (itemUtils.getItemByIdentifier(workflow.actor, 'beastSpells')) {
            let validSpells = workflow.actor.itemTypes.spell.filter(i => {
                if (i.system.materials.cost > 0) return false;
                if (i.system.materials.consumed) return false;
                if (newActor.itemTypes.spell.find(j => j.id === i.id)) return false;
                return true;
            });
            keepItems.push(...validSpells);
        }
        await genericUtils.createEmbeddedDocuments(newActor, 'Item', keepItems);
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.modernPacks.featureItems, 'Wild Shape: Revert', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.WildShape.Revert', identifier: 'wildShapeRevert'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: []
    };
    effectUtils.addMacro(effectData, 'effect', ['wildShapeActive']);
    effectUtils.addMacro(effectData, 'midi.actor', ['wildShapeActive']);
    let improvedCircleForms = itemUtils.getItemByIdentifier(workflow.actor, 'improvedCircleForms');
    if (improvedCircleForms) effectData.changes.push({
        key: 'system.abilities.con.bonuses.save',
        mode: 2,
        value: '@abilities.wis.mod',
        priority: 20
    });
    let lunarForm = itemUtils.getItemByIdentifier(workflow.actor, 'lunarForm');
    if (lunarForm) effectData.changes.push(...[
        {
            key: 'flags.midi-qol.optional.LunarForm.damage.mwak',
            mode: 5,
            value: `${itemUtils.getConfig(lunarForm, 'formula')}[${itemUtils.getConfig(lunarForm, 'damageType')}]`,
            priority: 20
        },
        {
            key: 'flags.midi-qol.optional.LunarForm.damage.mwak',
            mode: 5,
            value: `${itemUtils.getConfig(lunarForm, 'formula')}[${itemUtils.getConfig(lunarForm, 'damageType')}]`,
            priority: 20
        },
        {
            key: 'flags.midi-qol.optional.LunarForm.activation',
            mode: 5,
            value: 'workflow.hitTargets.size > 0 && ["natural", "monster"].includes(item.type?.value)',
            priority: 20
        },
        {
            key: 'flags.midi-qol.optional.LunarForm.count',
            mode: 5,
            value: 'each-turn',
            priority: 20
        }
    ]);
    let itemUpdates = [];
    for (let i of newActor.items) {
        let currItem = i.toObject();
        let shouldChange = false;
        if (improvedCircleForms && currItem.type === 'weapon') {
            shouldChange = true;
            currItem.system.damage.base.types.push('radiant');
        } else if (improvedCircleForms && currItem.system.type?.value === 'monster') {
            let attackActivities = Object.values(currItem.system.activities ?? {}).filter(a => a.type === 'attack');
            if (attackActivities.length) {
                shouldChange = true;
                for (let activity of attackActivities) {
                    currItem.system.activities[activity._id].damage.parts.forEach(d => d.types.push('radiant'));
                }
            }
        }
        if (shouldChange) itemUpdates.push(currItem);
    }
    await genericUtils.updateEmbeddedDocuments(newActor, 'Item', itemUpdates);
    let effect = await effectUtils.createEffect(newActor, effectData, {vae: [{type: 'use', name: featureData.name, identifier: 'wildShapeRevert'}], identifier: 'wildShapeActive'});
    await itemUtils.createItems(newActor, [featureData], {favorite: true, parentEntity: effect});
}
async function preRevert({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'wildShapeActive');
    if (effect) await genericUtils.remove(effect);
}
async function revert({trigger: {entity: effect}}) {
    let actor = effect.parent;
    if (!actor?.isPolymorphed) return;
    let spellData = actor.system.spells;
    let oldSheetOpened = actor.sheet.rendered;
    let origActor = await actor.revertOriginalForm({renderSheet: false});
    if (!origActor) return;
    await genericUtils.update(origActor, {'system.spells': spellData});
    if (oldSheetOpened) await origActor.sheet.render({force: true});
}
async function hit({trigger: {entity: effect}, workflow}) {
    let actor = effect.parent;
    let ditem = workflow.damageList?.find(i => i.actorId === actor?.id);
    if (!ditem) return;
    if (ditem.newHP > 0) return;
    await genericUtils.remove(effect);
}
async function added({trigger: {entity: item}}) {
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    if (!item.actor.system.scale[classIdentifier]?.[scaleIdentifier]) {
        await itemUtils.fixScales(item);
    }
    if (item._source.system.uses.max !== '0') return;
    await genericUtils.update(item, {'system.uses.max': `@scale.${classIdentifier}.${scaleIdentifier}`});
}
export let wildShape = {
    name: 'Wild Shape',
    version: '1.3.83',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 45
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 45
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 45
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'druid',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'wild-shape-uses',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: [
        {
            classIdentifier: 'classIdentifier',
            scaleIdentifier: 'scaleIdentifier',
            data: {
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'wild-shape-uses',
                    type: 'number',
                    scale: {
                        2: {
                            value: 2
                        },
                        6: {
                            value: 3
                        },
                        17: {
                            value: 4
                        }
                    }
                },
                value: {},
                title: 'Wild Shape Uses',
                icon: null
            }
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
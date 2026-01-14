import {DialogApp} from '../../../../../applications/dialog.js';
import {compendiumUtils, constants, effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let newActor = fromUuidSync(workflow.transformedActorUuids?.[0]);
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
                    currentValue: i.flags?.['chris-premades']?.felineForm?.mergeWear ?? 'merge'
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
            'flags.chris-premades.felineForm.mergeWear': keepItems.includes(i) ? 'wear' : 'merge'
        }));
        await genericUtils.updateEmbeddedDocuments(workflow.actor, 'Item', itemsUpdate);
        await genericUtils.createEmbeddedDocuments(newActor, 'Item', keepItems);
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.modernPacks.featureItems, 'Feline Form: Revert', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.FelineForm.Revert', identifier: 'felineFormRevert'});
    if (!featureData) return;
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier');
    let levels = workflow.actor.classes[classIdentifier]?.system?.levels ?? 1;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {seconds: Math.floor(levels / 2) * 3600},
        changes: [],
        flags: {
            'chris-premades': {
                specialDuration: [
                    'incapacitated'
                ]
            }
        }
    };
    effectUtils.addMacro(effectData, 'effect', ['felineFormActive']);
    effectUtils.addMacro(effectData, 'midi.actor', ['felineFormActive']);
    let effect = await effectUtils.createEffect(newActor, effectData, {vae: [{type: 'use', name: featureData.name, identifier: 'felineFormRevert'}], identifier: 'felineFormActive', rules: 'modern'});
    await itemUtils.createItems(newActor, [featureData], {favorite: true, parentEntity: effect});
}
async function preRevert({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'felineFormActive');
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
export let felineForm = {
    name: 'Feline Form',
    version: '1.4.17',
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
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'warlock',
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let felineFormActive = {
    name: 'Wild Shape: Active',
    version: felineForm.version,
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
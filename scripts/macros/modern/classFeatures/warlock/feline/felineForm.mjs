import cprConstants from '../../../../../constants.mjs';
import {automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils} from '../../../../../proxy.mjs';
const srdActors = 'dnd5e.actors24';
async function transformActor(document) {
    const name = automationUtils.getConfigValue(document, 'actorName');
    return game.actors.find(actor => actor.name === name) ?? await compendiumUtils.getDocumentByName(srdActors, name);
}
async function early({document, message}) {
    const actor = await transformActor(document);
    if (!actor) {
        genericUtils.notify(_loc('CHRISPREMADES.Macros.Modern.FelineForm.NoActor', {name: automationUtils.getConfigValue(document, 'actorName')}), {type: 'warn', localize: false});
        return true;
    }
    genericUtils.setProperty(message, 'data.flags.dnd5e.transform.uuid', actor.uuid);
}
async function use({document, workflow}) {
    const newActor = workflow.transformedActors?.[0];
    if (!newActor) return;
    const equippedItems = workflow.actor.items.filter(item => item.system.equipped && item.type !== 'container');
    let keepItems = [];
    if (equippedItems.length) {
        const selection = await dialogUtils.selectDocumentDialog(document.name, _loc('CHRISPREMADES.Macros.Modern.FelineForm.Equipment'), equippedItems, {max: equippedItems.length, checkbox: true});
        if (!selection) return;
        if (equippedItems.length > 1) keepItems = selection.filter(entry => entry.amount).map(entry => entry.document.toObject());
        else keepItems = [selection.toObject()];
    }
    if (keepItems.length) await documentUtils.createEmbeddedDocuments(newActor, 'Item', keepItems);
    const featureData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.modern.features, 'feline-form-revert', {object: true});
    if (!featureData) return;
    const classIdentifier = automationUtils.getConfigValue(document, 'classIdentifier');
    const levels = workflow.actor.classes[classIdentifier]?.system.levels ?? 1;
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'felineFormActive',
        duration: {seconds: Math.floor(levels / 2) * 3600},
        specialDuration: ['incapacitated', 'zeroHP'],
        vae: [{type: 'use', name: featureData.name, identifier: 'feline-form-revert'}],
        macros: [
            {type: 'effect', macros: [{source: 'chris-premades', rules: '2024', identifier: 'feline-form-active'}]}
        ]
    });
    const [effect] = await effectUtils.createEffects(newActor, [effectData]);
    if (!effect) return;
    await itemUtils.createItems(newActor, [featureData], {favorite: true, parentEntity: effect});
}
async function preRevert({workflow}) {
    const effect = documentUtils.getEffectByIdentifier(workflow.actor, 'felineFormActive');
    if (effect) await documentUtils.deleteDocument(effect);
}
async function revert({document: effect}) {
    const actor = effect.parent;
    if (!actor?.isPolymorphed) return;
    const spellData = actor.system.spells;
    const sheetOpen = actor.sheet.rendered;
    const originalActor = await actor.revertOriginalForm({renderSheet: false});
    if (!originalActor) return;
    await documentUtils.update(originalActor, {'system.spells': spellData});
    if (sheetOpen) await originalActor.sheet.render({force: true});
}
export const felineForm = {
    name: 'Feline Form',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'itemPreTargeting', macro: early, priority: 50},
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        actorName: {
            default: 'Cat',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Modern.FelineForm.Actor',
            category: 'homebrew'
        },
        classIdentifier: {
            default: 'warlock',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    }
};
export const felineFormRevert = {
    name: 'Feline Form: Revert',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: preRevert, priority: 50}
    ]
};
export const felineFormActive = {
    name: 'Feline Form: Active',
    version: '2.0.0',
    rules: '2024',
    effect: [
        {pass: 'deleted', macro: revert, priority: 50}
    ]
};

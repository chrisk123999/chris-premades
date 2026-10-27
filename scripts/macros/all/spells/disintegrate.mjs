import {actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils} from '../../../proxy.mjs';
async function dust({ditem, targetToken}) {
    const actor = targetToken?.actor;
    if (!actor || ditem.oldHP <= 0 || ditem.newHP > 0 || actor.type !== 'character') return;
    await actorUtils.applyConditions(actor, ['dead']);
}
function getForceCreations(item, scene) {
    const identifiers = automationUtils.getConfigValue(item, 'forceCreations');
    return scene.regions.filter(region => identifiers.includes(fromUuidSync(region.flags.dnd5e?.item ?? '', {strict: false})?.identifier));
}
async function destroy({document: item, workflow}) {
    if (workflow.targets.size) return;
    const scene = workflow.token?.document.parent;
    if (!scene) return;
    const regions = getForceCreations(item, scene);
    if (!regions.length) return;
    let region = regions[0];
    if (regions.length > 1) region = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.All.Disintegrate.Select', regions);
    else if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.All.Disintegrate.Destroy', {name: region.name}))) return;
    if (!region) return;
    const sourceItem = fromUuidSync(region.flags.dnd5e.item, {strict: false});
    if (sourceItem?.actor) await effectUtils.endConcentration(sourceItem.actor, sourceItem);
    if (region.parent?.regions.has(region.id)) await documentUtils.deleteDocument(region);
}
export const disintegrate = {
    name: 'Disintegrate',
    version: '2.1.4',
    rules: 'all',
    roll: [
        {
            pass: 'itemDamageComplete',
            macro: dust,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: destroy,
            priority: 50
        }
    ],
    config: {
        forceCreations: {
            default: ['wall-of-force'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.All.Disintegrate.ForceCreations',
            category: 'homebrew',
            options: [
                {label: 'CHRISPREMADES.Macros.All.Disintegrate.WallOfForce', value: 'wall-of-force'}
            ]
        }
    }
};

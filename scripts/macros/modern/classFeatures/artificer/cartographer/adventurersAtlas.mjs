import {automationUtils, dialogUtils, documentUtils, effectUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
export function getMap(actor, atlas) {
    if (!actor || !atlas) return;
    return actor.effects.find(effect => documentUtils.getIdentifier(effect) === 'adventurersAtlas' && effect.origin?.startsWith(atlas.uuid));
}
export function getMapHolders(atlas, scene) {
    return scene.tokens.filter(token => getMap(token.actor, atlas));
}
async function requireTools({document: activity, workflow}) {
    if (!automationUtils.getConfigValue(activity.item, 'requireTools')) return;
    if (workflow.actor.items.some(item => item.type === 'tool' && item.system.type?.baseItem === 'cartographer')) return;
    Logging.addMacroWarning('CPR', 'adventurers-atlas', 'CHRISPREMADES.Macros.Modern.AdventurersAtlas.NeedTools', {notify: 'warn', format: {itemName: activity.item.name}});
    return true;
}
async function chooseTargets({document: activity, workflow}) {
    const max = Math.max(Number(activity.target.affects.count) || 2, 2);
    const count = Array.from(workflow.targets).filter(token => token.actor).length;
    if (count >= 2 && count <= max) return;
    if (!workflow.token) return;
    const range = automationUtils.getConfigValue(activity.item, 'range');
    const nearby = tokenUtils.findNearby(workflow.token.document, range, {disposition: 'ally', includeToken: true}).filter(token => token.actor);
    const selection = await dialogUtils.selectTargetDialog(activity.item.name, _loc('CHRISPREMADES.Macros.Modern.AdventurersAtlas.Select', {maxAmount: max}), nearby, {type: 'multiple', maxAmount: max, skipDeadAndUnconscious: false});
    if (!selection) return true;
    await workflowUtils.updateTargets(workflow, selection.result.map(token => token.object));
}
async function makeMaps({document: activity, workflow}) {
    const targets = Array.from(workflow.targets).filter(token => token.actor);
    if (targets.length < 2) return Logging.addMacroWarning('CPR', 'adventurers-atlas', 'CHRISPREMADES.Macros.Modern.AdventurersAtlas.TooFew', {notify: 'warn'});
    const item = activity.item;
    const oldSource = documentUtils.getEffectByIdentifier(workflow.actor, 'adventurersAtlasSource');
    if (oldSource) await documentUtils.deleteDocument(oldSource);
    const sourceData = documentUtils.getEffectData(item, sourceEffectId, {activityUuid: activity.uuid});
    const source = (await effectUtils.createEffects(workflow.actor, [sourceData]))?.[0];
    if (!source) return;
    const mapData = documentUtils.getEffectData(item, mapEffectId, {activityUuid: activity.uuid, parentEntity: source});
    await Promise.all(targets.map(token => effectUtils.createEffects(token.actor, [mapData])));
}
const sourceEffectId = '1aeXrrgDEyUYJioQ';
const mapEffectId = 'e1I05lHwVwzgFRWr';
export const adventurersAtlas = {
    name: 'Adventurer\'s Atlas',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: requireTools,
            priority: 50
        },
        {
            pass: 'activityPreambleComplete',
            macro: chooseTargets,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: makeMaps,
            priority: 50
        }
    ],
    config: {
        requireTools: {
            default: true,
            type: 'checkbox',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.AdventurersAtlas.RequireTools'
        },
        range: {
            default: 60,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Modern.AdventurersAtlas.RangeHint'
        }
    }
};

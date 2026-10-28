import {actorUtils, automationUtils, regionUtils, workflowUtils} from '../../../proxy.mjs';
import {playAreaAnimation} from '../../generic/spellAnimation.mjs';
import {createRegionLight, prepareMovableRegion} from '../../generic/moveRegion.mjs';
async function created({document: region, workflow}) {
    const originItem = regionUtils.getActivity(region)?.item;
    if (!originItem) return;
    await prepareMovableRegion(region, originItem, 'moonbeamMove');
    const color = automationUtils.getConfigValue(originItem, 'lightColor');
    const animationType = automationUtils.getConfigValue(originItem, 'lightAnimation');
    await createRegionLight(region, {color: color || null, animation: {type: animationType || null}});
    playAreaAnimation(workflow, automationUtils.getResolvedAnimation(originItem, 'animation'), {region});
}
export async function moved({document: region}) {
    const originItem = regionUtils.getActivity(region)?.item;
    if (!originItem) return;
    const {animation, options} = automationUtils.getResolvedAnimation(originItem, 'animation');
    if (animation?.macros?.move) await animation.macros.move(region, options);
}
async function pulse({document, workflow}) {
    if (!workflow.targets.size) return;
    const {animation, options} = automationUtils.getResolvedAnimation(document.item, 'animation');
    if (!animation?.macros?.pulse) return;
    workflow.targets.forEach(token => animation.macros.pulse(token.document, options));
}
function isShapechanger(actor, identifiers) {
    if (!actor) return false;
    if (identifiers.length && actorUtils.getItemByIdentifiers(actor, identifiers)) return true;
    const subtype = actor.system.details?.type?.subtype?.toLowerCase() ?? '';
    return subtype.includes(_loc('CHRISPREMADES.Macros.All.Moonbeam.Shapechanger').toLowerCase());
}
async function shapechanger({document, workflow}) {
    const identifiers = automationUtils.getConfigValue(document.item, 'shapechangerIdentifiers') ?? [];
    workflow.targets.forEach(token => {
        if (isShapechanger(token.actor, identifiers)) workflowUtils.grantRollModifier(workflow, 'dis', token.id, 'moonbeam-shapechanger', _loc('CHRISPREMADES.Macros.All.Moonbeam.ShapechangerDisadvantage'));
    });
}
export const moonbeam = {
    name: 'Moonbeam',
    version: '2.1.3',
    rules: 'all',
    region: [
        {pass: 'created', macro: created, priority: 50},
        {pass: 'moved', macro: moved, priority: 50}
    ],
    roll: [
        {pass: 'activityRollFinished', macro: pulse, priority: 50}
    ],
    config: {
        lightColor: {
            default: '#bcd7ff',
            type: 'text',
            label: 'CHRISPREMADES.Macros.All.Moonbeam.LightColor',
            hint: 'CHRISPREMADES.Macros.All.Moonbeam.LightColorHint',
            category: 'homebrew'
        },
        lightAnimation: {
            default: '',
            type: 'select',
            label: 'CHRISPREMADES.Macros.All.Moonbeam.LightAnimation',
            hint: 'CHRISPREMADES.Macros.All.Moonbeam.LightAnimationHint',
            category: 'homebrew',
            get options() {
                return [{value: '', label: _loc('DND5E.None')}, ...Object.entries(CONFIG.Canvas.lightAnimations).map(([value, config]) => ({value, label: config.label}))];
            }
        },
        shapechangerIdentifiers: {
            default: ['shapechanger', 'change-shape'],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.All.Moonbeam.ShapechangerIdentifiers',
            hint: 'CHRISPREMADES.Macros.All.Moonbeam.ShapechangerIdentifiersHint',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'moonbeam'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
export const moonbeamShapechanger = {
    name: 'Moonbeam: Shapechanger',
    version: moonbeam.version,
    rules: moonbeam.rules,
    roll: [
        {pass: 'activityPreambleComplete', macro: shapechanger, priority: 50}
    ]
};

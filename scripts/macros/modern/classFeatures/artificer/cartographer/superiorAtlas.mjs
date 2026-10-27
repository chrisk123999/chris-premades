import {actorUtils, automationUtils, dialogUtils, documentUtils, itemUtils, Logging, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
import {getMap, getMapHolders} from './adventurersAtlas.mjs';
async function unerringPath({document: item, workflow}) {
    if (workflow.item.system.linkedActivity?.item?.id !== item.id) return;
    const atlas = actorUtils.getItemByIdentifier(workflow.actor, 'adventurers-atlas');
    if (getMap(workflow.actor, atlas)) return;
    Logging.addMacroWarning('CPR', 'superior-atlas', 'CHRISPREMADES.Macros.Modern.SuperiorAtlas.HaveMap', {notify: 'warn'});
    return true;
}
async function safeHaven({document: effect, ditem, targetToken}) {
    const holder = effect.parent;
    if (!(ditem.oldHP > 0)) return;
    const resultingHP = ditem.oldHP + (ditem.oldTempHP ?? 0) - ditem.totalDamage;
    if (resultingHP > 0 || resultingHP <= -holder.system.attributes.hp.effectiveMax) return;
    const atlas = fromUuidSync(effect.origin, {strict: false})?.parent;
    const creator = atlas?.actor;
    const feature = creator ? actorUtils.getItemByIdentifier(creator, 'superior-atlas') : undefined;
    if (!feature) return;
    const config = automationUtils.getConfigValues(feature, ['hitPoints', 'range']);
    const hitPoints = rollUtils.rollDiceSync(config.hitPoints, {document: feature}).total;
    if (!(hitPoints > 0)) return Logging.addMacroWarning('CPR', 'superior-atlas', `Safe Haven exited early, the hit point formula resolved to 0. (formula) ${config.hitPoints} (actor) ${creator.uuid}`);
    const token = targetToken.document ?? targetToken;
    const creatorToken = token.parent.tokens.find(sceneToken => sceneToken.actor === creator);
    const candidates = [...new Set([creatorToken, ...getMapHolders(atlas, token.parent)])].filter(candidate => candidate && candidate.actor !== holder);
    const userId = queryUtils.firstOwner(holder, true);
    let destination;
    if (candidates.length) {
        const selection = await dialogUtils.selectTargetDialog(feature.name, _loc('CHRISPREMADES.Macros.Modern.SuperiorAtlas.Prompt', {hitPoints}), candidates, {skipDeadAndUnconscious: false, userId});
        destination = selection?.result;
        if (!destination) return;
    } else if (!await dialogUtils.confirm(feature.name, _loc('CHRISPREMADES.Macros.Modern.SuperiorAtlas.Confirm', {hitPoints}), {userId})) return;
    workflowUtils.preventZeroHP(ditem, {targetHP: hitPoints});
    await documentUtils.deleteDocument(effect);
    const activity = itemUtils.getActivityByIdentifier(feature, 'safe-haven');
    if (activity) await workflowUtils.completeActivityUse(activity, [token], {consumeUsage: false, consumeResources: false});
    if (!destination) return;
    const {animation, options} = automationUtils.getResolvedAnimation(feature, 'animation');
    await tokenUtils.teleportToken(token, {animation, options, range: config.range, centerpoint: destination.object.center, userId});
}
export const superiorAtlas = {
    name: 'Superior Atlas',
    version: '2.1.4',
    rules: '2024',
    notes: 'Safe Haven runs from the superiorAtlasSafeHaven macro on the map effects created by Adventurer\'s Atlas.',
    roll: [
        {
            pass: 'actorPreItemRoll',
            macro: unerringPath,
            priority: 50
        }
    ],
    config: {
        hitPoints: {
            default: '2 * @classes.artificer.levels',
            type: 'text',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.SuperiorAtlas.HitPoints'
        },
        range: {
            default: 5,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.Range'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
};
export const superiorAtlasSafeHaven = {
    name: 'Superior Atlas: Safe Haven',
    version: superiorAtlas.version,
    rules: superiorAtlas.rules,
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: safeHaven,
            priority: 250
        }
    ]
};

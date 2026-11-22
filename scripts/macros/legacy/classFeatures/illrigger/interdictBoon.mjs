import {activityUtils, actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
import {rollThroughBond, throughBond} from './eyesOfTheGate.mjs';
async function chooseTarget(item, ownerToken) {
    const range = Math.max(5, ...item.actor.items.filter(weapon => weapon.type === 'weapon' && weapon.system.equipped).map(weapon => weapon.system.range.long || weapon.system.range.value || weapon.system.range.reach || 5));
    const enemies = tokenUtils.findNearby(ownerToken, range, {disposition: 'enemy'}).filter(token => token.actor);
    if (!enemies.length) return [];
    const target = (await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Generic.SelectTarget', enemies, {userId: queryUtils.firstOwner(item.actor, true)}))?.result;
    return target ? [target] : [];
}
async function getTargets(item, target, config) {
    const ownerToken = actorUtils.getFirstToken(item.actor);
    if (config.targets === 'choose') return ownerToken ? await chooseTarget(item, ownerToken) : [];
    if (config.targets === 'self') return ownerToken ? [ownerToken] : [];
    if (config.targets === 'nearTarget') return tokenUtils.findNearby(target, 5).filter(token => token.actor && token !== target && (!ownerToken || tokenUtils.isEnemy(ownerToken, token)));
    return [target];
}
function sizeAllowed(item, target, config) {
    const size = actorUtils.getSize(target.actor);
    if (config.maxSize && size > CONFIG.DND5E.actorSizes[config.maxSize]?.numerical) return false;
    if (config.relativeSize !== '' && size > actorUtils.getSize(item.actor) + Number(config.relativeSize)) return false;
    return true;
}
async function resolveSourceValues(activity, targets) {
    const rollData = activity.getRollData();
    for (const target of targets) {
        const effects = actorUtils.getEffects(target.actor).filter(effect => effectUtils.getOriginActivitySync(effect)?.uuid === activity.uuid && effect.system.changes.some(change => String(change.value).includes('@')));
        await Promise.all(effects.map(effect => documentUtils.update(effect, {'system.changes': effect.system.changes.map(change => ({...change, value: Roll.replaceFormulaData(String(change.value), rollData, {missing: '0'})}))})));
    }
}
function offer(trigger) {
    return async function({document: item, data}) {
        const config = automationUtils.getConfigValues(item, configKeys);
        if (config.trigger !== trigger || !data.target?.actor) return;
        if (trigger === 'placed' && config.bonusActionOnly && !data.bonusAction) return;
        if (config.attackType && !workflowUtils.isAttackType(data.workflow, config.attackType)) return;
        if (!sizeAllowed(item, data.target, config)) return;
        const activities = item.system.activities.filter(activity => !activity.flags.cat?.hidden && activityUtils.checkCosts(activity) && !(activity.activation.type === 'reaction' && actorUtils.hasUsedReaction(item.actor)));
        return activities.map(activity => ({
            activity,
            use: async () => {
                const targets = await getTargets(item, data.target, config);
                if (!targets.length) return;
                if (config.damageFromBurn) {
                    const activityData = activity.toObject();
                    activityData.damage.parts[0].custom = {enabled: true, formula: String(data.damageTotal)};
                    activityData.damage.parts[0].types = [data.damageType];
                    await workflowUtils.syntheticActivityDataRoll(activityData, item, targets, {consumeResources: true});
                } else {
                    if (config.targets === 'target' && throughBond(item.actor, targets[0], activityUtils.getRange(activity))) await rollThroughBond(activity, targets);
                    else await workflowUtils.completeActivityUse(activity, targets);
                    await resolveSourceValues(activity, targets);
                }
                if (activity.activation.type === 'reaction' && !actorUtils.hasUsedReaction(item.actor)) await actorUtils.setReactionUsed(item.actor);
            }
        }));
    };
}
export const interdictBoon = {
    name: 'Interdict Boon',
    version: '2.1.10',
    rules: '2014',
    called: [
        {
            pass: 'actorInterdictSealPlaced',
            macro: offer('placed'),
            priority: 50
        },
        {
            pass: 'actorInterdictSealBurned',
            macro: offer('burned'),
            priority: 50
        },
        {
            pass: 'actorInterdictHit',
            macro: offer('hit'),
            priority: 50
        }
    ],
    config: {
        trigger: {
            default: 'burned',
            type: 'select',
            label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.Trigger',
            category: 'behavior',
            options: [
                {label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.Burned', value: 'burned'},
                {label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.Placed', value: 'placed'},
                {label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.Hit', value: 'hit'}
            ]
        },
        bonusActionOnly: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.BonusActionOnly',
            category: 'behavior'
        },
        attackType: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Config.AttackType.Label',
            category: 'behavior'
        },
        targets: {
            default: 'target',
            type: 'select',
            label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.Targets',
            category: 'behavior',
            options: [
                {label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.Target', value: 'target'},
                {label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.Self', value: 'self'},
                {label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.NearTarget', value: 'nearTarget'},
                {label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.Choose', value: 'choose'}
            ]
        },
        maxSize: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Config.MaxSize',
            category: 'behavior'
        },
        relativeSize: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.RelativeSize',
            category: 'behavior'
        },
        damageFromBurn: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.InterdictBoon.DamageFromBurn',
            category: 'behavior'
        }
    }
};
const configKeys = Object.keys(interdictBoon.config);

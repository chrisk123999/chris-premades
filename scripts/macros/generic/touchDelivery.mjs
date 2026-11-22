import {actorUtils, automationUtils, documentUtils, effectUtils, Logging, summonUtils, tokenUtils} from '../../proxy.mjs';
function getSummons(activity, config) {
    return config.summonIdentifier ? summonUtils.getSummonsByIdentifier(config.summonIdentifier, {actor: activity.actor}) : summonUtils.getSummonsBySource(activity.item);
}
function warn(key) {
    Logging.addMacroWarning('CPR', 'touchDelivery', 'CHRISPREMADES.Macros.Generic.TouchDelivery.' + key, {notify: 'info'});
}
async function prepare({document: activity, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'touchDelivery', configKeys);
    const summons = getSummons(activity, config).filter(summon => summon.token);
    if (!summons.length) {
        warn('NoSummon');
        return;
    }
    const effectData = macros => documentUtils.getBaseEffectData(activity, {
        name: activity.item.name + ': ' + activity.name,
        img: activity.item.img,
        origin: activity.uuid,
        identifier: 'touchDelivery',
        duration: {value: 1, units: 'seconds'},
        specialDuration: [config.specialDuration],
        macros,
        changes: [
            {
                key: 'flags.midi-qol.rangeOverride.attack.all',
                type: 'custom',
                value: 1,
                priority: 20
            }
        ]
    });
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [effectData([{type: 'roll', macros: [{source: 'chris-premades', rules: 'all', identifier: 'touchDeliveryEffect'}]}])]);
    await Promise.all(summons.map(summon => effectUtils.createEffects(summon.actor, [effectData()], {parentEntity: casterEffect})));
}
async function deliver({document: effect, workflow, token}) {
    if (workflow.item.type !== 'spell') return;
    if (workflow.item.system.range.units !== 'touch') {
        warn('InvalidSpell');
        return;
    }
    const originActivity = await effectUtils.getOriginActivity(effect);
    if (!originActivity) return;
    const config = automationUtils.getGenericConfigValues(originActivity, 'chris-premades', 'touchDelivery', configKeys);
    const inRange = getSummons(originActivity, config).map(summon => summon.token).filter(summonToken => summonToken && tokenUtils.isWithinDistance(token, summonToken, config.range));
    if (!inRange.length) {
        warn('TooFar');
        return true;
    }
    const available = inRange.filter(summonToken => !actorUtils.hasUsedReaction(summonToken.actor));
    if (!available.length) {
        warn('ReactionUsed');
        return true;
    }
    const target = workflow.targets.tokens[0]?.document;
    const [carrier] = target ? available.sort((a, b) => tokenUtils.getDistance(target, a) - tokenUtils.getDistance(target, b)) : available;
    await actorUtils.setReactionUsed(carrier.actor);
}
/**
 * Delivers the actor's next touch spell through one of their summons, spending that summon's reaction. Using the
 * activity gives the actor an effect that removes the range limit on its attacks. The summon in range closest to the
 * spell's target carries it.
 */
export const touchDelivery = {
    rules: 'all',
    version: '2.1.11',
    category: 'summons',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: prepare,
            priority: 50
        }
    ],
    genericConfig: {
        summonIdentifier: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TouchDelivery.SummonIdentifier.Label',
            hint: 'CHRISPREMADES.Macros.Generic.TouchDelivery.SummonIdentifier.Hint'
        },
        range: {
            default: 100,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.TouchDelivery.Range.Hint'
        },
        specialDuration: {
            default: '1Attack',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.TouchDelivery.SpecialDuration.Label',
            hint: 'CHRISPREMADES.Macros.Generic.TouchDelivery.SpecialDuration.Hint',
            options: [
                {value: '1Attack', label: 'CHRISPREMADES.Macros.Generic.TouchDelivery.NextAttack'},
                {value: '1Spell', label: 'CHRISPREMADES.Macros.Generic.TouchDelivery.NextSpell'}
            ]
        }
    }
};
export const touchDeliveryEffect = {
    rules: 'all',
    version: touchDelivery.version,
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: deliver,
            priority: 50
        }
    ]
};
const configKeys = Object.keys(touchDelivery.genericConfig);

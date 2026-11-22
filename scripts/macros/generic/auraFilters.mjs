import {automationUtils, documentUtils, summonUtils, tokenUtils} from '../../proxy.mjs';
import {designateCreatures} from './wallSpell.mjs';
function grappled({sourceToken, targetToken}) {
    return tokenUtils.getGrappled(sourceToken).includes(targetToken);
}
/**
 * Aura filter that only passes creatures grappled by the aura's source.
 * Selected as an aura's `filter`. Fires on `filter`.
 */
export const grappledBySource = {
    rules: 'all',
    version: '2.1.3',
    aura: [
        {
            pass: 'filter',
            macro: grappled,
            priority: 50
        }
    ]
};
function summoner({source, target}) {
    return summonUtils.getSummonData(source)?.owner === target;
}
/**
 * Aura filter that only passes the summoner of the aura's source.
 * Selected as an aura's `filter`. Fires on `filter`.
 */
export const summonerOfSource = {
    rules: 'all',
    version: '2.1.3',
    aura: [
        {
            pass: 'filter',
            macro: summoner,
            priority: 50
        }
    ]
};
function notDesignated({source, target, sourceToken, targetToken, descriptor}) {
    const designated = source.flags['chris-premades']?.auraDesignated?.[descriptor.id];
    if (!designated) return tokenUtils.isEnemy(sourceToken, targetToken);
    return !designated.includes(target.uuid);
}
/**
 * Aura filter that skips the creatures the caster designated when casting the spell, or the caster's allies when nothing was designated.
 * Selected as an aura's `filter`. Fires on `filter`.
 */
export const notDesignatedBySource = {
    rules: 'all',
    version: '2.1.4',
    aura: [
        {
            pass: 'filter',
            macro: notDesignated,
            priority: 50
        }
    ]
};
async function designate({document: item, workflow}) {
    if (workflow.activity.id !== item.system.activities.contents[0]?.id) return;
    const identifier = documentUtils.getIdentifier(item);
    const key = 'auraDesignated.' + identifier;
    if (!automationUtils.getGenericConfigValue(item, 'chris-premades', 'auraDesignation', 'choose')) {
        if (workflow.actor.flags['chris-premades']?.auraDesignated?.[identifier]) await documentUtils.setFlag(workflow.actor, 'chris-premades', key, null);
        return;
    }
    await designateCreatures(item, workflow, workflow.actor, 'CHRISPREMADES.Macros.Generic.AuraDesignation.Prompt', key);
}
/**
 * When the spell's first activity is used, prompts the caster for creatures its aura leaves unaffected. The caster is
 * always unaffected. Pair it with the `notDesignatedBySource` aura filter on an aura whose identifier matches the item's.
 */
export const auraDesignation = {
    rules: 'all',
    version: '2.1.4',
    category: 'targeting',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemPreambleComplete',
            macro: designate,
            priority: 50
        }
    ],
    genericConfig: {
        choose: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AuraDesignation.Choose.Label',
            hint: 'CHRISPREMADES.Macros.Generic.AuraDesignation.Choose.Hint'
        }
    }
};

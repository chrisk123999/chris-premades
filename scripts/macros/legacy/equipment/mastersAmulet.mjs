import {actorUtils, automationUtils, genericUtils, itemUtils} from '../../../proxy.mjs';
import {transferHalfDamage} from '../../modern/monsters/construct/shieldGuardian/bound.mjs';
async function link({document: item, workflow}) {
    const actor = workflow.targets.first()?.actor;
    if (!actor) return;
    if (!actorUtils.getItemByIdentifier(actor, 'bound')) return genericUtils.notify('CHRISPREMADES.Macros.Legacy.MastersAmulet.MissingBound', {type: 'warn'});
    if (!actor.prototypeToken.actorLink) genericUtils.notify('CHRISPREMADES.Macros.Legacy.MastersAmulet.Unlinked', {type: 'warn'});
    await automationUtils.setConfigValue(item, 'guardian', actor.uuid);
    genericUtils.notify('CHRISPREMADES.Macros.Legacy.MastersAmulet.Linked', {format: {name: actor.name}});
}
async function damaged({document: item, ditem}) {
    if (!ditem.isHit || !itemUtils.getEquipmentState(item) || ditem.totalDamage <= 0) return;
    const guardian = await fromUuid(automationUtils.getConfigValue(item, 'guardian') || '');
    const guardianToken = guardian && actorUtils.getFirstToken(guardian);
    if (!guardianToken || !actorUtils.getItemByIdentifier(guardianToken.actor, 'bound')) return;
    const wearerToken = actorUtils.getFirstToken(item.actor);
    if (wearerToken) await transferHalfDamage(ditem, wearerToken, guardianToken, automationUtils.getConfigValue(item, 'distance'));
}
export const mastersAmulet = {
    name: 'Master\'s Amulet',
    version: '2.1.8',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: link,
            priority: 50
        },
        {
            pass: 'targetDamageFlatReductions',
            macro: damaged,
            priority: 250
        }
    ],
    config: {
        distance: {
            default: 60,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'homebrew'
        },
        guardian: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Legacy.MastersAmulet.Guardian',
            category: 'mechanics'
        }
    }
};

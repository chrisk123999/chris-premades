import cprConstants from '../../../constants.mjs';
import utils from '../../../utils.mjs';
import {actorUtils, compendiumUtils, documentUtils, effectUtils, Logging} from '../../../proxy.mjs';

async function use({document: item, workflow}) {
    if (workflow.activity.identifier !== 'lucky-charm') return;
    const casterEffect = documentUtils.getEffectByIdentifier(item, 'luckyCharmCaster');
    if (!casterEffect) return Logging.addMacroWarning('CPR', 'lucky-charm', 'CHRISPREMADES.Macros.Modern.LuckyCharm.MissingEffect', {notify: 'warn'});
    const charmData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, 'lucky-charm-object', {object: true});
    if (!charmData) return Logging.addMacroWarning('CPR', 'lucky-charm', 'CHRISPREMADES.Macros.Modern.LuckyCharm.MissingItem', {notify: 'warn'});
    const concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, item);
    const effectData = documentUtils.getEffectData(workflow.activity, casterEffect.id, {parentEntity: concentrationEffect, activityUuid: workflow.activity.uuid});
    const [sourceEffect] = await effectUtils.createEffects(workflow.actor, [effectData]) ?? [];
    if (!sourceEffect) return;
    await utils.deleteCharms(workflow.actor, 'luckyCharm');
    const carrier = workflow.targets.first()?.actor ?? workflow.actor;
    await utils.createCharms(carrier, [charmData], {key: 'luckyCharm', source: workflow.actor});
}
async function track(item, added) {
    const sourceUuid = item.flags['chris-premades']?.luckyCharm?.source;
    const source = fromUuidSync(sourceUuid, {strict: false});
    const casterEffect = source ? actorUtils.getEffectByIdentifier(source, 'luckyCharmCaster') : undefined;
    if (!casterEffect) return;
    const key = 'flags.chris-premades.luckyCharm.charms.' + (added ? '' : '-=') + item.uuid.replaceAll('.', '_');
    await documentUtils.update(casterEffect, {[key]: added ? item.uuid : null});
    if (added) {
        const held = item.actor?.uuid === sourceUuid;
        await Promise.all(item.effects.filter(effect => effect.transfer && effect.disabled !== held).map(effect => documentUtils.update(effect, {disabled: held})));
    }
    const tracked = Object.values(casterEffect.flags['chris-premades']?.luckyCharm?.charms ?? {});
    const carried = tracked.some(uuid => fromUuidSync(uuid, {strict: false})?.actor?.uuid !== sourceUuid);
    if (casterEffect.disabled === carried) await documentUtils.update(casterEffect, {disabled: !carried});
}
async function created({document: item}) {
    await track(item, true);
}
async function deleted({document: item}) {
    await track(item, false);
}
async function ended({document: effect}) {
    const actor = effect.parent;
    if (!actor || actorUtils.getEffectByIdentifier(actor, 'luckyCharmCaster')) return;
    await utils.deleteCharms(actor, 'luckyCharm');
}
export const luckyCharm = {
    name: 'Lucky Charm',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
export const luckyCharmCaster = {
    name: 'Lucky Charm: Misfortune',
    version: luckyCharm.version,
    rules: luckyCharm.rules,
    effect: [
        {
            pass: 'deleted',
            macro: ended,
            priority: 50
        }
    ]
};
export const luckyCharmObject = {
    name: 'Lucky Charm: Object',
    version: luckyCharm.version,
    rules: luckyCharm.rules,
    item: [
        {
            pass: 'created',
            macro: created,
            priority: 50
        },
        {
            pass: 'deleted',
            macro: deleted,
            priority: 50
        }
    ]
};

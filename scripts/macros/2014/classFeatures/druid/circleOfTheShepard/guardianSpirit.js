import {activityUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
// setup is in summons.js - handleSpecialUpdates()
async function turnEnd({trigger: {entity: effect, token}}) {
    let summoner = await fromUuid(effect.flags['chris-premades']?.guardianSpirit?.sourceActor);
    if (!summoner) return;
    let spiritTotemEffect = effectUtils.getEffectByIdentifier(summoner, 'spiritTotem');
    if (!spiritTotemEffect) return;
    let totem = canvas.tokens.get(spiritTotemEffect.flags['chris-premades']?.summons?.ids[spiritTotemEffect.name][0]);
    if (!totem) return;
    if (tokenUtils.getDistance(token, totem) > 30) return;
    let feature = itemUtils.getItemByIdentifier(summoner, 'guardianSpirit');
    if (!feature) return;
    let activity = activityUtils.getActivityByIdentifier(feature, 'guardianSpiritHeal', {strict: true});
    if (!activity) return;
    let classIdentifier = itemUtils.getConfig(feature, 'classIdentifier') || 'druid';
    let levels = summoner.classes[classIdentifier]?.system.levels ?? 0;
    let formula = Math.floor(levels * 0.5);
    if (!formula) genericUtils.notify(classIdentifier + ' : ' + genericUtils.translate('CHRISPREMADES.Macros.InsightfulManipulator.NoLevel'), 'warn');
    activity = activityUtils.withChangedDamage(activity, formula);
    await workflowUtils.syntheticActivityDataRoll(activity, feature, summoner, [token]);
}
export let guardianSpirit = {
    name: 'Guardian Spirit',
    version: '1.5.14',
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'druid',
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let guardianSpiritCombat = {
    name: 'Guardian Spirit Turn End',
    version: guardianSpirit.version,
    combat: [
        {
            pass: 'turnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};

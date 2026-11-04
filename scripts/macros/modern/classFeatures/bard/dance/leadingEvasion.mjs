import {automationUtils, effectUtils, genericUtils, Logging, rollUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function save({document: item, macroClass: {identifier, source}, sourceToken, workflow}) {
    if (!workflow.targets.size || !workflow.activity.hasSave || !workflow.activity.hasDamage) return;
    if (!workflow.activity.save.ability.has('dex')) return;
    if (item.actor.statuses.has('incapacitated')) return;
    if (!sourceToken) return Logging.addMacroWarning(source, identifier, `Leading Evasion exited early with no active token. (item) ${item.uuid}`);
    const effect = item.effects.contents[0]?.toObject();
    if (!effect) Logging.addMacroWarning(source, identifier, `Leading Evasion exited early due to a missing active effect. (item) ${item.uuid}`);
    const rangeFormula = automationUtils.getConfigValue(item, 'range');
    const range = (await rollUtils.rollDice(rangeFormula, {document: item}))?.total;
    if (!range) return Logging.addMacroWarning(source, identifier, `Leading Evasion exited early due to a failed formula parse. (activity) ${item.uuid} (range) ${rangeFormula}`);
    const near = tokenUtils.findNearby(sourceToken, range, {disposition: 'ally'}).filter(t => workflow.targets.some(tgt => tgt.id === t.id));
    if (!near.length) Logging.addMacroWarning(source, identifier, `Leading Evasion exited early with no nearby allies. (item) ${item.uuid}`);
    genericUtils.setProperty(effect, 'flags.cat.noAnimation', true);
    effect.duration.units = 'seconds';
    effect.duration.value = 1;
    if (effect.flags.cat?.specialDuration)
        effect.flags.cat.specialDuration.push('endOfWorkflow');
    else
        genericUtils.setProperty(effect, 'flags.cat.specialDuration', ['endOfWorkflow']);
    await Promise.all(near.map(t => effectUtils.createEffects(t.actor, [effect])));
    await workflowUtils.syntheticItemRoll(item);
}
export const leadingEvasion = {
    name: 'Leading Evasion',
    version: '2.1.7',
    rules: '2024',
    roll: [
        {
            pass: 'targetPreambleComplete',
            macro: save,
            priority: 300
        }
    ],
    config: {
        range: {
            default: '5',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range'
        }
    }
};

import {documentUtils, effectUtils, Logging} from '../../../proxy.mjs';
async function damage({document, workflow, castData}) {
    if (!workflow.targets.size) return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'aid');
    if (!sourceEffect) return Logging.addMacroWarning('CPR', 'aid', 'CHRISPREMADES.Macros.Modern.Aid.MissingEffect', {notify: 'warn'});
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id);
    const rollData = workflow.item.getRollData();
    rollData.item.level = castData.castLevel;
    effectData.system.changes = effectData.system.changes.map(change => ({
        ...change,
        value: String(new Roll(String(change.value), rollData).evaluateSync({strict: false}).total)
    }));
    await Promise.all(workflow.targets.map(token => effectUtils.createEffects(token.actor, [effectData])));
}
export const aid = {
    name: 'Aid',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemDamageRollComplete',
            macro: damage,
            priority: 50
        }
    ]
};

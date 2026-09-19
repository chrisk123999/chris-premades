import {dialogUtils, documentUtils, effectUtils, actorUtils, itemUtils, workflowUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    const target = workflow.targets.first();
    if (!target) return;
    let failedSave = false;
    const clairvoyant = actorUtils.getItemByIdentifier(workflow.actor, 'clairvoyant-combatant');
    const clairvoyantActivity = clairvoyant ? itemUtils.getActivityByIdentifier(clairvoyant, 'use') : undefined;
    if (clairvoyantActivity && clairvoyant.system.uses.value && await dialogUtils.confirmUseItem(clairvoyant)) {
        const featureWorkflow = await workflowUtils.completeActivityUse(clairvoyantActivity, [target.document]);
        failedSave = featureWorkflow?.failedSaves.size > 0;
    }
    const baseData = () => documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'awakenedMind'
    });
    const [sourceEffect] = await effectUtils.createEffects(workflow.actor, [baseData()]);
    if (!sourceEffect) return;
    const targetData = baseData();
    if (failedSave) targetData.changes = [
        {
            key: 'flags.midi-qol.disadvantage.attack.all',
            mode: 5,
            value: 'targetId === "' + workflow.token.id + '"',
            priority: 20
        },
        {
            key: 'flags.midi-qol.grants.advantage.attack.all',
            mode: 5,
            value: 'targetId === "' + workflow.token.id + '"',
            priority: 20
        }
    ];
    await effectUtils.createEffects(target.actor, [targetData], {parentEntity: sourceEffect});
}
export const awakenedMind = {
    name: 'Awakened Mind',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ]
};

import {automationUtils, dialogUtils, effectUtils, workflowUtils} from '../../../../../proxy.mjs';
async function early({document: item, workflow}) {
    if (!workflow.targets.size) return;
    if (workflow.item.type !== 'spell') return;
    if (workflow.item.system.school !== 'evo') return;
    if (!workflow.hasSave) return;
    const max = 1 + workflowUtils.getCastLevel(workflow);
    const allowEnemies = automationUtils.getConfigValue(item, 'allowEnemies');
    const targets = Array.from(workflow.targets).map(i => i.document);
    let selection = allowEnemies ? targets : targets.filter(i => i.disposition === workflow.token.document.disposition);
    if (selection.length > max || allowEnemies) {
        const dialogSelection = await dialogUtils.selectTargetDialog(item.name, _loc('CHRISPREMADES.Macros.Legacy.SculptSpells.Select', {max}), selection, {
            type: 'multiple',
            maxAmount: max,
            skipDeadAndUnconscious: false
        });
        if (!dialogSelection?.result?.length) return;
        selection = dialogSelection.result;
    }
    if (!selection.length) return;
    const effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        system: {
            changes: [
                {key: 'flags.midi-qol.min.ability.save.all', type: 'override', value: 100, priority: 120},
                {key: 'flags.midi-qol.superSaver.all', type: 'custom', value: 1, priority: 20}
            ]
        },
        flags: {cat: {noAnimation: true}}
    };
    for (const target of selection) {
        await effectUtils.createEffects(target.actor, [effectData], {specialDuration: ['endOfWorkflow']});
    }
}
export const sculptSpells = {
    name: 'Sculpt Spells',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: early,
            priority: 50
        }
    ],
    config: {
        allowEnemies: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.AllowEnemies',
            category: 'mechanics'
        }
    }
};

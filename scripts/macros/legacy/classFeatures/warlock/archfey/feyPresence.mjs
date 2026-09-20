import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    if (!workflow.failedSaves.size) return;
    const conditions = automationUtils.getConfigValue(document, 'conditions');
    const options = constants.statusOptions().filter(option => conditions.includes(option.value));
    if (!options.length) return;
    let selection = options[0].value;
    if (options.length > 1) {
        selection = await dialogUtils.buttonDialog(document.name, _loc('CHRISPREMADES.Macros.Legacy.FeyPresence.Select'), options.map(option => [option.label, option.value, {image: option.image}]));
        if (!selection) return;
    }
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        duration: {value: 1, units: 'rounds', expiry: 'turnEnd'}
    });
    effectData.statuses = [selection];
    for (const target of workflow.failedSaves) {
        if (actorUtils.checkTrait(target.actor, 'ci', selection)) continue;
        await effectUtils.createEffects(target.actor, [effectData]);
    }
}
export const feyPresence = {
    name: 'Fey Presence',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        conditions: {
            default: ['charmed', 'frightened'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.Conditions',
            category: 'homebrew',
            get options() { return constants.statusOptions(); }
        }
    }
};

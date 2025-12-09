import {genericUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let message = '';
    let damageVulnerabilities = workflow.targets.first().actor.system.traits.dv.value;
    if (damageVulnerabilities.size) {
        message += '<b>' + genericUtils.translate('DND5E.DamVuln') + ': </b><br>';
        for (let i of damageVulnerabilities) {
            message += CONFIG.DND5E.damageTypes[i].label + '<br>';
        }
    }
    let damageResistances = workflow.targets.first().actor.system.traits.dr.value;
    if (damageResistances.size) {
        message += '<b>' + genericUtils.translate('DND5E.DamRes') + ': </b><br>';
        for (let i of damageResistances) {
            message += CONFIG.DND5E.damageTypes[i].label + '<br>';
        }
    }
    let damageImmunities = workflow.targets.first().actor.system.traits.di.value;
    if (damageImmunities.size) {
        message += '<b>' + genericUtils.translate('DND5E.DamImm') + ': </b><br>';
        for (let i of damageImmunities) {
            message += CONFIG.DND5E.damageTypes[i].label + '<br>';
        } 
    }
    let conditionImmunities = workflow.targets.first().actor.system.traits.ci.value;
    if (conditionImmunities.size) {
        message += '<b>' + genericUtils.translate('DND5E.ConImm') + ': </b><br>';
        for (let i of conditionImmunities) {
            message += CONFIG.DND5E.conditionTypes[i].name + '<br>';
        } 
    }
    if (!message.length) return;
    message = await ChatMessage.create({
        speaker: workflow.chatCard.speaker,
        content: message,
        whisper: [game.user.id]
    });
}
export let extractAspects = {
    name: 'Extract Aspects',
    version: '1.3.162',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
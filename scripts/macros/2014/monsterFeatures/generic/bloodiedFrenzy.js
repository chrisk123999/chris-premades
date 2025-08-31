import {genericUtils, itemUtils} from '../../../../utils.js';
async function early({trigger: {entity: item}, workflow}) {
    if (workflow.targets.size !== 1) return;
    let hp = workflow.actor.system.attributes.hp;
    if (hp.pct > 50) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + item.name);
}
export let bloodiedFrenzy = {
    name: 'Bloodied Frenzy',
    translation: 'CHRISPREMADES.Macros.BloodiedFrenzy.Name',
    version: '1.3.38',
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: []
};
import {documentUtils, effectUtils, tokenUtils} from '../../../proxy.mjs';
async function use({document: item, workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    const targetToken = workflow.targets.first().document;
    const sourceToken = workflow.token.document;
    const ally = !tokenUtils.isEnemy(sourceToken, targetToken);
    const seconds = tokenUtils.getCombatData(sourceToken).inCombat ? 12 : 3600;
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        identifier: ally ? 'helpAlly' : 'helpEnemy',
        activityUuid: workflow.activity.uuid,
        duration: {seconds},
        changes: ally ? [
            {
                key: 'flags.midi-qol.advantage.ability.all',
                value: 1,
                priority: 20,
                type: 'custom'
            }
        ] : [
            {
                key: 'flags.midi-qol.grants.advantage.attack.all',
                value: 'workflow.token.document.id != "' + sourceToken.id + '"',
                priority: 20,
                type: 'custom'
            }
        ],
        specialDuration: ally ? ['turnStart'] : ['turnStart', 'attackedByAnotherCreature']
    });
    await effectUtils.createEffects(targetToken.actor, [effectData]);
}
export const help = {
    name: 'Help',
    version: '2.0.0',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};

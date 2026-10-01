import {documentUtils, effectUtils, tokenUtils} from '../../../proxy.mjs';
async function use({document: item, workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    const targetToken = workflow.targets.first().document;
    const sourceToken = workflow.token.document;
    const ally = !tokenUtils.isEnemy(sourceToken, targetToken);
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        identifier: ally ? 'helpAlly' : 'helpEnemy',
        activityUuid: workflow.activity.uuid,
        duration: {value: 1, units: 'rounds', expiry: 'turnStart'},
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
        specialDuration: ally ? [] : ['attackedByAnotherCreature']
    });
    const macros = ally ? ['check', 'skill', 'tool'].map(type => ({type, macros: [{source: 'chris-premades', identifier: 'helpAlly', rules: 'all'}]})) : undefined;
    await effectUtils.createEffects(targetToken.actor, [effectData], {macros});
}
async function consumed({document}) {
    await documentUtils.deleteDocument(document);
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
const consumedPass = [
    {
        pass: 'actorPost',
        macro: consumed,
        priority: 50
    }
];
export const helpAlly = {
    name: 'Help',
    version: '2.0.0',
    rules: 'all',
    check: consumedPass,
    skill: consumedPass,
    tool: consumedPass
};

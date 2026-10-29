import {dialogUtils, documentUtils} from '../../../proxy.mjs';
function confirm(effect) {
    return dialogUtils.confirm(effect.name, _loc('CHRISPREMADES.Macros.Legacy.PotionOfAdvantage.Use'));
}
async function situational({document: effect, options}) {
    if (options.advantage || !await confirm(effect)) return;
    options.advantage = true;
    await documentUtils.deleteDocument(effect);
}
async function attack({document: effect, workflow}) {
    if (!await confirm(effect)) return;
    workflow.tracker.advantage.add('potion-of-advantage', effect.name);
    await documentUtils.deleteDocument(effect);
}
export const potionOfAdvantageEffect = {
    name: 'Potion of Advantage: Effect',
    version: '2.1.5',
    rules: '2014',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attack,
            priority: 60
        }
    ],
    check: [
        {
            pass: 'actorSituational',
            macro: situational,
            priority: 50
        }
    ],
    save: [
        {
            pass: 'actorSituational',
            macro: situational,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'actorSituational',
            macro: situational,
            priority: 50
        }
    ],
    tool: [
        {
            pass: 'actorSituational',
            macro: situational,
            priority: 50
        }
    ]
};

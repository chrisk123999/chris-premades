import {rollUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    await rollUtils.contestedRoll({sourceToken: workflow.token, targetToken: workflow.targets.first(), sourceRollType: 'skill', targetRollType: 'skill', sourceAbilities: ['dec'], targetAbilities: ['ins']});
}
export let soulOfDeceit = {
    name: 'Soul of Deceit',
    version: '1.3.135',
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
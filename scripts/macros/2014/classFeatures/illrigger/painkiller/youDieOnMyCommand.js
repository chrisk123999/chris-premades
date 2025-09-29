import {thirdPartyUtils} from '../../../../../utils.js';
async function damage({trigger: {targetToken}, workflow, ditem}) {
    await thirdPartyUtils.damaged(workflow, ditem, targetToken, 'youDieOnMyCommand', 'use', {preventZeroHP: true});
}
export let youDieOnMyCommand = {
    name: 'You Die on My Command!',
    version: '1.3.78',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'sceneApplyDamage',
                macro: damage,
                priority: 100
            }
        ]
    }
};
import {itemUtils, thirdPartyUtils} from '../../../../../utils.js';
async function damage({trigger: {targetToken}, workflow, ditem}) {
    await thirdPartyUtils.damaged(workflow, ditem, targetToken, 'interdictBoonAbatingSeal', 'use');
}
async function added({trigger: {entity: item}}) {
    await itemUtils.multiCorrectActivityItemConsumption(item, ['use'], {
        0: 'balefulInterdict',
        1: 'interdictBoons'
    });
}
export let interdictBoonAbatingSeal = {
    name: 'Interdict Boons: Abating Seal',
    aliases: ['Abating Seal'],
    version: '1.3.76',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'sceneApplyDamage',
                macro: damage,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ]
};
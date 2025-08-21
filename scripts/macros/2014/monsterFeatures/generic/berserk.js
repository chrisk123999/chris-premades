import {itemUtils, genericUtils, effectUtils, workflowUtils, animationUtils} from '../../../../utils.js';
async function turnStart({trigger: {entity: item, token,}}) {
    let {hpThreshold, diceFormula, diceThreshold} = itemUtils.getGenericFeatureConfig(item, 'berserk'); //Why is diceFormula here but not used???
    let effect = effectUtils.getEffectByIdentifier(token.actor, 'berserk');
    if (effect) {
        if (token.actor.system.attributes.hp.value === 0 || token.actor.system.attributes.hp.value === token.actor.system.attributes.hp.max) {
            await genericUtils.remove(effect);
        }
    } else if (token.actor.system.attributes.hp.value <= hpThreshold) {
        let itemWorkflow = await workflowUtils.completeItemUse(item);
        if (itemWorkflow.utilityRolls[0].total >= diceThreshold) {
            let effectData = {
                name: item.name,
                img: item.img,
                origin: item.uuid,
                flags: {
                    dae: {
                        showIcon: true
                    }
                }
            };
            let effect = await effectUtils.createEffect(token.actor, effectData, {identifier: 'berserk'});
            /* eslint-disable indent */
            await new Sequence()
                .effect()
                    .file('jb2a.token_border.circle.static.blue.001')
                    .filter('ColorMatrix', animationUtils.colorMatrix('jb2a.token_border.circle.static.blue.001', 'piercing'))
                    .atLocation(token)
                    .scaleToObject(2)
                    .fadeIn(2000)
                    .fadeOut(2000)
                    .persist(true)
                    .tieToDocuments(effect)
                .play();
            /* eslint-enable indent */
        }
    }
}
export let berserk = {
    name: 'Berserk',
    translation: 'CHRISPREMADES.Macros.Berserk.Name',
    version: '1.1.0',
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'hpThreshold',
            label: 'CHRISPREMADES.Macros.Berserk.HPThreshold',
            type: 'number',
            default: 60,
        },
        {
            value: 'diceFormula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '1d6',
        },
        {
            value: 'diceThreshold',
            label: 'CHRISPREMADES.Macros.KeenSenses.DiceThreshold',
            type: 'number',
            default: 6,
        }
    ]
};
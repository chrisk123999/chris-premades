import {compendiumUtils, constants, effectUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.activity),
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 2,
                value: 'lightning',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 2,
                value: 'thunder',
                priority: 20
            },
            {
                key: 'flags.midi-qol.grants.disadvantage.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'zeroHP',
                    'turnStartSource'
                ]
            }
        }
    };
    effectUtils.addMacro(effectData, 'combat', ['maelstromAura']);
    await effectUtils.createEffect(workflow.actor, effectData);
}
async function turnStart({trigger: {entity: effect, token, target}}) {
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.featFeatures, 'Maelstrom Aura', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.MaelstromAura.Aura', flatDC: itemUtils.getSaveDC(originItem)});
    if (!featureData) return;
    await workflowUtils.syntheticItemDataRoll(featureData, token.actor, [target]);
}
export let maelstromAura = {
    name: 'Soul of the Storm Giant: Maelstrom Aura',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            priority: 50,
            distance: 10,
            disposition: 'enemy'
        }
    ]
};
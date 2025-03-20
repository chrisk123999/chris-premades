import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let targetEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.item),
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.traits.dr.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: '+1',
                priority: 20
            },
            {
                key: 'system.bonuses.abilities.save',
                mode: 2,
                value: '+1',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                wardingBond: {
                    bondUuid: workflow.token.document.uuid,
                    maxDistance: itemUtils.getConfig(workflow.item, 'maxDistance')
                },
                macros: {
                    movement: ['wardingBondTarget'],
                    midi: {
                        actor: ['wardingBondTarget']
                    }
                }
            }
        }
    };
    let casterEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: targetEffectData.duration,
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                wardingBond: {
                    bondUuids: Array.from(workflow.targets).map(i => i.document.uuid),
                    maxDistance: itemUtils.getConfig(workflow.item, 'maxDistance')
                },
                macros: {
                    movement: ['wardingBondSource']
                }
            }
        }
    };
    let effect = await effectUtils.createEffect(workflow.actor, casterEffectData, {
        identifier: 'wardingBondSource'
    });
    await Promise.all(workflow.targets.map(async token => {
        await effectUtils.createEffect(token.actor, targetEffectData, {identifier: 'wardingBondTarget', parentEntity: effect, interdependent: true});
    }));
}
// Note: Most logic is just in the legacy Warding Bond
export let wardingBond = {
    name: 'Warding Bond',
    version: '1.2.29',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['wardingBond']
            }
        ]
    },
    config: [
        {
            value: 'maxDistance',
            label: 'CHRISPREMADES.Macros.WardingBond.MaxDistance',
            type: 'text',
            default: 60,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
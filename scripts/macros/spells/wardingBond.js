import {effectUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let targetEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: {
            seconds: workflow.item.system.duration.value * 3600
        },
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
                    bond: workflow.token.document.uuid
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
    await Promise.all(workflow.targets.map(async token => {
        await effectUtils.createEffect(token.actor, targetEffectData, {concentrationItem: workflow.item, identifier: 'wardingBondTarget'});
    }));
    let casterEffectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: {
            seconds: workflow.item.system.duration.value * 3600
        },
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                wardingBond: {
                    bonds: Array.from(workflow.targets).map(i => i.document.uuid)
                },
                macros: {
                    movement: ['wardingBondSource']
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, casterEffectData, {concentrationItem: workflow.item, identifier: 'wardingBondSource'});
}
async function onHit({trigger}) {

}
async function movedTarget({trigger}) {

}
async function movedSource({trigger}) {

}
export let wardingBond = {
    name: 'Warding Bond',
    version: '0.12.0',
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
export let wardingBondTarget = {
    name: 'Warding Bond Target',
    version: wardingBond.version,
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: onHit,
                priority: 50
            }
        ]
    },
    movement: [
        {
            pass: 'moved',
            macro: movedTarget,
            priority: 50
        }
    ]
};
export let wardingBondSource = {
    name: 'Warding Bond Source',
    version: wardingBond.version,
    movment: [
        {
            pass: 'moved',
            macro: movedSource,
            priority: 50
        }
    ]
};
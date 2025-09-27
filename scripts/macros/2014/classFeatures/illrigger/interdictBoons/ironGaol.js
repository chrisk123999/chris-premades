import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.failedSaves.size) return;
    let native = false;
    if (workflow.failedSaves.first().actor.type === 'npc') {
        if (actorUtils.getLevelOrCR(workflow.failedSaves.first().actor) <= 4) native = true;
    }
    if (!native) native = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.IronGaol', {userId: socketUtils.gmID(), buttons: 'yesNo'});
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = {
        name: sourceEffect.name,
        img: sourceEffect.img,
        origin: sourceEffect.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'flags.midi-qol.superSaver.all',
                mode: 0,
                value: 1,
                priority: 20
            }, 
            {
                key: 'system.attributes.ac.bonus',
                mode: 5,
                value: 99,
                priority: 20
            },
            {
                key: 'flags.midi-qol.min.ability.save.all',
                mode: 5,
                value: 99,
                priority: 20
            },
            {
                key: 'flags.midi-qol.grants.noCritical.all',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'flags.midi-qol.neverTarget',
                mode: 0,
                value: 1,
                priority: 20
            },
            {
                key: 'macro.tokenMagic',
                mode: 0,
                value: 'spectral-body',
                priority: 20
            }
        ]
    };
    if (!native) {
        let sourceEffectData = genericUtils.duplicate(sourceEffect.toObject());
        effectData.changes.push(...sourceEffectData.changes);
    } else {
        genericUtils.setProperty(effectData, 'flags.dae.showIcon', true);
        delete effectData.duration;
    }
    await Promise.all(workflow.failedSaves.map(async token => {
        await effectUtils.createEffect(token.actor, effectData);
    }));
}
async function added({trigger: {entity: item}}) {
    await itemUtils.multiCorrectActivityItemConsumption(item, ['use'], {
        0: 'balefulInterdict',
        1: 'interdictBoons'
    });
}
export let interdictBoonIronGaol = {
    name: 'Interdict Boons: Iron Gaol',
    version: '1.3.76',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
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
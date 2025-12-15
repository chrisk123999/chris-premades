import {actorUtils, effectUtils, genericUtils} from '../../../utils.js';
async function use({trigger: {entity}, workflow}) {
    await Promise.all(workflow.targets.map(async i => {
        let effect = actorUtils.getEffects(i.actor).find(j => workflow.activity.effects.map(i => i.effect.uuid).includes(j.origin));
        await apply(workflow.actor, entity, effect ? {parentEffect: effect} : {});
    }));
}
async function apply(actor, item, options = {startsOutOfAir: false, parentEffect: {}}) {
    if (!actor) return;
    if (options.startsOutOfAir) {
        let effectOptions = {};
        if (options.parentEffect instanceof ActiveEffect) effectOptions.parentEntity = options.parentEffect;
        await outOfAirApply(actor, item, effectOptions);
        return;
    }
    let conMod = actor.system.abilities.con.mod;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.Suffocation.Name.HoldingBreath'),
        img: item?.system?.icon ?? 'icons/magic/air/wind-tornado-funnel-blue.webp',
        origin: item.document ? item.document.uuid : item.uuid,
        duration: {
            seconds: Math.max((conMod + 1 ) * 60, 30)
        },
        flags: {
            'chris-premades': {
                macros: {
                    effect: ['suffocation']
                }
            }
        }
    };
    let effectOptions = {
        rules: 'modern'
    };
    if (options.parentEffect instanceof ActiveEffect) effectOptions.parentEntity = options.parentEffect;
    await effectUtils.createEffect(actor, effectData, effectOptions);
}
async function holdingBreathDeleted({trigger: {entity}}) {
    if (entity.duration.remaining > 0) return;
    let actor = entity.parent;
    if (!actor) return;
    let item = effectUtils.getOriginItem(entity);
    let parentEntityUuid = entity.flags['chris-premades']?.parentEntityUuid;
    await outOfAirApply(actor, item, {parentEntity: parentEntityUuid ? await fromUuid(parentEntityUuid) : {}});
}
async function outOfAirApply(actor, item, options = {parentEntity: {}}) {
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.Suffocation.Name.OutOfAir'),
        img: item?.system?.icon ?? 'icons/magic/air/wind-tornado-funnel-blue.webp',
        origin: item.document ? item.document.uuid : item.uuid,
        duration: {
            seconds: 86400
        },
        flags: {
            'chris-premades': {
                macros: {
                    combat: ['suffocationOutOfAir'],
                    effect: ['suffocationOutOfAir']
                },
                suffocation: {
                    startingExhaustion: genericUtils.duplicate(actor.system.attributes.exhaustion ?? 0)
                }
            }
        }
    };
    let effectOptions = {
        rules: 'modern'
    };
    genericUtils.mergeObject(effectOptions, options);
    await effectUtils.createEffect(actor, effectData, effectOptions);
}
async function outOfAirTurnEnd({trigger: {entity}}) {
    let actor = entity.parent;
    let currentExhaustion = actor.system.attributes.exhaustion ?? 0;
    await genericUtils.update(actor, {'system.attributes.exhaustion': Math.min(currentExhaustion + 1, 6)});
}
async function outOfAirDeleted({trigger: {entity}}) {
    let actor = entity.parent;
    await genericUtils.update(actor, {'system.attributes.exhaustion': entity.flags['chris-premades'].suffocation.startingExhaustion});
}
const version = '1.3.34';
const rules = 'modern';
export let suffocation = {
    name: 'Suffocation',
    version,
    rules,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: holdingBreathDeleted,
            priority: 50
        }
    ],
    utilFunctions: {
        apply
    }
};
export let suffocationOutOfAir = {
    name: 'Suffocation End',
    version,
    rules,
    effect: [
        {
            pass: 'deleted',
            macro: outOfAirDeleted,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'turnEnd',
            macro: outOfAirTurnEnd,
            priority: 50
        }
    ]
};
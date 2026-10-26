import {actorUtils, dialogUtils, genericUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function rage({data, document: activity, macroClass: {source}}) {
    genericUtils.setProperty(data.effectData, `flags.${source}.spiritShield.activity`, activity.uuid);
    const macro = {source, rules: spiritShield.rules, identifier: 'spiritShieldProtect'};
    if (data.effectData.flags.cat?.macros?.roll)
        data.effectData.flags.cat.macros.roll.push(macro);
    else 
        genericUtils.setProperty(data.effectData, 'flags.cat.macros.roll', [macro]);
}
async function damage({ditem, macroClass: {identifier, source}, targetToken, token: attacker}) {
    if (!ditem.isHit || !ditem.totalDamage) return;
    const near = tokenUtils.findNearby(targetToken, 30, {disposition: 'ally'});
    for (const ally of near) {
        if (!ditem.totalDamage) return;
        if (actorUtils.hasUsedReaction(ally.actor)) continue;
        const rage = actorUtils.getEffectByIdentifier(ally.actor, 'rage');
        if (!rage) continue;
        const activity = await fromUuid(rage.flags[source]?.spiritShield?.activity);
        if (!activity) {
            Logging.addMacroWarning(source, identifier, `Spirit Shield exited early without locating its activity. (rage) ${rage.uuid} (activity) ${rage.flags[source]?.spiritShield?.activity}`);
            continue;
        }
        if (!await dialogUtils.confirm(
            activity.item.name,
            _loc('CHRISPREMADES.Macros.All.Interception.Prompt', {item: activity.item.name, name: targetToken.name}),
            {userId: queryUtils.firstOwner(ally.actor, true)}
        )) {
            Logging.addMacroWarning(source, identifier, `Spirit Shield exited early due to a declined prompt. (actor) ${ally.actor.uuid}`);
            continue;
        }
        const options = {};
        workflowUtils.setWorkflowProperty(options, 'spiritShieldDamage', ditem.totalDamage);
        const roll = (await workflowUtils.syntheticActivityRoll(activity, [attacker], {options}))?.utilityRoll.total;
        if (!roll) return Logging.addMacroWarning(source, identifier, `Spirit Shield exited early due to a failed roll parse. (activity) ${activity.uuid}`);
        workflowUtils.modifyDamageAppliedFlat(ditem, -roll);
    }
}
// raging, reaction ally see 30ft reduce by roll
export const spiritShield = {
    name: 'Spirit Shield',
    version: '2.1.4',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: rage,
            priority: 250
        }
    ],
    config: {
        subclassIdentifier: {
            default: 'ancestral-guardian',
            type: 'text',
            label: 'CHRISPREMADES.Config.SubclassIdentifier',
            category: 'behavior'
        }
    },
    scales: [
        {
            identifier: 'spirit-shield',
            data:{
                type: 'ScaleValue',
                configuration: {
                    distance: {
                        units: ''
                    },
                    identifier: 'spirit-shield',
                    type: 'dice',
                    scale: {
                        6: {
                            number: 2,
                            faces: 6,
                            modifiers: []
                        },
                        10: {
                            number: 3,
                            faces: 6,
                            modifiers: []
                        },
                        14: {
                            number: 4,
                            faces: 6,
                            modifiers: []
                        }
                    }
                },
                value: {},
                title: 'Spirit Shield',
                icon: null
            }
        }
    ]
};
export const spiritShieldProtect = {
    version: spiritShield.version,
    rules: spiritShield.rules,
    roll: [
        {
            pass: 'sceneDamageFlatReductions',
            macro: damage,
            priority: 500
        }
    ]
};

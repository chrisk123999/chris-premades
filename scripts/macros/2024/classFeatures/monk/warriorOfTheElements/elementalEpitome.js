import {martialArts} from '../martialArts.js';
import {activityUtils, combatUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function swapResistance({trigger: {entity: item}}) {
    let effect = effectUtils.getEffectByIdentifier(item.parent, 'elementalAttunementEffect');
    if (!effect) return;
    let damageType = await chooseResistance(item);
    let resistance = effect.changes.find(c => c.key === 'system.traits.dr.value');
    if (resistance) resistance.value = damageType;
    else effect.changes.push(
        {
            key: 'system.traits.dr.value',
            value: damageType,
            mode: 2,
            priority: 20
        }
    );
    await genericUtils.update(effect, {changes: effect.changes});
}
export async function chooseResistance(item, context='CHRISPREMADES.Macros.InfuseItem.ResistanceType') {
    let damageTypes = itemUtils.getConfig(item, 'damageTypes');
    let prevChoice = item.flags['chris-premades']?.elementalEpitomeChoice;
    let choice = await dialogUtils.selectDamageType(damageTypes, item.name, context);
    if (choice) await genericUtils.setFlag(item, 'chris-premades', 'elementalEpitomeChoice', choice);
    return choice || prevChoice;
}
async function empoweredStrikes({trigger: {entity: effect}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    if (activityUtils.getIdentifier(workflow.activity) !== 'punch') return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'elementalEpitome');
    if (!feature?.system.uses.value) return;
    let classIdentifier = itemUtils.getConfig(feature, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(feature, 'scaleIdentifier');
    let bonusFormula = workflow.actor.system.scale[classIdentifier]?.[scaleIdentifier]?.formula;
    if (!bonusFormula) return;
    let activity = activityUtils.getActivityByIdentifier(feature, 'strike', {strict: true});
    if (!activity) return;
    if (!await dialogUtils.confirm(feature.name, genericUtils.format('CHRISPREMADES.Dialog.UseWeaponDamageExtra', {itemName: feature.name, bonusFormula}))) return;
    await workflowUtils.bonusDamage(workflow, bonusFormula, {damageType: workflow.damageRolls[0].options.type});
    await workflowUtils.syntheticActivityRoll(activity, [], {consumeResources: true, consumeUsage: true});
}
export async function startDestructiveStride(item) {
    let elementalAttunement = effectUtils.getEffectByIdentifier(item.parent, 'elementalAttunementEffect');
    if (!elementalAttunement) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    let formula = item.parent.system.scale[classIdentifier]?.[scaleIdentifier]?.formula;
    if (!formula) return;
    let damageType = await chooseResistance(item, 'CHRISPREMADES.Dialog.DamageType');
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'system.attributes.movement.speed',
                value: 20,
                mode: 2,
                priority: 20
            }
        ],
        duration: {
            seconds: 1,
            turns: 1
        },
        flags: {
            'chris-premades':{
                damageType,
                formula
            }
        }
    };
    effectUtils.addMacro(effectData, 'movement', ['elementalEpitomeDestructiveStride']);
    await effectUtils.createEffect(item.parent, effectData, {identifier: 'elementalEpitomeDestructiveStride', rules: 'modern'});
}
async function destructiveStride({options, trigger: {entity: effect, token}}) {
    let feature = await effectUtils.getOriginItem(effect);
    if (!feature) return;
    let activity = activityUtils.getActivityByIdentifier(feature, 'damage', {strict: true});
    if (!activity) return;
    let {damageType, formula} = effect.flags['chris-premades'] ?? {};
    if (!damageType || !formula) return;
    let startPoint = genericUtils.duplicate(options._movement[token.id].origin);
    let offset = token.document.width * canvas.grid.size / 2;
    startPoint.x += offset;
    startPoint.y += offset;
    let endPoint = {x: token.center.x, y: token.center.y};
    let radius = 5 + token.document.width * canvas.grid.distance;
    let affectedTokens = tokenUtils.getMovementHitTokens(startPoint, endPoint, radius).filter(t => {
        if (t.id === token.id) return;
        if (t.document.disposition === token.document.disposition) return;
        if (t.actor.flags['chris-premades']?.destructiveStrideDamaged) return;
        return true;
    });
    if (!affectedTokens.size) return;
    activity = activityUtils.withChangedDamage(activity, formula, [damageType]);
    await workflowUtils.syntheticActivityDataRoll(activity, feature, token.actor, affectedTokens);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.fixScales(item);
}
export let elementalEpitome = {
    name: 'Elemental Epitome',
    version: '1.5.22',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: swapResistance,
                priority: 50,
                activities: ['swap']
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 45
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 45
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 45
        }
    ],
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['acid', 'cold', 'fire', 'lightning', 'thunder'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'monk',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'martial-arts',
            category: 'homebrew',
            homebrew: true
        }
    ],
    ddbi: {
        correctedItems: {
            'Elemental Epitome': {
                system: {
                    uses: {
                        max: '1',
                        spent: '0',
                        recovery: [
                            {
                                period: 'turnStart',
                                type: 'recoverAll'
                            }
                        ]
                    }
                }
            }
        }
    },
    scales: martialArts.scales
};
export let elementalEpitomeEmpoweredStrikes = {
    name: 'Elemental Epitome: Empowered Strikes',
    version: elementalEpitome.version,
    rules: elementalEpitome.rules,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: empoweredStrikes,
                priority: 250
            }
        ]
    }
};
export let elementalEpitomeDestructiveStride = {
    name: 'Elemental Epitome: Destructive Stride',
    version: elementalEpitome.version,
    rules: elementalEpitome.rules,
    movement: [
        {
            pass: 'moved',
            macro: destructiveStride,
            priority: 50
        }
    ]
};

import {combatUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../utils.js';
async function targeted({trigger, workflow}) {
    if (!workflow.targets.size) return;
    await Promise.all(workflow.targets.map(async token => {
        let effect = effectUtils.getEffectByIdentifier(token.actor, 'resistanceEffect');
        if (!effect) return;
        if (genericUtils.getRules(effect) === 'legacy') return;
        if (!combatUtils.perTurnCheck(effect, 'resistance')) return;
        let damageType = effect.flags['chris-premades']?.resistance?.damageType;
        let formula = effect.flags['chris-premades']?.resistance?.formula;
        if (!formula || !damageType) return;
        let roll = await rollUtils.rollDice(formula);
        genericUtils.setProperty(workflow, 'chris-premades.resistance.rolls.' + token.document.id, roll);
        let effectData = {
            name: genericUtils.translate('CHRISPREMADES.Macros.Resistance.Name') + ': ' + damageType,
            img: effect.img,
            duration: {seconds: 1},
            changes: [
                {
                    key: 'system.traits.dm.amount.' + damageType,
                    mode: 2,
                    priority: 20,
                    value: -roll.total
                }
            ],
            flags: {
                'chris-premades': {
                    specialDuration: [
                        'endOfWorkflow'
                    ]
                }
            }
        };
        await effectUtils.createEffect(token.actor, effectData, {animate: false});
    }));
}
async function used({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.damageRolls?.length || !combatUtils.inCombat()) return;
    let damageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    await Promise.all(workflow.hitTargets.map(async token => {
        let effect = effectUtils.getEffectByIdentifier(token.actor, 'resistanceEffect');
        if (!effect) return;
        if (genericUtils.getRules(effect) === 'legacy') return;
        if (!combatUtils.perTurnCheck(effect, 'resistance')) return;
        if (workflow.activity.damage?.onSave === 'none' && !workflow.failedSaves.has(token)) return;
        let damageType = effect.flags['chris-premades']?.resistance?.damageType;
        if (!damageType) return;
        if (!damageTypes.has(damageType)) return;
        let damageItem = workflow.damageList.find(i => i.targetUuid === token.document.uuid);
        if (!damageItem) return;
        if (!damageItem.isHit) return;
        await combatUtils.setTurnCheck(effect, 'resistance');
        let roll = workflow['chris-premades']?.resistance?.rolls?.[token.document.id];
        if (roll) {
            await roll.toMessage({
                speaker: {alias: token.document.name},
                flavor: resistanceEffect.name
            });
        }
    }));
}
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let damageTypes = itemUtils.getConfig(workflow.item, 'damageTypes');
    let damageType = await dialogUtils.selectDamageType(damageTypes, workflow.item.name, 'CHRISPREMADES.Generic.SelectDamageType');
    if (!damageType) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    genericUtils.setProperty(effectData, 'flags.chris-premades.resistance', {
        damageType: damageType,
        formula: itemUtils.getConfig(workflow.item, 'formula')
    });
    await Promise.all(workflow.targets.map(async token => {
        await effectUtils.createEffect(token.actor, effectData, {concentrationItem: workflow.item});
    }));
}
export let resistance = {
    name: 'Resistance',
    version: '1.4.143',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '1d4',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['acid', 'bludgeoning', 'cold', 'fire', 'lightning', 'necrotic', 'piercing', 'poison', 'radiant', 'slashing', 'thunder'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let resistanceEffect = {
    name: 'Resistance: Effect',
    version: resistance.version,
    rules: resistance.rules,
    midi: {
        actor: [
            {
                pass: 'targetPreambleComplete',
                macro: targeted,
                priority: 250
            },
            {
                pass: 'targetRollFinished',
                macro: used,
                priority: 100
            }
        ]
    }
};
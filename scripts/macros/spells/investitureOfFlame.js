import {combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
import {start as startAnim, end as endAnim} from './fireShield.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Investiture of Flame: Fire', {object: true, getDescription: true, translate: 'CHRISPREMADES.macros.investitureOfFlame.fire', identifier: 'investitureOfFlameFire', castDataWorkflow: workflow});
    if (!featureData) {
        errors.missingPackItem();
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    featureData.system.save.dc = itemUtils.getSaveDC(workflow.item);
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    featureData.system.damage.parts = [
        [
            formula + '[' + damageType + ']',
            damageType
        ]
    ];
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        changes: [
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'cold',
                priority: 20
            },
            {
                key: 'system.traits.di.value',
                mode: 0,
                value: 'fire',
                priority: 20
            },
            {
                key: 'ATL.light.dim',
                mode: 4,
                value: 60,
                priority: 20
            },
            {
                key: 'ATL.light.bright',
                mode: 4,
                value: 30,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                fireShield: {
                    selection: 'fire',
                    playAnimation,
                },
                macros: {
                    movement: [
                        'investitureOfFlameFlaming'
                    ],
                    combat: [
                        'investitureOfFlameFlaming'
                    ],
                    effect: [
                        'investitureOfFlameFlaming'
                    ]
                }
            },
        }
    };
    // TODO: Need to disable autoanims here? If so should we do for others?
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'investitureOfFlame', vae: [{type: 'use', name: featureData.name, identifier: 'investitureOfFlameFire'}]});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures')});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
    await startAnim({
        trigger: {
            entity: effect
        }
    });
}
async function moveOrTurn({trigger: {entity: effect, castData, token, target}}) {
    let doDamage = false;
    if (!combatUtils.inCombat()) {
        doDamage = true;
    } else {
        let [targetCombatant] = game.combat.getCombatantsByToken(target.document);
        if (!targetCombatant) return;
        let lastTriggerTurn = targetCombatant.flags?.['chris-premades']?.investitureOfFlame?.[token.id]?.lastTriggerTurn;
        let prevTurn = game.combat['previous'].round + '-' + game.combat['previous'].turn;
        let currentTurn = game.combat['current'].round + '-' + game.combat['current'].turn;
        if (!lastTriggerTurn || ![prevTurn, currentTurn].includes(lastTriggerTurn)) {
            doDamage = true;
            await genericUtils.setFlag(targetCombatant, 'chris-premades', 'investitureOfFlame.' + token.id + '.lastTriggerTurn', currentTurn);
        }
    }
    if (!doDamage) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Investiture of Flame: Heat', {object: true, getDescription: true, translate: 'CHRISPREMADES.macros.investitureOfFlame.heat'});
    featureData.flags['chris-premades'] = {
        castData
    };
    await workflowUtils.syntheticItemDataRoll(featureData, token.actor, [target]);
}
async function end({trigger}) {
    await endAnim({trigger});
}
export let investitureOfFlame = {
    name: 'Investiture of Flame',
    version: '0.12.0',
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
            value: 'playAnimation',
            label: 'CHRISPREMADES.config.playAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.config.formula',
            type: 'text',
            default: '4d8',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.config.damageType',
            type: 'select',
            default: 'fire',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let investitureOfFlameFlaming = {
    name: 'Investiture of Flame: Flaming',
    verison: investitureOfFlame.version,
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'turnEndNear',
            macro: moveOrTurn,
            priority: 50,
            distance: 5,
            disposition: 'enemy'
        }
    ],
    movement: [
        {
            pass: 'movedNear',
            macro: moveOrTurn,
            priority: 50,
            distance: 5,
            disposition: 'enemy'
        }
    ]
};
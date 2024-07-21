import {actorUtils, animationUtils, compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (!workflow.targets.size) return;
    let maxMissiles = 2 + workflow.castData.castLevel;
    let [selection] = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.macros.magicMissile.select', {maxMissiles}), workflow.targets, {
        type: 'selectAmount',
        maxAmount: maxMissiles
    });
    if (!selection || !selection.length) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Magic Missile Bolt', {object: true, getDescription: true, translate: 'CHRISPREMADES.macros.magicMissile.bolt', castDataWorkflow: workflow});
    let rollEach = itemUtils.getConfig(workflow.item, 'rollEach');
    let formula = itemUtils.getConfig(workflow.item, 'formula');
    let damageType = itemUtils.getConfig(workflow.item, 'damageType');
    if (!rollEach) {
        let damageFormula = formula + '[' + damageType + '] + 1';
        if (itemUtils.getItemByIdentifer(workflow.actor, 'empoweredEvocation')) damageFormula += ' + ' + workflow.actor.system.abilities.int.mod;
        let damageRoll = await new CONFIG.Dice.DamageRoll(damageFormula, workflow.actor.getRollData(), {type: damageType}).evaluate();
        damageRoll.toMessage({
            rollMode: 'roll',
            speaker: workflow.chatCard.speaker,
            flavor: workflow.item.name
        });
        featureData.system.damage.parts = [
            [
                damageRoll.total + '[' + damageType + ']',
                damageType
            ]
        ];
    }
    let shieldedFeatureData = genericUtils.duplicate(featureData);
    shieldedFeatureData.system.damage.parts = [];
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck();
    let colors = [ 'grey', 'dark_red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    let lastColor = Math.floor((Math.random() * colors.length));
    let colorSelection = itemUtils.getConfig(workflow.item, 'color');
    if (playAnimation && colorSelection === 'random' || colorSelection === 'cycle') await Sequencer.Preloader.preloadForClients('jb2a.magic_missile');
    for (let {document: targetToken, value: numBolts} of selection) {
        if (isNaN(numBolts) || numBolts == 0) continue;
        let isShielded = false;
        let shieldItems = itemUtils.getAllItemsByIdentifier(targetToken.actor, 'shield').filter(i => !i.system.hasLimitedUses || i.system.uses.value);
        if (effectUtils.getEffectByIdentifier(targetToken.actor, 'shield')) {
            isShielded = true;
        } else if (!actorUtils.hasUsedReaction(targetToken.actor) && shieldItems.length) {
            shieldItems = shieldItems.filter(i => i.system.preparation.mode !== 'prepared' || i.system.preparation.prepared);
            shieldItems = shieldItems.filter(i => i.system.preparation.mode !== 'pact' || targetToken.actor.system.spells.pact.value);
            shieldItems = shieldItems.filter(i => i.system.hasLimitedUses || !i.system.level || (
                actorUtils.hasSpellSlots(targetToken.actor, i.system.level)
            ));
            let selectedSpell = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.macros.magicMissile.shield', shieldItems, {userId: socketUtils.firstOwner(targetToken.actor, true), addNoneDocument: true});
            if (selectedSpell) {
                await socketUtils.remoteRollItem(selectedSpell, {}, {targetUuids: [targetToken.document.uuid]}, socketUtils.firstOwner(targetToken, true));
                if (effectUtils.getEffectByIdentifier(targetToken.actor, 'shield')) isShielded = true;
            }
        }
        for (let i = 0; i < numBolts; i++) {
            if (playAnimation) {
                let path = 'jb2a.magic_missile.';
                if (colorSelection === 'random') {
                    path += colors[Math.floor(Math.random() * colors.length)];
                } else if (colorSelection === 'cycle') {
                    path += colors[lastColor];
                    lastColor++;
                    if (lastColor >= colors.length) lastColor = 0;
                } else {
                    path += colorSelection;
                }
                new Sequence().effect().file(path).atLocation(workflow.token).stretchTo(targetToken).randomizeMirrorY().missed(isShielded).play();
            }
            await workflowUtils.syntheticItemDataRoll(isShielded ? shieldedFeatureData : featureData, workflow.actor, [targetToken]);
        }
    }
}
export let magicMissile = {
    name: 'Magic Missile',
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
            value: 'damageType',
            label: 'CHRISPREMADES.config.damageType',
            type: 'select',
            default: 'force',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'formula',
            label: 'CHRISPREMADES.config.formula',
            type: 'text',
            default: '1d4',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'rollEach',
            label: 'CHRISPREMADES.macros.magicMissile.rollEach',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.config.playAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.config.color',
            type: 'select',
            default: 'purple',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.config.colors.blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.config.colors.green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.config.colors.purple',
                },
                {
                    value: 'yellow',
                    label: 'CHRISPREMADES.config.colors.yellow',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_red',
                    label: 'CHRISPREMADES.config.colors.darkRed',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.config.colors.orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'grey',
                    label: 'CHRISPREMADES.config.colors.grey',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.config.colors.random',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.config.colors.random',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'cycle',
                    label: 'CHRISPREMADES.config.colors.cycle',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
    ]
};
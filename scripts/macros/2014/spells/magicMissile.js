import {activityUtils, actorUtils, animationUtils, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    if (!workflow.targets.size) return;
    let maxMissiles = 2 + workflowUtils.getCastLevel(workflow);
    let [selection] = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.MagicMissile.Select', {maxMissiles}), workflow.targets, {
        type: 'selectAmount',
        maxAmount: maxMissiles
    });
    if (!selection || !selection.length) return;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'magicMissileBolt');
    let featureFlat = activityUtils.getActivityByIdentifier(workflow.item, 'magicMissileFlat');
    if (!feature && rollEach) {
        errors.missingActivity('magicMissileBolt');
        return;
    } else if (!featureFlat && !rollEach) {
        errors.missingActivity('magicMissileFlat');
        return;
    }
    let rollEach = itemUtils.getConfig(workflow.item, 'rollEach');
    let damageFormula = feature.damage.parts[0].formula;
    if (itemUtils.getItemByIdentifier(workflow.actor, 'empoweredEvocation')) damageFormula += ' + ' + workflow.actor.system.abilities.int.mod;
    let damageType = feature.damage.parts[0].types.first();
    if (!rollEach) {
        let damageRoll = await new CONFIG.Dice.DamageRoll(damageFormula, workflow.item.getRollData(), {type: damageType}).evaluate();
        await MidiQOL.displayDSNForRoll(damageRoll);
        await activityUtils.setDamage(featureFlat, damageRoll.total.toString(), ['force']);
    }
    let shieldedFeature = feature.clone({'damage.parts': []}, {keepId: true});
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
            ) || ['atwill', 'innate'].includes(i.system.preparation.mode));
            let selectedSpell = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.MagicMissile.Shield', shieldItems, {userId: socketUtils.firstOwner(targetToken.actor, true), addNoneDocument: true});
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
            await workflowUtils.syntheticActivityRoll(isShielded ? shieldedFeature : (rollEach ? feature : featureFlat), [targetToken], {options: {workflowOptions: {targetConfirmation: 'none'}}});
        }
    }
}
export let magicMissile = {
    name: 'Magic Missile',
    version: '1.1.10',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['magicMissile']
            }
        ]
    },
    config: [
        {
            value: 'rollEach',
            label: 'CHRISPREMADES.Macros.MagicMissile.RollEach',
            type: 'checkbox',
            default: false,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'color',
            label: 'CHRISPREMADES.Config.Color',
            type: 'select',
            default: 'purple',
            category: 'animation',
            options: [
                {
                    value: 'blue',
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'green',
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'purple',
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                },
                {
                    value: 'yellow',
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'dark_red',
                    label: 'CHRISPREMADES.Config.Colors.DarkRed',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'orange',
                    label: 'CHRISPREMADES.Config.Colors.Orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'grey',
                    label: 'CHRISPREMADES.Config.Colors.Grey',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'random',
                    label: 'CHRISPREMADES.Config.Colors.Random',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    value: 'cycle',
                    label: 'CHRISPREMADES.Config.Colors.Cycle',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
    ]
};
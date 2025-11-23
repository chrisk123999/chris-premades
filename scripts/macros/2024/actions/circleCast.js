import {activityUtils, actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../../utils.js';
async function startRitual({trigger, workflow}) {
    if (!workflow.token) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.targets.first().actor, 'circleCastEffect');
    if (effect) await genericUtils.remove(effect);
    let spells = actorUtils.getCastableSpells(workflow.actor).filter(i => i.system.level);
    if (!spells.length) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectSpell', spells, {sortAlphabetical: true});
    if (!selection) return;
    let types = [];
    if (selection.system.range.value) types.push(['CHRISPREMADES.Macros.CircleSpell.Augment', 'augment']);
    if (selection.system.properties.has('concentration')) types.push(['CHRISPREMADES.Macros.CircleSpell.Distribute', 'distribute']);
    if (selection.system.target.template.size) types.push(['CHRISPREMADES.Macros.CircleSpell.Expand', 'expand']);
    if (['minute', 'hour', 'day', 'week', 'month', 'year'].includes(selection.system.duration.units)) types.push(['CHRISPREMADES.Macros.CircleSpell.Prolong', 'prolong']);
    if (selection.system.target.template.size) types.push(['CHRISPREMADES.Macros.CircleSpell.Safeguard', 'safeguard']);
    if (selection.system.materials.cost) types.push(['CHRISPREMADES.Macros.CircleSpell.Supplant', 'supplant']);
    let type = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.CircleCast.SelectType', types, {displayAsRows: true});
    if (!type) return;
    let school = selection.system.school;
    let schoolAnimations = {
        abj: 'abjuration',
        con: 'conjuration',
        div: 'divination',
        enc: 'enchantment',
        evo: 'evocation',
        ill: 'illusion',
        nec: 'necromancy',
        trs: 'transmutation'
    };
    let schoolColor = itemUtils.getConfig(workflow.item, school + 'Color');
    let ritualAnimation = 'jb2a.magic_signs.circle.02.' + schoolAnimations[school];
    let strandColor = itemUtils.getConfig(workflow.item, 'strandColor');
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.duration = {seconds: 6, rounds: 1};
    let grids = itemUtils.getConfig(workflow.item, 'grids');
    genericUtils.setProperty(effectData, 'flags.chris-premades.circleCast', {
        participants: [],
        spellUuid: selection.uuid,
        type,
        strandColor,
        strands: 0,
        ritualAnimation,
        schoolColor,
        grids,
        tokenUuid: workflow.token.document.uuid
    });
    if (selection.system.activation.type != 'action') genericUtils.setProperty(effectData, 'flags.chris-premades.circleCast.ritual', true);
    switch(type) {
        case 'expand': {
            if (selection.system.target.template.type === 'line') {
                let direction = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.CircleSpell.WidthOrLength', [
                    ['CHRISPREMADES.Generic.Length', 'length'],
                    ['CHRISPREMADES.Generic.Width', 'width']
                ], {displayAsRows: true});
                if (!direction) return;
                genericUtils.setProperty(effectData, 'flags.chris-premades.circleCast.expandDirection', direction);
            }
        }
        // eslint-disable-next-line no-fallthrough
        case 'supplant':
            genericUtils.setProperty(effectData, 'flags.chris-premades.circleCast.slotLevel', 1);
            break;
        case 'prolong':
            genericUtils.setProperty(effectData, 'flags.chris-premades.circleCast.slotLevel', selection.system.level);
            break;
    }
    effect = await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, rules: 'modern', identifier: 'circleCastEffect'});
    new Sequence()
        .effect()
        .file(ritualAnimation + '.intro.' + schoolColor)
        .atLocation(workflow.token)
        .size(grids, {gridUnits: true})
        .belowTokens()
        .attachTo(workflow.token)
        .waitUntilFinished(-700)
        .effect()
        .file(ritualAnimation + '.loop.' + schoolColor)
        .atLocation(workflow.token)
        .size(grids, {gridUnits: true})
        .belowTokens()
        .persist()
        .attachTo(workflow.token)
        .name('circleCast-' + workflow.token.document.uuid)
        .play();
}
async function joinRitual({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.targets.first().actor, 'circleCastEffect');
    if (!effect) return;
    let participants = effect.flags['chris-premades'].circleCast.participants;
    if (participants?.includes(workflow.token.document.uuid)) return;
    if (effect.flags['chris-premades'].circleCast.ritual) {
        let maxConcentration = Number(workflow.actor.system.attributes.concentration.limit);
        let concentrationEffects = actorUtils.getEffects(workflow.actor).filter(i => i.statuses.has('concentrating'));
        if (maxConcentration <= concentrationEffects.length) {
            genericUtils.notify('CHRISPREMADES.Macros.CircleCast.Concentration', 'info', {localize: true});
            return;
        }
        let effects = await effectUtils.applyConditions(workflow.actor, ['concentrating']);
        await effectUtils.addDependent(effect, effects);
        await effectUtils.addDependent(effects[0], [effect]);
    }
    let type = effect.flags['chris-premades'].circleCast.type;
    let slotLevel = effect.flags['chris-premades'].circleCast.slotLevel ?? 1;
    switch (type) {
        case 'supplant':
        case 'prolong':
        case 'expand': {
            let spellSlots = actorUtils.hasSpellSlots(workflow.actor, slotLevel);
            if (!spellSlots) {
                genericUtils.notify('CHRISPREMADES.Macros.CircleCast.NoSpellSlots', 'info', {localize: true});
                return;
            }
            let slotName = 'system.spells.' + actorUtils.getEquivalentSpellSlotName(workflow.actor, slotLevel, {canCast: true}) + '.value';
            let value = genericUtils.getProperty(workflow.actor, slotName) - 1;
            await genericUtils.update(workflow.actor, {[slotName]: value});
            let tokenSpells = effect.flags['chris-premades'].circleCast.spellSlots ?? [];
            tokenSpells.push({uuid: workflow.actor.uuid, slotName});
            await genericUtils.setFlag(effect, 'chris-premades', 'circleCast.tokenSpells', tokenSpells);
        }
    }
    await genericUtils.setFlag(effect, 'chris-premades', 'circleCast.participants', [workflow.token.document.uuid, ...participants]);
    let lineColor = itemUtils.getConfig(workflow.item, 'lineColor');
    new Sequence()
        .effect()
        .file('jb2a.energy_beam.normal.' + lineColor + '.02')
        .fadeIn(500)
        .atLocation(workflow.token)
        .attachTo(workflow.token)
        .stretchTo(workflow.targets.first(), {attachTo: true})
        .belowTokens()
        .persist()
        .fadeOut(500)
        .tieToDocuments([effect])
        .play();
    let strandColor = effect.flags['chris-premades'].circleCast.strandColor;
    let strands = effect.flags['chris-premades'].circleCast.strands;
    strands++;
    new Sequence()
        .effect()
        .file('jb2a.energy_strands.overlay.' + strandColor + '.01')
        .fadeIn(1000)
        .atLocation(workflow.targets.first())
        .attachTo(workflow.targets.first())
        .startTimePerc(Math.random())
        .persist()
        .tieToDocuments([effect])
        .scaleToObject()
        .scale(1 + (strands * 0.5))
        .fadeOut(1000)
        .play();
    await genericUtils.setFlag(effect, 'chris-premades', 'circleCast.strands', strands);
}
async function completeRitual({trigger, workflow}) {
    let castEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'circleCastEffect');
    if (!castEffect) return;
    let participants = castEffect.flags['chris-premades'].circleCast.participants;
    if (!participants.length) {
        genericUtils.notify('CHRISPREMADES.Macros.CircleCast.MoreParticipants', 'info', {localize: true});
        return;
    }
    let spellUuid = castEffect.flags['chris-premades'].circleCast.spellUuid;
    if (!spellUuid) return;
    let spell = await fromUuid(spellUuid);
    if (!spell) return;
    let itemData = genericUtils.duplicate(spell.toObject());
    itemData.name += ' ' + genericUtils.translate('CHRISPREMADES.Macros.CircleCast.Circle');
    let strands = castEffect.flags['chris-premades'].circleCast.strands;
    let type = castEffect.flags['chris-premades'].circleCast.type;
    switch(type) {
        case 'augment': {
            if (strands >= 6) {
                itemData.system.range.value = 1;
                itemData.system.range.units = 'mile';
            } else {
                itemData.system.range.value = String(itemData.system.range.value) + ' + (1000 * ' + strands + ')';
            }
            break;
        }
        case 'expand': {
            if (castEffect.flags['chris-premades'].circleCast.expandDirection === 'width') {
                itemData.system.target.template.width = (itemData.system.target.template.width === '' ? '5' : itemData.system.target.template.width) + ' + (10 * ' + strands + ')';
            } else {
                itemData.system.target.template.size = itemData.system.target.template.size + ' + (10 * ' + strands + ')';
            }
            break;
        }
        case 'prolong': {
            if (itemData.system.duration.units === 'minute') {
                itemData.system.duration.units = 'hour',
                itemData.system.duration.value = Number(itemData.system.duration.value) / 60;
            }
            if (strands < 4) {
                itemData.system.duration.value = Number(itemData.system.duration.value) + 1;
            } else if (strands < 7) {
                itemData.system.duration.value = Number(itemData.system.duration.value) + 8;
            } else {
                itemData.system.duration.value = Number(itemData.system.duration.value) + 24;
            }
            break;
        }
        case 'supplant': {
            itemData.system.materials.cost = Math.max(0, Number(itemData.system.materials.cost) - (strands * 50));
            break;
        }
    }
    delete itemData._id;
    let sourceEffect = workflow.activity.effects?.[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    let effect = await effectUtils.createEffect(workflow.actor, effectData);
    if (type === 'safeguard') genericUtils.setProperty(itemData, 'flags.chris-premades.circleCast.safeguard', participants.length);
    let items = await itemUtils.createItems(workflow.actor, [itemData], {favorite: true, parentEntity: effect});
    await genericUtils.setFlag(castEffect, 'chris-premades', 'circleCast.complete', true);
    let circleConcentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (circleConcentrationEffect) {
        await genericUtils.setFlag(circleConcentrationEffect, 'dnd5e', 'dependents', []);
        await genericUtils.remove(circleConcentrationEffect);
    }
    await workflowUtils.completeItemUse(items[0]);
    await genericUtils.remove(castEffect);
    if (type != 'distribute') return;
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, items[0]);
    if (!concentrationEffect) return;
    await genericUtils.setFlag(concentrationEffect, 'chris-premades', 'circleCast.concentration.uuid', items[0].uuid);
    let effectImplementation = await ActiveEffect.implementation.fromStatusEffect('concentrating');
    if (!effectImplementation) return;
    let concentrationEffectData = effectImplementation.toObject();
    genericUtils.setProperty(concentrationEffectData, 'flags.dnd5e.dependents', concentrationEffect.flags.dnd5e.dependents);
    genericUtils.setProperty(concentrationEffectData, 'flags.chris-premades.circleCast.concentration.uuid', items[0].uuid);
    await Promise.all(participants.map(async uuid => {
        let token = await fromUuid(uuid);
        if (!token?.actor) return;
        await effectUtils.createEffect(token.actor, concentrationEffectData, {keepId: true});
    }));
}
async function removed({trigger: {entity: effect}, workflow}) {
    let endAnimation = effect.flags['chris-premades'].circleCast.ritualAnimation + '.outro.' + effect.flags['chris-premades'].circleCast.schoolColor;
    let tokenUuid = effect.flags['chris-premades'].circleCast.tokenUuid;
    if (tokenUuid) {
        let token = await fromUuid(tokenUuid);
        if (token) {
            new Sequence()
                .effect()
                .file(endAnimation)
                .atLocation(token)
                .attachTo(token)
                .size(effect.flags['chris-premades'].circleCast.grids, {gridUnits: true})
                .belowTokens()
                .play();
            await genericUtils.sleep(450);
            Sequencer.EffectManager.endEffects({source: token.object, name: 'circleCast-' + tokenUuid});
        }
    }
    if (effect.flags['chris-premades'].circleCast.complete) return;
    let tokenSpells = effect.flags['chris-premades'].circleCast.tokenSpells;
    if (!tokenSpells?.length) return;
    await Promise.all(tokenSpells.map(async data => {
        let actor = await fromUuid(data.uuid);
        if (!actor) return;
        let slots = genericUtils.getProperty(actor, data.slotName) + 1;
        await genericUtils.update(actor, {[data.slotName]: slots});
    }));
}
async function safeguard({trigger, workflow}) {
    if (!workflow.item || !workflow.template || !workflow.activity) return;
    let participants = workflow.item.flags['chris-premades']?.circleCast?.safeguard;
    if (!participants) return;
    let number = Math.max(activityUtils.getMod(workflow.activity) + participants, 1);
    let templateData = {
        t: 'rect',
        user: game.user.id,
        distance: 7.07,
        direction: 45,
        x: 0,
        y: 0,
        fillColor: game.user.color,
        flags: {
            dnd5e: {
                origin: workflow.activity.uuid
            },
            walledtemplates: {
                hideBorder: 'alwaysShow'
            },
            'chris-premades': {
                circleCast: {
                    origin: workflow.item.uuid
                }
            }
        },
        width: 10,
        angle: 0
    };
    let templates = [];
    await workflow.actor.sheet.minimize();
    genericUtils.notify('CHRISPREMADES.Macros.CircleCast.Safeguard.Message', 'info', {localize: true});
    for (let i = 0; i < number; i++) {
        let template = await templateUtils.placeTemplate(templateData, false);
        if (template) {
            templates.push(template);
        } else {
            break;
        }
    }
    await workflow.actor.sheet.maximize();
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'circleCast.safeguard', false);
    if (!templates.length) return;
    await templateUtils.attachToTemplate(workflow.template, templates.map(i => i.uuid));
    await effectUtils.addDependent(workflow.template, templates);
}
async function safeguardTarget({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let tokensToRemove = [];
    workflow.targets.forEach(token => {
        let found = templateUtils.getTemplatesInToken(token).find(i => i.flags['chris-premades']?.circleCast?.origin === workflow.item.uuid);
        if (found) tokensToRemove.push(token);
    });
    if (!tokensToRemove.length) return;
    await workflowUtils.removeTargets(workflow, tokensToRemove);
}
export let circleCast = {
    name: 'Circle Cast',
    version: '1.3.118',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: startRitual,
                priority: 50,
                activities: ['start']
            },
            {
                pass: 'rollFinished',
                macro: joinRitual,
                priority: 50,
                activities: ['join']
            },
            {
                pass: 'rollFinished',
                macro: completeRitual,
                priority: 50,
                activities: ['finish']
            }
        ],
        actor: [
            {
                pass: 'preambleComplete',
                macro: safeguard,
                priority: 10
            },
            {
                pass: 'preambleComplete',
                macro: safeguardTarget,
                priority: 20
            }
        ]
    },
    config: [
        {
            value: 'grids',
            label: 'CHRISPREMADES.Config.Grids',
            type: 'number',
            default: 13,
            category: 'animation'
        },
        {
            value: 'lineColor',
            label: 'CHRISPREMADES.Config.LineColor',
            type: 'select',
            default: 'bluepink',
            category: 'animation',
            options: [
                {
                    label: 'CHRISPREMADES.Config.Colors.BluePink',
                    value: 'bluepink'
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.DarkGreenPurple',
                    value: 'dark_greenpurple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.DarkPurpleRed',
                    value: 'dark_purplered',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.GreenYellow',
                    value: 'greenyellow',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Red',
                    value: 'red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    value: 'yellow',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'strandColor',
            label: 'CHRISPREMADES.Config.StrandColor',
            type: 'select',
            default: 'blue',
            category: 'animation',
            options: [
                {
                    label: 'CHRISPREMADES.Config.Colors.Grey',
                    value: 'grey',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.BlueOrange',
                    value: 'blueorange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.DarkGreen',
                    value: 'dark_green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.DarkRed',
                    value: 'dark_red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.DarkPurple',
                    value: 'dark_purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Orange',
                    value: 'orange',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.PinkYellow',
                    value: 'pinkyellow',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    value: 'purple',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'abjColor',
            label: 'CHRISPREMADES.Macros.CircleCast.AbjColor',
            type: 'select',
            default: 'blue',
            category: 'animation',
            options: [
                {
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    value: 'blue'
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    value: 'green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Pink',
                    value: 'pink',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    value: 'purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Red',
                    value: 'red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    value: 'yellow',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'conColor',
            label: 'CHRISPREMADES.Macros.CircleCast.ConColor',
            type: 'select',
            default: 'yellow',
            category: 'animation',
            options: [
                {
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    value: 'blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    value: 'green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Pink',
                    value: 'pink',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    value: 'purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Red',
                    value: 'red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    value: 'yellow'
                }
            ]
        },
        {
            value: 'divColor',
            label: 'CHRISPREMADES.Macros.CircleCast.DivColor',
            type: 'select',
            default: 'blue',
            category: 'animation',
            options: [
                {
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    value: 'blue'
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    value: 'green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Pink',
                    value: 'pink',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    value: 'purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Red',
                    value: 'red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    value: 'yellow',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'encColor',
            label: 'CHRISPREMADES.Macros.CircleCast.EncColor',
            type: 'select',
            default: 'pink',
            category: 'animation',
            options: [
                {
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    value: 'blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    value: 'green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Pink',
                    value: 'pink'
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    value: 'purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Red',
                    value: 'red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    value: 'yellow',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'evoColor',
            label: 'CHRISPREMADES.Macros.CircleCast.EvoColor',
            type: 'select',
            default: 'red',
            category: 'animation',
            options: [
                {
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    value: 'blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    value: 'green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Pink',
                    value: 'pink',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    value: 'purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Red',
                    value: 'red'
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    value: 'yellow',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'illColor',
            label: 'CHRISPREMADES.Macros.CircleCast.IllColor',
            type: 'select',
            default: 'purple',
            category: 'animation',
            options: [
                {
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    value: 'blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    value: 'green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Pink',
                    value: 'pink',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    value: 'purple'
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Red',
                    value: 'red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    value: 'yellow',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'necColor',
            label: 'CHRISPREMADES.Macros.CircleCast.NecColor',
            type: 'select',
            default: 'green',
            category: 'animation',
            options: [
                {
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    value: 'blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    value: 'green'
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Pink',
                    value: 'pink',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    value: 'purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Red',
                    value: 'red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    value: 'yellow',
                    requiredModules: ['jb2a_patreon']
                }
            ]
        },
        {
            value: 'trsColor',
            label: 'CHRISPREMADES.Macros.CircleCast.TrsColor',
            type: 'select',
            default: 'yellow',
            category: 'animation',
            options: [
                {
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    value: 'blue',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    value: 'green',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Pink',
                    value: 'pink',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Purple',
                    value: 'purple',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Red',
                    value: 'red',
                    requiredModules: ['jb2a_patreon']
                },
                {
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    value: 'yellow'
                }
            ]
        }
    ]
};
export let circleCastEffect = {
    name: 'Circle Cast: Effect',
    version: circleCast.version,
    rules: circleCast.rules,
    effect: [
        {
            pass: 'deleted',
            macro: removed,
            priority: 50
        }
    ]
};
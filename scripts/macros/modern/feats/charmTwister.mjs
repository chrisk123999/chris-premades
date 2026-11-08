import utils from '../../../utils.mjs';
import cprConstants from '../../../constants.mjs';
import {automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, genericUtils, Logging, rollUtils, workflowUtils} from '../../../proxy.mjs';
function getSaveDC(actor, item) {
    const castActivity = item.system.activities.getByType('cast')[0];
    const ability = castActivity?.spell.ability || actor.system.attributes.spellcasting || 'int';
    return actor.system.abilities[ability]?.dc;
}
async function weave({document: activity, workflow}) {
    const targetToken = workflow.targets.first();
    if (!targetToken?.actor || targetToken.actor === workflow.actor) {
        genericUtils.notify('CHRISPREMADES.Macros.Modern.TwistedHex.Target', {type: 'warn'});
        return;
    }
    let ability = automationUtils.getConfigValue(activity.item, 'ability');
    if (!ability) {
        const buttons = constants.abilityOptions.map(option => [option.label, option.value, {image: option.image}]);
        ability = await dialogUtils.buttonDialog(activity.item.name, 'CHRISPREMADES.Macros.Modern.TwistedHex.Ability', buttons);
        if (!ability) return;
    }
    const itemData = await compendiumUtils.getDocumentByIdentifier(cprConstants.packs.misc.automationItems, 'twisted-hex-charm', {object: true, translate: 'CHRISPREMADES.Macros.Modern.TwistedHex.Charm'});
    if (!itemData) return Logging.addMacroWarning('CPR', 'twisted-hex', 'Twisted Hex charm missing from the automation items compendium.', {notify: 'warn'});
    itemData.effects.forEach(effect => effect.system.changes.forEach(change => change.key = change.key.replaceAll('{ability}', ability)));
    genericUtils.setProperty(itemData, 'flags.chris-premades.twistedHex', {ability, dc: getSaveDC(workflow.actor, activity.item)});
    await utils.deleteCharms(workflow.actor, 'twistedHex');
    await utils.createCharms(targetToken.actor, [itemData], {key: 'twistedHex', source: workflow.actor});
}
async function resist(charm, actor, ability) {
    const hexData = charm.flags['chris-premades']?.twistedHex;
    if (!hexData?.dc || hexData.ability !== ability || hexData.source === actor.uuid) return;
    const roll = await rollUtils.requestRoll(actor, 'save', 'cha', {rollDC: hexData.dc});
    if (roll?.total >= hexData.dc) await documentUtils.deleteDocument(charm);
}
async function checkPost({document, actor, roll, checkId}) {
    if (!roll?.isFailure) return;
    await resist(document, actor, checkId);
}
async function skillPost({document, actor, roll, config}) {
    if (!roll?.isFailure) return;
    await resist(document, actor, config.ability);
}
async function toolPost({document, actor, roll, config, toolId}) {
    if (!roll?.isFailure) return;
    await resist(document, actor, config.ability ?? actor.system.tools?.[toolId]?.ability ?? CONFIG.DND5E.tools[toolId]?.ability);
}
async function attackFinished({document, actor, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack') || !workflow.targets.size || workflow.hitTargets.size) return;
    await resist(document, actor, workflow.activity.ability);
}
async function filterTargets({document: activity, workflow}) {
    if (!workflow.targets.size) return;
    const charms = automationUtils.getConfigValue(activity.item, 'charms');
    const invalid = Array.from(workflow.targets).filter(target => !utils.carriesCharm(target.actor, workflow.actor, charms));
    if (!invalid.length) return;
    genericUtils.notify('CHRISPREMADES.Macros.Modern.OldBlessing.NoCharm', {type: 'warn', format: {names: invalid.map(target => target.name).join(', ')}});
    await workflowUtils.removeTargets(workflow, invalid);
    if (!workflow.targets.size) return true;
}
export const charmTwister = {
    name: 'Charm Twister',
    version: '2.1.8',
    rules: '2024',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: weave,
            priority: 50
        }
    ],
    config: {
        ability: {
            default: '',
            type: 'select',
            label: 'CHRISPREMADES.Config.Ability',
            category: 'homebrew',
            get options() { return [{value: '', label: 'CHRISPREMADES.Macros.Modern.TwistedHex.Ask'}, ...constants.abilityOptions]; }
        },
        charms: {
            default: ['wickerToken', 'twistedHex', 'soulboundPoppet'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.Modern.OldBlessing.Charms',
            category: 'homebrew',
            options: [
                {value: 'wickerToken', label: 'CHRISPREMADES.Macros.Modern.WickerToken.Token'},
                {value: 'twistedHex', label: 'CHRISPREMADES.Macros.Modern.TwistedHex.Charm'},
                {value: 'soulboundPoppet', label: 'CHRISPREMADES.Macros.Modern.OldBlessing.Poppet'}
            ]
        }
    }
};
export const oldBlessing = {
    version: charmTwister.version,
    rules: charmTwister.rules,
    roll: [
        {
            pass: 'castEnchantmentTargeting',
            macro: filterTargets,
            priority: 40
        }
    ]
};
export const twistedHexCharm = {
    name: 'Twisted Hex Charm',
    version: '2.1.4',
    rules: '2024',
    check: [
        {
            pass: 'actorPost',
            macro: checkPost,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'actorPost',
            macro: skillPost,
            priority: 50
        }
    ],
    tool: [
        {
            pass: 'actorPost',
            macro: toolPost,
            priority: 50
        }
    ],
    roll: [
        {
            pass: 'actorRollFinished',
            macro: attackFinished,
            priority: 50
        }
    ]
};

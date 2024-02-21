import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
class chrisRoll extends Roll {
    get isCritical() {
        if (this.options.fakeType === 'critical') return true;
        return false;
    }
    get isFumble() {
        if (this.options.fakeType === 'fumble') return true;
        return false;
    }
}
async function attackRoll(workflow) {
    if (!workflow.attackRoll) return;
    let firstOwner = warpgate.util.firstOwner(workflow.token);
    let ignoreGM = game.settings.get('chris-premades', 'Ignore GM');
    if (ignoreGM && firstOwner.isGM) return;
    let rollSettings = game.settings.get('chris-premades', 'Manual Rolling Players');
    let rollSetting = rollSettings[firstOwner.id] ?? 'default';
    if (rollSetting === 'default') return;
    let targetUser = (rollSetting === 'player') ? firstOwner : game.users.get(chris.lastGM());
    let queueSetup = await queue.setup(workflow.uuid, 'manualRoll', 0);
    if (!queueSetup) return;
    let inputs = [
        {
            'label': 'Roll Total:',
            'type': 'number'
        },
        {
            'label': 'Type:',
            'type': 'select',
            'options': [
                {'value': 'fumble', 'html': 'Fumble'},
                {'value': 'normal', 'html': 'Normal', 'selected': true},
                {'value': 'critical', 'html': 'Critical'}
            ]
        }
    ];
    if (game.user.id != targetUser.id) await chris.thirdPartyReactionMessage(targetUser, true);
    let selection = await chris.remoteMenu('Attack Roll', constants.okCancel, inputs, true, targetUser.id, workflow.attackRoll._formula, null);
    if (game.user.id != targetUser.id) await chris.clearThirdPartyReactionMessage();
    if (!selection.buttons) {
        queue.remove(workflow.uuid);
        return;
    }
    if (isNaN(selection.inputs[0])) {
        queue.remove(workflow.uuid);
        return;
    }
    let attackRollNumber = selection.inputs[0];
    let attackRoll = await new chrisRoll(String(attackRollNumber), {}, {'fakeType': selection.inputs[0]}).evaluate();
    if (selection.inputs[1] === 'critical' && !workflow.actor.flags['midi-qol']?.critical?.all) {
        await workflow.actor.setFlag('midi-qol', 'critical.all', true);
        Hooks.once('midi-qol.RollComplete', async () => {
            await workflow.actor.unsetFlag('midi-qol', 'critical.all');
        });
    } else if (selection.inputs[1] === 'fumble' && !workflow.actor.flags['midi-qol']?.fail?.attack?.all) {
        await workflow.actor.setFlag('midi-qol', 'fail.attack.all', true);
        Hooks.once('midi-qol.RollComplete', async () => {
            await workflow.actor.unsetFlag('midi-qol', 'fail.attack.all');
        });
    }
    await workflow.setAttackRoll(attackRoll);
    queue.remove(workflow.uuid);
}
async function damageRoll(workflow) {
    if (!workflow.damageRoll || !workflow.hitTargets.size) return;
    let firstOwner = warpgate.util.firstOwner(workflow.token);
    let ignoreGM = game.settings.get('chris-premades', 'Ignore GM');
    if (ignoreGM && firstOwner.isGM) return;
    let rollSettings = game.settings.get('chris-premades', 'Manual Rolling Players');
    let rollSetting = rollSettings[firstOwner.id] ?? 'default';
    if (rollSetting === 'default') return;
    let targetUser = (rollSetting === 'player') ? firstOwner : game.users.get(chris.lastGM());
    let queueSetup = await queue.setup(workflow.uuid, 'manualRoll', 1000);
    if (!queueSetup) return;
    let damageTypes = new Set([]);
    for (let i of workflow.damageRoll.terms) {
        if (i.flavor) damageTypes.add(i.flavor.toLowerCase());
    }
    let generatedMenu = [];
    let damageTypeArray = [];
    for (let i of Array.from(damageTypes)) {
        generatedMenu.push({
            'label': i.charAt(0).toUpperCase() + i.slice(1) + ':',
            'type': 'number'
        });
        damageTypeArray.push(i);
    }
    if (game.user.id != targetUser.id) await chris.thirdPartyReactionMessage(targetUser, true);
    let selection = await chris.remoteMenu('Damage Roll', constants.okCancel, generatedMenu, true, targetUser.id, workflow.damageRoll._formula);
    if (game.user.id != targetUser.id) await chris.clearThirdPartyReactionMessage();
    if (!selection.buttons) {
        queue.remove(workflow.uuid);
        return;
    }
    let damageFormula = '';
    for (let i = 0; i < selection.inputs.length; i++) {
        if (isNaN(selection.inputs[i])) continue;
        if (damageFormula != '') damageFormula += ' + ';
        let input = selection.inputs[i];
        damageFormula += (input != '' ? input : '0') + '[' + damageTypeArray[i] + ']';
    }
    if (damageFormula === '') {
        queue.remove(workflow.uuid);
        return
    }
    let damageRoll = await chris.damageRoll(workflow, damageFormula, undefined, true);
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.uuid);
}
async function saveRoll(workflow) {
    if (!workflow.saveResults) return;
    let queueSetup = await queue.setup(workflow.uuid, 'manualRoll', 0);
    if (!queueSetup) return;
    let rollSettings = game.settings.get('chris-premades', 'Manual Rolling Players');
    let userTargets = {};
    let gmTargets = [];
    for (let i of Array.from(workflow.hitTargets)) {
        let firstOwner = warpgate.util.firstOwner(i);
        let rollSetting = rollSettings[firstOwner.id] ?? 'default';
        if (rollSetting === 'default' || rollSetting === 'gm') {
            gmTargets.push(i);
        } else {
            if (!userTargets[firstOwner.id]) userTargets[firstOwner.id] = [];
            userTargets[firstOwner.id].push(i);
        }
    }
    let ignoreGM = game.settings.get('chris-premades', 'Ignore GM');
    if (!Object.keys(userTargets).length && ignoreGM) return;
    userTargets[chris.lastGM()] = gmTargets;
    let results = {};
    let info = CONFIG.DND5E.abilities[workflow.item.system.save.ability].label + ' Saving Throw';
    let dc = chris.getSpellDC(workflow.item);
    await Promise.all(Object.keys(userTargets).map(async userId => {
        let tokens = userTargets[userId];
        let inputs = tokens.map(i => ({'label': i.name, 'type': 'number', 'tokenId': i.id}));
        let user = game.users.get(userId);
        let message = user.isGM ? info + '(DC: ' + dc + ')' : info;
        if (game.user.id != userId) await chris.thirdPartyReactionMessage(user, true, userId);
        let selection = await chris.remoteMenu('Save Rolls', constants.okCancel, inputs, true, userId, message);
        if (game.user.id != userId) await chris.clearThirdPartyReactionMessage(userId);
        if (!selection.buttons) return;
        for (let i = 0; inputs.length > i; i++) {
            let result = selection.inputs[i];
            if (isNaN(result)) continue;
            let tokenId = inputs[i].tokenId;
            results[tokenId] = result;
        }
    }));
    let tokens = Array.from(workflow.hitTargets);
    for (let i = 0; i < tokens.length; i++) {
        let tokenId = tokens[i].id;
        if (!results[tokenId]) continue;
        let result = results[tokenId];
        if (result >= dc) {
            workflow.failedSaves.delete(tokens[i]);
            workflow.saves.add(tokens[i]);
            workflow.saveDisplayData[i].saveString = ' succeeds';
            workflow.saveDisplayData[i].saveStyle = 'color: green;'
            workflow.saveDisplayData[i].rollTotal = result;
        } else {
            workflow.failedSaves.add(tokens[i]);
            workflow.saveDisplayData[i].saveString = ' fails';
            workflow.saveDisplayData[i].saveStyle = 'color: red;';
            workflow.saveDisplayData[i].rollTotal = result;
        }
        workflow.saveResults[i]._total = result;
    }
    await workflow.displaySaves(false, true);
    queue.remove(workflow.uuid);
}
async function userOptions() {
    let users = game.users.filter(i => !i.isGM);
    if (!users.length) {
        ui.notifications.info('There are no players to configure!');
        return;
    }
    let oldSettings = game.settings.get('chris-premades', 'Manual Rolling Players');
    function getOptions(userId) {
        let oldSetting = oldSettings[userId];
        let options = [
            {'value': 'default', 'html': 'Auto / Default', 'selected': oldSetting === 'default' ?? true},
            {'value': 'player', 'html': 'Prompt Player', 'selected': oldSetting === 'player' ?? false},
            {'value': 'gm', 'html': 'Prompt Game Master', 'selected': oldSetting === 'gm' ?? false}
        ];
        return options;
    }
    let inputs = users.map(i => ({'label': i.name, 'type': 'select', 'options': getOptions(i.id), 'id': i.id}));
    let selection = await chris.menu('Player Options', constants.okCancel, inputs, true);
    if (!selection) return;
    let newSettings = {};
    for (let i = 0; inputs.length > i; i++) setProperty(newSettings, inputs[i].id, selection.inputs[i]);
    await game.settings.set('chris-premades', 'Manual Rolling Players', newSettings);
}
async function dialogTargeting(dummyWorkflow) {
    if (dummyWorkflow.targets.size !== 0) return;
    let userSettings = (game.settings.get('chris-premades', 'Manual Rolling Players'));
    if (userSettings?.[game.user.id] !== 'player') return;
    let queueSetup = await queue.setup(dummyWorkflow.item.uuid, 'dialogTargeting', 1000);
    if (!queueSetup) return;
    let targetType = constants.attacks.includes(dummyWorkflow.item.system.actionType) ? 'enemy' : dummyWorkflow.item.system.actionType === 'save' ? 'all' : 'ally';
    let targets = chris.findNearby(dummyWorkflow.token, dummyWorkflow.item.system.range?.long ?? dummyWorkflow.item.system.range.value, targetType, false, false);
    if (targets.length === 0) {
        ui.notifications.warn('Dialog Targeting - No targets nearby player ' + dummyWorkflow.token.name);
    } else if (targets.length === 1) {
        chris.updateTargets(targets.map(tok => tok.id));
    } else {
        let selection = await chris.selectTarget('Dialog Targeting', constants.okCancel, targets, false, 'multiple', null, false, 'Select targets for ' + dummyWorkflow.item.name, true, false);
        if (selection.buttons != true) {
            queue.remove(workflow.item.uuid);
            return;
        }
        chris.updateTargets(selection.inputs.filter(i => i));
    }
    queue.remove(workflow.item.uuid);
}
export let manualRolls = {
    'attackRoll': attackRoll,
    'damageRoll': damageRoll,
    'saveRolls': saveRoll,
    'userOptions': userOptions,
    'dialogTargeting': dialogTargeting
}
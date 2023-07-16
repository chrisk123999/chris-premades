import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
function dialogRender(html) {
    let ths = html[0].getElementsByTagName('th');
    for (let t of ths) {
        t.style.width = 'auto';
        t.style.textAlign = 'left';
    }
    let tds = html[0].getElementsByTagName('td');
    for (let t of tds) {
        t.style.width = '50px';
        t.style.textAlign = 'center';
        t.style.paddingRight = '5px';
    }
}
let buttons = [
    {
        'label': 'Cancel',
        'value': false
    },
    {
        'label': 'Ok',
        'value': true
    }
];
async function attackRoll(workflow) {
    if (!workflow.attackRoll) return;
    if (game.settings.get('chris-premades', 'Ignore GM')) {
        let firstOwner = warpgate.util.firstOwner(workflow.token);
        if (firstOwner.isGM) return;
    }
    let queueSetup = await queue.setup(workflow.uuid, 'manualRoll', 0);
    if (!queueSetup) return;
    let selection = await warpgate.menu({
        'inputs': [
            {
                'label': workflow.attackRoll._formula,
                'type': 'info'
            },
            {
                'label': 'Roll Total:',
                'type': 'number'
            }
        ],
        'buttons': buttons
    },
    {
        'title': 'What is the attack total?',
        'render': dialogRender,
        'options': {
            'width': '300px'
        }
    });
    if (!selection.buttons) {
        queue.remove(workflow.uuid);
        return;
    }
    if (isNaN(selection.inputs[1])) {
        queue.remove(workflow.uuid);
        return;
    }
    let attackRollNumber = selection.inputs[1];
    workflow.attackRoll.terms = [
        {
            'class': 'NumericTerm',
            'options': {},
            'evaluated': true,
            'number': attackRollNumber
        }
    ];
    workflow.attackRoll._formula = String(attackRollNumber);
    workflow.attackRoll._total = attackRollNumber;
    await workflow.setAttackRoll(workflow.attackRoll);
    queue.remove(workflow.uuid);
}
async function damageRoll(workflow) {
    if (!workflow.damageRoll) return;
    if (game.settings.get('chris-premades', 'Ignore GM')) {
        let firstOwner = warpgate.util.firstOwner(workflow.token);
        if (firstOwner.isGM) return;
    }
    let queueSetup = await queue.setup(workflow.uuid, 'manualRoll', 1000);
    if (!queueSetup) return;
    let damageTypes = new Set([]);
    for (let i of workflow.damageRoll.terms) {
        if (i.flavor) damageTypes.add(i.flavor.toLowerCase());
    }
    let generatedMenu = [
        {
            'label': workflow.damageRoll._formula,
            'type': 'info'
        }
    ];
    let damageTypeArray = ['skip'];
    for (let i of Array.from(damageTypes)) {
        generatedMenu.push({
            'label': i.charAt(0).toUpperCase() + i.slice(1) + ':',
            'type': 'number'
        });
        damageTypeArray.push(i);
    }
    let selection = await warpgate.menu({
        'inputs': generatedMenu,
        'buttons': buttons
    },
    {
        'title': 'What are the damage totals?',
        'render': dialogRender,
        'options': {
            'width': '300px'
        }
    });
    if (!selection.buttons) {
        queue.remove(workflow.uuid);
        return;
    }
    let damageFormula = '';
    for (let i = 1; i < selection.inputs.length; i++) {
        if (isNaN(selection.inputs[i])) continue;
        if (damageFormula != '') damageFormula += ' + ';
        damageFormula += selection.inputs[i] + '[' + damageTypeArray[i] + ']';
    }
    if (damageFormula === '') {
        queue.remove(workflow.uuid);
        return
    }
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.uuid);
}
async function saveRoll(workflow) {
    if (!workflow.saveResults) return;
    if (game.settings.get('chris-premades', 'Ignore GM')) {
        let hasPlayer = false;
        for (let i of Array.from(workflow.hitTargets)) {
            let firstOwner = warpgate.util.firstOwner(i);
            if (firstOwner.isGM) continue;
            hasPlayer = true;
            break;
        }
        if (!hasPlayer) return;
    }
    let queueSetup = await queue.setup(workflow.uuid, 'manualRoll', 0);
    if (!queueSetup) return;
    let generatedMenu = [];
    for (let i of Array.from(workflow.hitTargets)) {
        generatedMenu.push({
            'label': i.name,
            'type': 'number'
        });
    }
    let selection = await warpgate.menu({
        'inputs': generatedMenu,
        'buttons': buttons
    },
    {
        'title': 'What are the save totals?',
        'render': dialogRender,
        'options': {
            'width': '300px'
        }
    });
    if (!selection.buttons) {
        queue.remove(workflow.uuid);
        return;
    }
    let dc = chris.getSpellDC(workflow.item);
    let tokens = Array.from(workflow.hitTargets);
    for (let i = 0; i < selection.inputs.length; i++) {
        let value = selection.inputs[i];
        if (isNaN(value)) continue;
        if (value >= dc) {
            workflow.failedSaves.delete(tokens[i]);
            workflow.saves.add(tokens[i]);
            workflow.saveDisplayData[i].saveString = ' succeeds';
            workflow.saveDisplayData[i].saveStyle = 'color: green;'
            workflow.saveDisplayData[i].rollTotal = value;
        } else {
            workflow.failedSaves.add(tokens[i]);
            workflow.saveDisplayData[i].saveString = ' fails';
            workflow.saveDisplayData[i].saveStyle = 'color: red;';
            workflow.saveDisplayData[i].rollTotal = value;
        }
        workflow.saveResults[i].total = selection.inputs[i];
    }
    await workflow.displaySaves(false, true);
    queue.remove(workflow.uuid);
}
export let manualRolls = {
    'attackRoll': attackRoll,
    'damageRoll': damageRoll,
    'saveRolls': saveRoll
}
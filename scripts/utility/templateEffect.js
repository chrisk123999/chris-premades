import {chris} from '../helperFunctions.js';
import {macros} from '../macros.js';
async function updateToken(token, changes, context, userId) {
    if (game.settings.get('chris-premades', 'LastGM') != game.user.id) return;
    if (!changes.x && !changes.y && !changes.elevation) return;
    await token.object._animation;
    let coords = {'x': token.x, 'y': token.y};
    let previousCoords = foundry.utils.getProperty(context, 'templatemacro.coords.previous');
    let templates = token.parent.templates.reduce((acc, templateDoc) => {
        let cells = chris.findGrids(previousCoords, coords, templateDoc);
        if (!cells.length) return acc;
        acc.push(templateDoc.id);
        return acc;
    }, []);
    if (templates.length === 0) return;
    let allTriggers = {};
    for (let i of templates) {
        let template = canvas.scene.templates.get(i);
        if (!template) continue;
        let flag = template.flags['chris-premades']?.template;
        if (!flag?.name) continue;
        if (flag.ignoreMove) continue;
        if (flag.ignoreStart && chris.inCombat()) {
            let {'x': tokx, 'y': toky} = previousCoords;
            let {'x': tempx, 'y': tempy} = template;
            let startX = token.width >= 1 ? 0.5 : token.width / 2;
            let startY = token.height >= 1 ? 0.5 : token.height / 2;
            let curr = {
                'x': tokx + startX * token.parent.grid.size - tempx,
                'y': toky + startY * token.parent.grid.size - tempy
            };
            let contains = template.object.shape.contains(curr.x, curr.y);
            if (contains) continue;
        }
        if (!allTriggers[flag.name]) allTriggers[flag.name] = [];
        allTriggers[flag.name].push(flag);
    }
    if (allTriggers.length === 0) return;
    runTriggers(allTriggers, token);
}
function combat(combat, changes, context) {
    if (game.settings.get('chris-premades', 'LastGM') != game.user.id) return;
    let currentTurn = combat.current.turn;
    let previousTurn = context.effectmacro?.previousTR?.T;
    let currentRound = combat.current.round;
    let previousRound = context.effectmacro?.previousTR?.R;
    if (!changes.turn && !changes.round) return;
    if (!combat.started || !combat.isActive) return;
    if (currentRound < previousRound || (currentTurn < previousTurn && currentTurn === previousRound)) return;
    let token = game.combat.scene.tokens.get(combat.current.tokenId);
    if (token) {
        let templates = chris.tokenTemplates(token);
        if (templates.length != 0) {
            let allTriggers = {};
            for (let i of templates) {
                let template = canvas.scene.templates.get(i);
                if (!template) continue;
                let flag = template.flags['chris-premades']?.template;
                if (!flag?.name) continue;
                if (!flag.turn) continue;
                if (flag.turn === 'end') continue;
                if (!allTriggers[flag.name]) allTriggers[flag.name] = [];
                allTriggers[flag.name].push(flag);
            }
            if (allTriggers.length === 0) return;
            runTriggers(allTriggers, token);
        }
    }
    let previousToken = game.combat.scene.tokens.get(combat.previous.tokenId);
    if (previousToken) {
        let templates = chris.tokenTemplates(previousToken);
        if (templates.length != 0) {
            let allTriggers = {};
            for (let i of templates) {
                let template = canvas.scene.templates.get(i);
                if (!template) continue;
                let flag = template.flags['chris-premades']?.template;
                if (!flag?.name) continue;
                if (!flag.turn) continue;
                if (flag.turn === 'start') continue;
                if (!allTriggers[flag.name]) allTriggers[flag.name] = [];
                allTriggers[flag.name].push(flag);
            }
            if (allTriggers.length === 0) return;
            runTriggers(allTriggers, previousToken); 
        }
    }
}
async function runTriggers(allTriggers, token) {
    for (let triggerName of Object.values(allTriggers)) {
        let maxLevel = Math.max(...triggerName.map(trigger => trigger.castLevel));
        let maxDC = Math.max(...triggerName.map(trigger => trigger.saveDC));
        let maxDCTrigger = triggerName.find(trigger => trigger.saveDC === maxDC);
        let selectedTrigger;
        if (maxDCTrigger.castLevel === maxLevel) {
            selectedTrigger = triggerName.find(trigger => trigger.castLevel === maxLevel && trigger.saveDC === maxDC);
        } else {
            selectedTrigger = triggerName.find(trigger => trigger.castLevel === maxLevel);
        }
        await executeFunction(selectedTrigger, token);
        await warpgate.wait(100);
    }
}
async function executeFunction(selectedTrigger, token) {
    console.log('Chris | Executing template trigger for ' + selectedTrigger.name + ' to: ' + token.actor.name);
    let macroCommand;
    if (selectedTrigger.macroName) {
        macros.templateTrigger(selectedTrigger.macroName, token, selectedTrigger);
    } else if (selectedTrigger.globalFunction) {
        macroCommand = `await ${selectedTrigger.globalFunction.trim()}.bind(this)({token})`;
    } else if (selectedTrigger.worldMacro) {
        let macro = game.macros?.getName(selectedTrigger.worldMacro.replaceAll('"', ''));
        macroCommand = macro?.command ?? `console.warn('Chris | No world macro ${selectedTrigger.worldMacro.replaceAll('"', '')} found!')`;
    }
    if (macroCommand) {
        let body = `return (async () => {${macroCommand}})()`;
        let fn = Function('{token}={}', body);
        try {
            fn.call(selectedTrigger, {token});
        } catch (error) {
            ui.notifications?.error('There was an error running your macro. See the console (F12) for details');
            error('Error evaluating macro ', error);
        }
    }
}
export let templates = {
    'move': updateToken,
    'runTrigger': executeFunction,
    'combat': combat
}
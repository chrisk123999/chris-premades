import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function destructiveWave({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'destructiveWave', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog('What damage type?', [['Radiant', 'radiant'], ['Necrotic', 'necrotic']]);
    if (!selection) selection = 'radiant';
    let animation = 'jb2a.thunderwave.center.blue';
    if (chris.jb2aCheck() === 'patreon') {
        if (selection === 'necrotic') {
            animation = 'jb2a.thunderwave.center.dark_purple';
        } else {
            animation = 'jb2a.thunderwave.center.orange'
        }
    }
    new Sequence().effect().atLocation(workflow.token).file(animation).scale(2.2).playbackRate(0.5).play();
    let damageFormula = workflow.damageRoll._formula.replace('none', selection);
    let damageRoll = await chris.damageRoll(workflow, damageFormula, undefined, true);
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}
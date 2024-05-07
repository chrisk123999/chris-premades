import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function chromaticOrb({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'chromaticOrb', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog('What damage type?', [['🧪 Acid', 'acid'], ['❄️ Cold', 'cold'], ['🔥 Fire', 'fire'], ['⚡ Lightning', 'lightning'], ['☠️ Poison', 'poison'], ['☁️ Thunder', 'thunder']]);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    workflow.damageRolls[0].options.type = selection;
    for (let i of workflow.damageRolls[0].terms) {
        if (i.options.flavor === 'none') i.options.flavor = selection;
    }
    workflow.defaultDamageType = selection;
    await workflow.setDamageRolls(workflow.damageRolls);
    queue.remove(workflow.item.uuid);
    let animation;
    if (chris.jb2aCheck() === 'patreon') {
        animation = 'jb2a.guiding_bolt.02.';
        switch(selection) {
            case 'acid':
            case 'poison':
                animation += 'greenorange';
                break;
            case 'cold':
                animation += 'dark_bluewhite';
                break;
            case 'lightning':
                animation +='yellow';
                break;
            case 'thunder':
                animation += 'blueyellow';
                break;
            case 'fire':
                animation += 'red';
                break;
        }
    } else {
        animation = 'jb2a.guiding_bolt.01.blueyellow';
    }
    new Sequence().effect().atLocation(workflow.token).stretchTo(workflow.targets.first()).file(animation).play();
}
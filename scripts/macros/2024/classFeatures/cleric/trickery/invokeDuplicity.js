import {Summons} from '../../../../../lib/summons.js';
import {itemUtils} from '../../../../../utils.js';

async function use({trigger, workflow}) {
    let animation = itemUtils.getConfig(workflow.item, 'animation');




    let summons = await Summons.spawn();
}





export let invokeDuplicity = {
    name: 'Invoke Duplicity',
    version: '1.3.15',
    rules: 'modern'
};
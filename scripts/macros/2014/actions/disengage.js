import {disengage as modernDisengage} from '../../2024/actions/disengage.js';
export let disengage = {
    name: 'Disengage',
    version: '1.3.34',
    midi: modernDisengage.midi,
    config: modernDisengage.config,
    hasAnimation: true
};
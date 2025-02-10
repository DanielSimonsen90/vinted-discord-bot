import EventEmitter from 'events';

/**
 * @type {EventEmitter<{
 *  'refresh-monitored-channels': []
 * }>}
 */

export const emitter = new EventEmitter();
export default emitter;
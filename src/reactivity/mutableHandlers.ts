import { track, trigger } from './effect';
import { isObject } from '../shared/index';
import { reactive } from './reactive';

export const baseHandler = {
  // state.name
  get(target, key, receiver) {
    let value = Reflect.get(target, key, receiver);
    // state.name 记住 activeEffect
    track(target, key);
    return isObject(value) ? reactive(value) : value;
  },
  set(target, key, newValue, receiver) {
    const oldValue = target[key];
    if (oldValue === newValue) {
      return false;
    }
    let result = Reflect.set(target, key, newValue, receiver);
    trigger(target, key);
    return result;
  },
}
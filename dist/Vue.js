(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.VueReactivity = {}));
}(this, (function (exports) { 'use strict';

  function effect(fn) {
      const effect = createReactiveEffect(fn);
      effect();
  }
  /*
    fn:
      () => {
        app.innerHTML = state.name;
      }
  */
  /*
    外层的 effect 叫 e1
    里层的 effect 叫 e2

    effect(() => {
      app.innerHTML = state.name;
      effect(() => {
        app.innerHTML = state.age;
        app.innerHTML = state.name + '666';
      })
      app.innerHTML = state.name = '888';
    })

    stack: []
    active: null
    name: [e1, e2]
    age: [e2]
  */
  let activeEffect;
  function createReactiveEffect(fn) {
      const effect = function reactiveEffect() {
          // if (!effectStack.includes(effect)) {
          // state.name 记住 fn
          // effectStack.push(effect);
          activeEffect = effect;
          try {
              fn();
          }
          finally {
              activeEffect = null;
          }
          // }
      };
      return effect;
  }
  /*
    最外层是 weakmap
    {
      key 是对象，值是 map
      state: {
        name: Set[fn, fn, fn],
        age: Set[]
      }
    }
  */
  const targetMap = new WeakMap();
  console.log('targetMap: ', targetMap);
  function track(target, key) {
      // target 里面的 key 记住 activeEffect
      let depsMap = targetMap.get(target);
      if (!depsMap) {
          // depsMap = new Map();
          // targetMap.set(target, depsMap);
          targetMap.set(target, (depsMap = new Map()));
      }
      // 拿到 state 对应的 map 了
      let dep = depsMap.get(key);
      if (!dep) {
          // dep = new Set();
          // depsMap.set(key, dep);
          depsMap.set(key, (dep = new Set()));
      }
      // 取到了 Set[fn, fn, fn]
      dep.add(activeEffect);
  }
  function trigger(target, key) {
      let depsMap = targetMap.get(target);
      if (!depsMap) {
          return;
      }
      let dep = depsMap.get(key);
      if (!dep) {
          return;
      }
      // Set[fn, fn, fn]
      dep.forEach(effect => {
          effect && effect();
      });
  }

  const isObject = (target) => {
      return typeof target === 'object';
  };

  const baseHandler = {
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
  };

  // 让数据变成响应式
  function reactive(target) {
      return createReactiveObject(target);
  }
  const reactiveMap = new Map();
  function createReactiveObject(target) {
      // {} baseHandler  Set Map WeakMap collectionHandler
      const existProxy = reactiveMap.get(target);
      if (existProxy) {
          return existProxy;
      }
      let proxy = new Proxy(target, baseHandler);
      reactiveMap.set(target, proxy);
      return proxy;
  }

  exports.effect = effect;
  exports.reactive = reactive;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

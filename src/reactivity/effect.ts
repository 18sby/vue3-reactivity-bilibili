export function effect(fn) {
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
    app.innerHTML = state.age = '888';
  })

  stack: [e1]
  active: e1
  name: [e1, e2]
  age: [e2, e1]

  active: null
  name: [e1, e2]
  age: [e2, null]
*/

let activeEffect;
let effectStack = [];

function createReactiveEffect(fn) {
  const effect = function reactiveEffect () {
    if (!effectStack.includes(effect)) {
      // state.name 记住 fn
      effectStack.push(effect);
      activeEffect = effect;
      try {
        fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  }
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

export function track(target, key) {
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

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    return ;
  }
  let dep = depsMap.get(key);
  if (!dep) {
    return ;
  }
  // Set[fn, fn, fn]
  dep.forEach(effect => {
    effect && effect();
  })
}
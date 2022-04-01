# Proxy

**Proxy란?**  
Proxy 객체는 getting, setting, defining properties와 같은 기본적인 객체 작동을 재정의하여 원본 객체를 대신할 수 있는 객체를 생성하게 해준다. 프록시 객체는 보통 프로퍼티 접근을 기록하고, 검증하고, 포맷하고, 인풋을 sanitize하는 등의 용도로 사용된다.

두개의 매개변수와 함께 프록시를 생성할 수 있다.

- target: 대리하려는 원본 객체
- handler: 어떤 작동을 가로챌지, 어떻게 작동을 재정의할지 정의하는 객체

예제

```javascript
const target = {
  notProxied: 'original value',
  proxied: 'original value',
};

const handler = {
  get: function (target, prop, receiver) {
    if (prop === 'proxied') {
      return 'replaced value';
    }
    return Reflect.get(...arguments);
  },
};

const proxy = new Proxy(target, handler);

console.log(proxy.notProxied); // "original value"
console.log(proxy.proxied); // "replaced value"
```

### Proxy.revocable

취소할 수 있는 Proxy 객체를 생성한다. revoke()가 호출되면 Proxy 객체는 더 이상 사용할 수 없다. 핸들러의 트랩은 모두 `TypeError`를 던지게 된다.

예제

```javascript
const revocable = Proxy.revocable(
  {},
  {
    get: function (target, name) {
      return '[[' + name + ']]';
    },
  }
);
const proxy = revocable.proxy;
console.log(proxy.foo); // "[[foo]]"

revocable.revoke();

console.log(proxy.foo); // TypeError is thrown
proxy.foo = 1; // TypeError again
delete proxy.foo; // still TypeError
typeof proxy; // "object", typeof doesn't trigger any trap
```

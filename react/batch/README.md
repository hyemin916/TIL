# Batch

## Render batching과 타이밍

기본적으로 `setState()`를 호출할 때마다 리액트는 새로운 렌더 패스를 시작하고, 이를 동기적으로 실행하고, 리턴한다. 하지만 리액트는 **render batching** 형식으로 일종의 최적화를 한다. 렌더 배칭이란, `setState()`를 여러번 호출하여 단일 렌더 패스가 대기열에 쌓이고 일반적으로 약간 지연되는 경우를 뜻한다.

예를 들어, 같은 클릭 이벤트에 두개의 상태를 업데이트 한다면, 리액트는 항상 하나의 리렌더에 묶을 것이다.

```javascript
function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  function handleClick() {
    setCount((c) => c + 1); // Does not re-render yet
    setFlag((f) => !f); // Does not re-render yet
    // React will only re-render once at the end (that's batching!)
  }

  return (
    <div>
      <button onClick={handleClick}>Next</button>
      <h1 style={{ color: flag ? 'blue' : 'black' }}>{count}</h1>
    </div>
  );
}
```

리액트 공식문서는 "상태 업데이트는 비동기적일 수 있다"고 언급한다. 이는 render batching을 가리킨다. 리액트는 리액트 이벤트 핸들러에서 발생하는 상태 업데이트를 자동으로 batch한다. 리액트 이벤트 핸들러는 일반적인 리액트 앱 코드의 상당히 큰 부분을 차지하기 때문에, 앱 내 대부분의 상태 업데이트는 사실상 batch된다.

리액트는 `unstable_batchedUpdates`라는 내장함수로 이벤트 핸들러를 감싸서 render batch를 구현한다. 리액트는 `unstable_batchedUpdates`가 실행되는 동안, 대기하고 있는 모든 상태 업데이트를 추적한다. 그리고 단일 렌더 패스에 상태 업데이트를 적용한다. 이벤트 핸들러에 한해 이는 매우 잘 작동한다. 리액트는 주어진 이벤트에 어떤 핸들러가 호출되어야 할지 정확히 알고 있기 때문이다.

개념적으로, React가 내부적으로 수행하는 작업을 다음과 같은 의사 코드로 작성할 수 있다.

```javascript
function internalHandleEvent(e) {
  const userProvidedEventHandler = findEventHandler(e);

  let batchedUpdates = [];

  unstable_batchedUpdates(() => {
    // 이 내부에서 대기하는 모든 업데이트들은 batchedUpdates에 push된다
    userProvidedEventHandler(e);
  });

  renderWithQueuedStateUpdates(batchedUpdates);
}
```

그런데 이는 현재 콜스택 외부에서 대기하는 모든 상태 업데이트가 batch되지 않는다는 것을 의미하기도 한다.
구체적인 예제를 보자.

```javascript
const [counter, setCounter] = useState();

const handleClick = async () => {
  setCounter(0);
  setCounter(1);

  const data = await fetchSomeDate();

  setCounter(2);
  setCounter(3);
};
```

이는 세번의 렌더 패스를 실행한다. 첫번째 패스는 `setCounter(0)`과 `setCounter(1)`를 batch한다. 이들은 오리지널 이벤트 핸들러 콜 스택에서 발생한다. 그러므로 이들은 `unstable_batchedUpdate()`내에서 발생한다.

하지만 `setCounter(2)`는 `await` 후에 실행된다. 오리지널 콜 스택이 완료되고, 완전히 분리된 이벤트 루프 콜 스택에서 함수의 두번째 절반이 실행된다. 그러므로 리액트는 `setCounter(2)`의 마지막 단계로 전체적인 렌더 패스를 동기적으로 실행한다.

`setCounter(3)`에도 같은 일이 벌어진다. 이 또한 오리지널 이벤트 핸들러 밖, batching 밖에서 실행되기 때문이다.

## React 18과 batch

React18은 batch을 더 많이 하여 앱이나 라이브러리 코드에서 수동적으로 업데이트를 batch할 필요를 없앰으로서 성능을 향상시켰다.

batching은 리액트가 성능을 위해 여러개의 상태 업데이트를 하나의 리렌더로 묶는 것이다.

react 17은 이벤트 핸들러 안에서 업데이트를 묶는다. (클릭 당 한번의 렌더)
불필요한 리렌더를 피하기 때문에 성능적으로 좋다. 그리고 상태가 전부 업데이트 되지 않은 채 컴포넌트가 렌더링되는 것을 방지한다.

하지만 클릭 핸들러에서 데이터를 불러오고 상태를 업데이트하면, 리액트는 업데이트들을 묶지 않고 독립적인 두번의 업데이트를 할 것이다.

왜냐하면 리액트는 브라우저 이벤트 동안에만 업데이트를 묶는데, 이벤트가 fetch callback에서 이미 처리된 후 상태를 업데이트하기 때문이다.

```javascript
function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  function handleClick() {
    fetchSomething().then(() => {
      // React 17 and earlier does NOT batch these because
      // they run _after_ the event in a callback, not _during_ it
      setCount((c) => c + 1); // Causes a re-render
      setFlag((f) => !f); // Causes a re-render
    });
  }

  return (
    <div>
      <button onClick={handleClick}>Next</button>
      <h1 style={{ color: flag ? 'blue' : 'black' }}>{count}</h1>
    </div>
  );
}
```

리액트 17은 이벤트 핸들러 밖에서 batch를 하지 않는다. 리액트 18까진, 리액트 이벤드 핸들러 중간에만 업데이트를 batch했다. promise, setTimeout, native event handler 등 다른 이벤트 안에서 업데이트 하는 것은 batch되지 않았다.

## 자동 batch란 무엇인가?

createRoot와 함께 리액트18에서 시작되어, 모든 업데이트는 자동으로 배치된다.

이는 timeouts, promises, native event handler 등 다른 이벤트 안에서 업데이트들이 리액트 이벤드 안에서의 업데이트와 마찬가지로 배치된다는 것을 의미한다. 이로 인해 렌더링이 줄어들고 성능 향상을 기대할 수 있다.

```javascript
function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  function handleClick() {
    fetchSomething().then(() => {
      // React 18 and later DOES batch these:
      setCount((c) => c + 1);
      setFlag((f) => !f);
      // React will only re-render once at the end (that's batching!)
    });
  }

  return (
    <div>
      <button onClick={handleClick}>Next</button>
      <h1 style={{ color: flag ? 'blue' : 'black' }}>{count}</h1>
    </div>
  );
}
```

```javascript
function handleClick() {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // React will only re-render once at the end (that's batching!)
}

setTimeout(() => {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // React will only re-render once at the end (that's batching!)
}, 1000);

fetch(/_..._/).then(() => {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // React will only re-render once at the end (that's batching!)
});

elm.addEventListener('click', () => {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // React will only re-render once at the end (that's batching!)
});
```

리액트는 기본적으로 안전할 때만 업데이트들을 batch한다. 예를 들어서, 유저가 발생시킨 각각의 이벤트(click, keypress) 때마다 다음 이벤트 전에 DOM이 완전히 업데이트 되는 것을 보장한다. 예시로, form은 두번 submit될 수 없게 보장해준다.

만약 내가 batch를 원하지 않는다면? 보통은 batching은 안전하지만 어떤 코드는 상태가 바뀐 직후 DOM에서부터 무언가를 읽어야 한다. 그런 상황에선, ReactDom.flushSync()를 써서 batch를 없앨 수 있다.

```javascript
import { flushSync } from 'react-dom'; // Note: react-dom, not react

function handleClick() {
  flushSync(() => {
    setCounter((c) => c + 1);
  });
  // React has updated the DOM by now
  flushSync(() => {
    setFlag((f) => !f);
  });
  // React has updated the DOM by now
}
```

`unstable_batchedUpdates`란 무엇일까. 어떤 리액트 라이브러리들은 이벤트 핸들러 밖에서 setState를 batch하기 위해 문서화되지 않은 이 API를 사용한다.

```javascript
import { unstable_batchedUpdates } from 'react-dom';

unstable_batchedUpdates(() => {
  setCount((c) => c + 1);
  setFlag((f) => !f);
});
```

이 API는 18에도 여전히 존재하지만, batching이 자동으로 실행되기 때문에 필요하지 않다. 유명한 라이브러리들이 이 API에 의존하지 않게 된 후에 메이저 버전에서 제거될 것이다.

### 참고

[A (Mostly) Complete Guide to React Rendering Behavior](https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/)  
[Automatic batching for fewer renders in React 18](https://github.com/reactwg/react-18/discussions/21)

function createStore(reducer, preloadedState, enhancer) {
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
    (typeof enhancer === 'function' && typeof arguments[3] === 'function')
  ) {
    throw new Error('enhancer는 1개여야 한다');
  }

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  } // 사용자가 인자를 2개만 넣었을 땐 두번째 인자가 enhancer가 된다

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('enhancer는 함수여야 한다');
    }

    return enhancer(createStore)(reducer, preloadedState); // enhancer로 createStore를 감싸고 그 실행값이 반한된다.
  }

  if (typeof reducer !== 'function') {
    throw new Error('루트 리듀서는 함수여야 한다');
  }

  let currentReducer = reducer;
  let currentState = preloadedState;
  let currentListeners = [];
  let nextListeners = currentListeners;
  let isDispatching = false;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  } /* currentListeners를 얕은 복사해서 임시 리스트로 nextListener를 만든다.
  사용자가 dispatch 도중에 subscribe/unsubscribe를 호출해서 생기는 버그들을 에방할 수 있다. */

  function getState() {
    if (isDispatching) {
      throw new Error(`리듀서가 실행중일 땐 store.getState()를 호출할 수 없다.
      리듀서가 이미 state를 인자로 받았다.
      store로 읽지 말고 top reducer에서 밑으로 전달해라`);
    }

    return currentState;
  }

  /**
   * action이 dispatch될때마다 change listener가 호출된다.
   * 콜백 안의 current state tree를 읽고 싶으면 getState()를 호출한다
   * change listener로부터 dispatch를 호출할 수 있다.
   * 주의사항
   * 1. 모든 dispatch가 호출되기 전에 subscription들은 스냅샷된다.
   * lister들이 깨어있는 동안 subscribe나 unsubscribe를 해도 dispatch() 중엔 아무 영향도 끼치지 못한다.
   * 하지만 다음 dispatch()를 호출할 땐 subscribtion list의 더 최신 스냅샷을 사용한다.
   *
   * 2. listener가 모든 state change를 알기를 기대할 수 없다. 하지만 dispatch()가 시작되기 전에
   * 등록된 모든 subscriber가 가장 최신 상태와 함께 호출된다는 것을 보장할 수 있다.
   */

  function subscribe(listener) {
    // listener: 모든 dispatch를 깨우는 콜백함수
    if (typeof listener !== 'function') {
      throw new Error('listener는 함수여야 한다.');
    }

    if (isDispatching) {
      throw new Error(
        `reducer가 실행되는 중엔 store.subscribe()를 호출하면 안된다.`
      );
    }

    let isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      if (isDispatching) {
        throw new Error();
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
      currentListeners = null;
    };
  }

  /**
   * 기본적으로 plain object actions만 지원한다. Promise, Observable, thunk 등을
   * dispatch하고 싶으면 middleware와 대응되는 함수를 생성해서 store를 감싸야 한다.(ex. redux-thunk)
   *
   * @param action 무엇이 바뀌어야할지 나타내는 plain object. type 속성으 있어야 하고 undefined면 안된다.
   * @returns dispatch한 action
   */

  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(`action은 plaion object여야 한다.
      다른 value들을 dispatch하고 싶으면 함수를 dispatch하는 redux-thunk 같은 미들웨어들이 필요하다`);
    }

    if (typeof action.type === 'undefined') {
      throw new Error(`action은 undefined면 안된다.`);
    }

    if (isDispatching) {
      throw new Error('reducer가 action을 dispatch하지 않을 수 있다.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener(); //  dispatch될때마다 listener를 실행
    }

    return action;
  }

  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error(`nextReducer는 함수여야 한다`);
    }

    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.REPLACE });

    return store;
  }

  function observable() {
    const outerSubscribe = subscribe;

    return {
      subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('observer는 object여야 한다');
        }

        function observeState() {
          const observerAsObserver = observer; // 타입 캐스팅
          if (observerAsObserver.next) {
            observerAsObserver.next(getState());
          }
        }

        observeState();
        const unsubscribe = outerSubscribe(observeState);
        return { unsubscribe };
      },

      [$$observable]() {
        // symbol
        return this;
      },
    };
  }

  // store가 생성될 때 INIT액션이 디스패치된다. 모든 리듀서들이 initial state를 return하게 된다.
  // initial state tree를 효과적으로 채운다.
  dispatch({ type: ActionTypes.INIT });

  const store = {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable,
  };

  return store;
}

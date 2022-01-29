# Redux

## Redux 이전엔..

- MVC 패턴 사용
- 컨트롤러와 뷰가 모델 업데이트 가능
- 모델과 뷰의 데이터가 동기화되는 양방향 데이터 바인딩
  ![mvc](/mvc.png)

### 페이스북의 알림 버그
- 우측 상단에 알림(1)이 있다면 채팅창, 채팅리스트 모두 알림(1)이 있어야 함
- 어느 한군데서 새로운 채팅을 읽었을 때 모든 컴포넌트에서 알림(1)이 사라져야 함
- 사용자가 메세지를 읽었음에도 불구하고 알림이 사라지지 않거나, 사라졌다가 다시 나타나는 버그 발생

### 페이스북의 문제 해결
- 하나의 유저 인터랙션에도 뷰가 여러 모델을 업데이트하는 상황이 생겨 흐름 예측 불가
- 많은 모델과 많은 뷰로 복잡해진 구조에서 버그 발생
- MVC 패턴의 **양방향 데이터 흐름**을 문제의 원인으로 인식
- 해결책으로 **데이터가 단방향으로 흐르는 Flux 패턴** 제시
  ***

## Flux and Redux

### Flux

- 아키텍처 패턴
- observer-observable 패턴을 약간 변형함
- 단방향 데이터 플로우

![flux](/flux.png)

- Action
  - 앱의 기능에 기반(ex. 글 작성, 글 삭제 등)
  - type(id) + data(payload)
- View
  - 유저 인터랙션에 기반해 액션 발동
  - Store 구독 -> Store가 바뀔 때마다 View 업데이트
- Dispatcher
  - 1개만 존재
  - Action이 발동될 때 알맞는 Store에게 알림
- Store
  - 여러개의 스토어가 싱글톤 object로 유지됨
  - 액션에 대한 로직이 작성됨


### Redux

- Flux에 영감을 받은 라이브러리
- 스토어가 1개이고 디스패처 대신 리듀서를 씀

![redux](/redux.png)

- Action
- Component
- Reducer
  - 액션에 대한 로직이 작성됨
- Store
  - single
  - immutable

> Redux is a predictable state container for JavaScript apps.
---


### 리덕스를 쓰는 이유

- 복잡한 상태 변화를 예측 가능하고 추적 가능하게 만들 수 있음
- 상태 변화에 대한 테스트 코드를 작성하기 수월해짐

### 단점

- 많은 boilerplate 코드 발생 -> RTK로 어느정도 해소
- 데이터를 캐싱하거나 비동기 요청을 처리하기 위해선 별도의 미들웨어가 필요
- 높은 러닝 커브

---
## 대안
### Context API
- 대규모 프로젝트가 아닐 경우 리덕스 사용은 오버 엔지니어링일 수 있음
- 작은 프로젝트에서 사용하기 간편
- Provider 하위의 모든 consumer들은 Provider 속성이 변경될 때마다 다시 렌더링되기 때문에 성능이 비효율적이라는 단점이 있음
### React Query
- fetching, caching, synchronizing and updating server state
- 서버 데이터(상태)를 관리함으로써 컴포넌트의 전역 상태 갯수를 줄일 수 있음
### Recoil
- **atoms**(shared state)에서 **selectors**(pure functions)를 통해 **리액트 컴포넌트**로 흐르는 데이터 플로우 그래프 생성  
![recoil](/recoil.png)
- Atom
  - 상태 단위
  - atom이 업데이트 되면 atom을 구독하는 컴포넌트가 리렌더됨
  - 컴포넌트 로컬 상태 대체 가능
  - 유니크한 key 필요
- Selector
  - atom이나 다른 selector를 받아들이는 순수 함수
  - 상위 atom이나 selector가 업데이트 되면 selector 함수 재평가(re-evaluate)
  - 컴포넌트는 selector를 구독할 수 있고 selector가 업데이트되면 리렌더됨
  - 비동기 수행 가능
- 페이스북에서 개발 -> 리액트 기능들과 호환됨
---

## 참고
[Flux and Redux](https://medium.com/@sidathasiri/flux-and-redux-f6c9560997d7)  
[페이스북의 결정](https://blog.coderifleman.com/2015/06/19/mvc-does-not-scale-use-flux-instead/)  
[Recoil - 또 다른 React 상태 관리 라이브러리?](https://ui.toast.com/weekly-pick/ko_20200616)  
[내가 리덕스를 쓰지 않는 이유](https://kjwsx23.tistory.com/552)  
[Redux Alternative](https://blog.openreplay.com/redux-alternatives-in-2021)  
[Recoil Docs](https://recoiljs.org/)
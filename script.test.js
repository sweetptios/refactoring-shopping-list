import * as innerHTMLForTest from './scriptTestHTMLSetup.js';
import * as script from './script.js';
import * as elements from './elements.js';

window.alert = jest.fn();

beforeEach(() => {
  script.page.onClickClearAll();
});

describe('Add Item 버튼이 눌렸을 때, 입력값이 없으면', () => {
    let event;
    beforeEach(() => {
        event = dummyUIEvent();
        setItemInputValue('');
    });

    test('아이템을 저장하지 않는다', () => {
        script.page.onAddItemSubmit(event);

        expect(script.page.aStorage.allItems).toHaveLength(0);
    });
});

describe('Add Item 버튼이 눌렸을 때, 입력값이 있고 기존에 없는 값이면', () => {
    let event;
    let inputValue;
    beforeEach(() => {
        event = dummyUIEvent();
        inputValue = 'item1';
        setItemInputValue(inputValue);
        script.page.aStorage.saveAllItems(['item2', 'item3']);
    });

    test('아이템을 저장한다', () => {
        script.page.onAddItemSubmit(event);

        expect(script.page.aStorage.allItems).toContain(inputValue);
    });

    test('화면에 새로운 아이템을 표시한다', () => {
      script.page.onAddItemSubmit(event);

      let elements = filteredItemElementsBy(inputValue);
      expect(elements).toHaveLength(1);
  });

    test("입력값을 지운다.", () => {
        script.page.onAddItemSubmit(event);

        expect(itemInputValue()).toBe('');
    });
});

describe('Add Item 버튼이 눌렸을 때, 입력값이 있고 동일한 아이템이 이미 존재하면', () => {
    let event;
    let inputValue;
    beforeEach(() => {
        event = dummyUIEvent();
        inputValue = 'item1';
        setItemInputValue(inputValue);
        script.page.aStorage.saveAllItems([inputValue]);
    });

    test('아이템을 중복 저장하지 않는다', () => {
        script.page.onAddItemSubmit(event);

        const filteredItems = filteredLocalStorageItemsBy(inputValue);
        expect(filteredItems).toHaveLength(1);
    });

    test("입력값을 지우지 않는다", () => {
        script.page.onAddItemSubmit(event);

        expect(itemInputValue()).toBe(inputValue);
    });
});

describe('Update Item 버튼이 눌렸을 때', () => {
    let event;
    let itemTitle;
    let updatedItemTitle;
    beforeEach(() => {
      event = dummyUIEvent();
      itemTitle = 'oldItem';
      updatedItemTitle = 'updatedItem';
      // 1
      updateUserInputAndSubmitAdd(itemTitle);
      // 2
      const filtered = filteredItemElementsBy(itemTitle);
      script.page.setItemToEdit(filtered[0]);
      // 3
      setItemInputValue(updatedItemTitle);
    });

    test('저장된 아이템을 제거한다', () => {
        script.page.onAddItemSubmit(event);

        expect(script.page.aStorage.allItems).not.toContain(itemTitle);
    });

    test('화면에서 해당 아이템을 제거한다', () => {
      script.page.onAddItemSubmit(event);

      let elements = filteredItemElementsBy(itemTitle);
      expect(elements).toHaveLength(0);
    });

    test("아이템 편집 상태를 해제한다", () => {
        script.page.onAddItemSubmit(event);

        expect(script.page.aFormButton.isEditMode).toBeFalsy();
    });

    test('새로운 아이템을 저장한다', () => {
        script.page.onAddItemSubmit(event);

        expect(script.page.aStorage.allItems).toContain(updatedItemTitle);
    });

    test('화면에 새로운 아이템을 표시한다', () => {
        script.page.onAddItemSubmit(event);

        let elements = filteredItemElementsBy(updatedItemTitle);
        expect(elements).toHaveLength(1);
    });

    test("입력값을 지운다", () => {
        script.page.onAddItemSubmit(event);

        expect(itemInputValue()).toBe('');
    });
});

describe('아이템 영역이 눌렸을 때, 삭제 버튼 영역 안이였다면', () => {
  let clickedElement;

  beforeEach(() => {;
    let itemTitle = 'item1';
    // 1
    updateUserInputAndSubmitAdd(itemTitle);
    // 2
    const filtered = filteredItemElementsBy(itemTitle);
    clickedElement = deleteButtonInItemElement(filtered[0]);
    // 3
    global.confirm = jest.fn();
  });

  test('삭제 여부 확인 창을 띄운다', () => {
    let event = {
      target: clickedElement
    };
    script.page.onClickItem(event);

    // 메서드 호출 여부로 테스트 성공여부를 검증(= 행위 검증)
    expect(confirm).toHaveBeenCalled();
  });
});

describe('아이템 영역이 눌렸을 때, 삭제 버튼 영역 바깥쪽이었다면', () => {
  let clickedElement;
  let itemClickEvent;
  beforeEach(() => {
    let itemTitle = 'item1';
    // 1
    updateUserInputAndSubmitAdd(itemTitle);
    // 2
    const filtered = filteredItemElementsBy(itemTitle);
    clickedElement = filtered[0];
    // 3
    itemClickEvent = {
      target: clickedElement
    };
  });

  test('아이템 편집 상태를 활성화한다', () => {
    script.page.onClickItem(itemClickEvent);

    expect(script.page.aFormButton.isEditMode).toBeTruthy();
  });

  test('해당 아이템을 편집 모드로 표시한다', () => {
    script.page.onClickItem(itemClickEvent);

    const filteredItems = itemElements().filter(
      (i) => i.textContent.includes(clickedElement.textContent) && editingItemElement(i)
    );
    expect(filteredItems).toHaveLength(1);
  });

  test('해당되지 않는 아이템은 편집 모드로 표시하지 않는다', () => {
    script.page.onClickItem(itemClickEvent);
  
    const filteredItems = itemElements().filter(
      (i) => false == i.textContent.includes(clickedElement.textContent) && editingItemElement(i)
    );
    expect(filteredItems).toHaveLength(0);
  });

  test('검색어 입력창을 편집할 아이템의 텍스트로 채운다', () => {
    script.page.onClickItem(itemClickEvent);

    expect(itemInputValue()).toBe(clickedElement.textContent);
  });
});

describe('아이템 영역이 아닌 위치가 눌렸을 때', () => {
  let removeItemSpy;
  let setItemToEditSpy;
  let itemClickEvent;

  beforeEach(() => {
    // script 모듈의 removeItem과 setItemToEdit 함수를 스파이가 모킹한다.
    removeItemSpy = jest.spyOn(script.page, 'removeItem');
    setItemToEditSpy = jest.spyOn(script.page, 'setItemToEdit');

    itemClickEvent = {
      target: {
        parentElement: {
          classList: {
            contains: jest.fn().mockReturnValue(false)
          }
        },
        closest: jest.fn().mockReturnValue(null)
      }
    };
  });

  afterEach(() => {
    // 테스트 후 각 스파이를 복원한다.
    jest.restoreAllMocks();
  });

  test('아이템 삭제나 편집 동작을 수행하지 않는다', () => {
    script.page.onClickItem(itemClickEvent);

    expect(removeItemSpy).not.toHaveBeenCalled();
    expect(setItemToEditSpy).not.toHaveBeenCalled();
  });
});

describe('삭제 여부 확인 창에서 취소 버튼이 눌렸을 때', () => {
  let item;
  let itemTitle;

  afterEach(() => {
    jest.clearAllMocks();  // 각 테스트 후 모의 함수를 초기화
  });

  beforeEach(() => {
    itemTitle = 'item1';
    // 1
    updateUserInputAndSubmitAdd(itemTitle);
    // 2
    const filtered = filteredItemElementsBy(itemTitle);
    item = filtered[0];
    // 3
    global.confirm = jest.fn().mockReturnValue(false);
  });

  test('아이템을 저장소에서 제거하지 않는다', () => {
    script.page.removeItem(item);

    expect(script.page.aStorage.allItems).toContain(itemTitle);
  });

  test('아이템을 DOM에서 제거하지 않는다', () => {
    script.page.removeItem(item);

    expect(itemElements().map( (i) => i.textContent))
      .toContain(itemTitle);
  });
});

describe('삭제 여부 확인 창에서 확인 버튼이 눌렸을 때, 아이템이 하나이면', () => {
  let item;
  let itemTitle;

  afterEach(() => {
    jest.clearAllMocks();  // 각 테스트 후 모의 함수를 초기화
  });

  beforeEach(() => {
    itemTitle = 'item1';
    // 1
    updateUserInputAndSubmitAdd(itemTitle);
    // 2
    const filtered = filteredItemElementsBy(itemTitle);
    item = filtered[0];
    // 3
    global.confirm = jest.fn().mockReturnValue(true);
  });

  test('아이템을 저장소에서 제거한다', () => {
    script.page.removeItem(item);

    expect(script.page.aStorage.allItems).not.toContain(itemTitle);
  });

  test('필터링 영역을 표시하지 않는다', () => {
    script.page.removeItem(item);

    expect(script.page.anItemFilter.isHidden).toBeTruthy();
  });

  test('전체 삭제 버튼을 표시하지 않는다', () => {
    script.page.removeItem(item);

    expect(script.page.aClearButton.isHidden).toBeTruthy();
  });
});

describe('삭제 여부 확인 창에서 확인 버튼이 눌렸을 때, 아이템이 두 개이면', () => {
  let item1;
  let itemTitle1;

  afterEach(() => {
    jest.clearAllMocks();  // 각 테스트 후 모의 함수를 초기화
  });

  beforeEach(() => {
    itemTitle1 = 'item1';
    // 1
    updateUserInputAndSubmitAdd(itemTitle1);
    updateUserInputAndSubmitAdd('item2');
    // 2
    const filtered = filteredItemElementsBy(itemTitle1);
    item1 = filtered[0];
    // 3
    global.confirm = jest.fn().mockReturnValue(true);
  });

  test('아이템을 저장소에서 제거한다', () => {
    script.page.removeItem(item1);

    expect(script.page.aStorage.allItems).not.toContain(itemTitle1);
  });

  test('필터링 영역을 표시한다', () => {
    script.page.removeItem(item1);

    expect(script.page.anItemFilter.isDisplayed).toBeTruthy();
  });

  test('전체 삭제 버튼을 표시하지 않는다', () => {
    script.page.removeItem(item1);

    expect(script.page.aClearButton.isDisplayed).toBeTruthy();
  });
});

describe('검색어를 입력했을 때', () => {
  let searchKeyword;
  let searchKeywordEvent;
  beforeEach(() => {
    // 1
    updateUserInputAndSubmitAdd('notebook');
    updateUserInputAndSubmitAdd('ipad');
    // 2
    searchKeyword = 'note';
    searchKeywordEvent = {
      preventDefault: jest.fn(),
      target: { value: searchKeyword }
    };
  });

  test('검색 결과에 해당하는 아이템을 표시한다', () => {
    script.page.onEditingInput(searchKeywordEvent);

    const filteredItems = itemElements().filter(
      (i) => i.textContent.includes(searchKeyword) && hasFilteredItemStyle(i)
    );
    expect(filteredItems).toHaveLength(1);
  });

  test('검색 결과에 해당하지 않는 아이템은 표시하지 않는다', () => {
    script.page.onEditingInput(searchKeywordEvent);
    
    const filteredItems = itemElements().filter(
      (i) => i.textContent != searchKeyword && hasUnfilteredItemStyle(i)
    );
    expect(filteredItems).toHaveLength(1);
  });
});

describe('Clear All 버튼이 눌렸을 때', () => {
  beforeEach(() => {
    script.page.aStorage.saveAllItems(['item1', 'item2']);
  });

  test('모든 아이템을 저장소에서 제거한다', () => {
    script.page.onClickClearAll();

    expect(script.page.aStorage.allItems).toHaveLength(0);
  });

  test('모든 아이템을 화면에서 제거한다', () => {
    script.page.onClickClearAll();

    expect(itemElements()).toHaveLength(0);
  });
});

describe('Dom Content가 로드되었을 때', () => {
  let contents = ['item1', 'item2'];
  beforeEach(() => {
    script.page.aStorage.saveAllItems(contents);
  });

  test('저장된 아이템을 화면에 표시한다', () => {
    script.page.onDOMContentLoad();
    
    const items = itemElements().map(
      (i) => i.textContent
    );

    // items 배열과 contents 배열이 자료형과 내용이 완전히 동일한지를 검사한다. 
    // 만약 두 배열의 요소의 순서, 자료형, 내용이 완전히 같으면 테스트가 통과한다.
    // 하지만 만약 두 배열이 다른 요소 순서나 다른 요소를 포함하거나 자료형이 다르면 테스트는 실패하게 된다.
    expect(items).toStrictEqual(contents);
  });

  test('입력필드가 비어있어야 한다', () => {
    script.page.onDOMContentLoad();

    expect(itemInputValue()).toBe('');
  });

  test('아이템 편집상태가 아니어야 한다', () => {
    script.page.onDOMContentLoad();

    expect(script.page.aFormButton.isEditMode).toBeFalsy();
  });
});

const localStorageKey = 'items';

function dummyUIEvent() {
  return {
    preventDefault: jest.fn(),
    target: { value: 'Sample Value' }
  };
}

function filteredLocalStorageItemsBy(itemTitle) {
  return script.page.aStorage.allItems.filter(item => item === itemTitle);
}

function setItemInputValue(value) {
  script.page.anItemInput.updateValue(value);
}

function itemInputValue() {
  return script.page.anItemInput.uniqueValue;
}

function itemElements() {
  return Array.from(script.page.anItemList.allItems);
}

function filteredItemElementsBy(itemTitle) {
  return itemElements().filter((i) => i.textContent == itemTitle);
}

function hasFilteredItemStyle(element) {
  return element.style.display == elements.CSSDisplay.FLEX;
}

function hasUnfilteredItemStyle(element) {
  return element.style.display == elements.CSSDisplay.NONE;
}

function deleteButtonInItemElement(element) {
  return element.lastElementChild.lastElementChild;
}

function editingItemElement(element) {
  return element.classList.contains(script.page.anItemList.EDITMODE_ELEMENT_CLASS)
}

function updateUserInputAndSubmitAdd(itemTitle) {
  setItemInputValue(itemTitle);
  script.page.onAddItemSubmit(dummyUIEvent());
}
import { Slot, component$, useStyles$ } from "@builder.io/qwik";

const getKey = (setName: string, i: number) => {
  return `${setName}-tab${i}`;
};

export default component$(
  ({
    setName,
    titles,
    containerClasses = "",
    selectedTabTitle,
    handlesContainerClasses = "",
  }: {
    setName: string;
    titles: Array<string>;
    containerClasses?: string;
    selectedTabTitle?: string;
    handlesContainerClasses?: string;
  }) => {
    useStyles$(`
    .tabbed-container {
      margin: 32px 0;
      padding-bottom: 16px;
      border-bottom: 1px solid #ccc;
      width: 100%;
    }

    .tabbed-container [type="radio"] {
      /* hiding the inputs */
      display: none;
    }

    .tab-handles {
width: min-content;
      display: flex;
      align-items: stretch;
      list-style: none;
      padding: 0;
      border-bottom: 1px solid #ccc;
    }
    .tab-handle > label {
      display: block;
      margin-bottom: -1px;
      padding: 12px 15px;
      border: 1px solid #ccc;
      background: #eee;
      color: #666;
      font-size: 12px; 
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;	
      transition: all 0.3s;
    }
    .tab-handle:hover label {
      border-top-color: #333;
      color: #333;
    }

    .tab-content {
      display: none;
      color: #777;
    }

    /* As we cannot replace the numbers with variables or calls to element properties, the number of this selector parts is our tab-handle count limit */
    .tabbed-container [type="radio"]:nth-of-type(1):checked ~ .tab-handles .tab-handle:nth-of-type(1) label,
    .tabbed-container [type="radio"]:nth-of-type(2):checked ~ .tab-handles .tab-handle:nth-of-type(2) label,
    .tabbed-container [type="radio"]:nth-of-type(3):checked ~ .tab-handles .tab-handle:nth-of-type(3) label,
    .tabbed-container [type="radio"]:nth-of-type(4):checked ~ .tab-handles .tab-handle:nth-of-type(4) label,
    .tabbed-container [type="radio"]:nth-of-type(5):checked ~ .tab-handles .tab-handle:nth-of-type(5) label,
    .tabbed-container [type="radio"]:nth-of-type(6):checked ~ .tab-handles .tab-handle:nth-of-type(6) label,
    .tabbed-container [type="radio"]:nth-of-type(7):checked ~ .tab-handles .tab-handle:nth-of-type(7) label,
    .tabbed-container [type="radio"]:nth-of-type(8):checked ~ .tab-handles .tab-handle:nth-of-type(8) label,
    .tabbed-container [type="radio"]:nth-of-type(9):checked ~ .tab-handles .tab-handle:nth-of-type(9) label,
    .tabbed-container [type="radio"]:nth-of-type(10):checked ~ .tab-handles .tab-handle:nth-of-type(10) label,
    .tabbed-container [type="radio"]:nth-of-type(11):checked ~ .tab-handles .tab-handle:nth-of-type(11) label,
    .tabbed-container [type="radio"]:nth-of-type(12):checked ~ .tab-handles .tab-handle:nth-of-type(12) label,
    .tabbed-container [type="radio"]:nth-of-type(13):checked ~ .tab-handles .tab-handle:nth-of-type(13) label,
    .tabbed-container [type="radio"]:nth-of-type(14):checked ~ .tab-handles .tab-handle:nth-of-type(14) label,
    .tabbed-container [type="radio"]:nth-of-type(15):checked ~ .tab-handles .tab-handle:nth-of-type(15) label,
    .tabbed-container [type="radio"]:nth-of-type(16):checked ~ .tab-handles .tab-handle:nth-of-type(16) label,
    .tabbed-container [type="radio"]:nth-of-type(17):checked ~ .tab-handles .tab-handle:nth-of-type(17) label,
    .tabbed-container [type="radio"]:nth-of-type(18):checked ~ .tab-handles .tab-handle:nth-of-type(18) label,
    .tabbed-container [type="radio"]:nth-of-type(19):checked ~ .tab-handles .tab-handle:nth-of-type(19) label,
    .tabbed-container [type="radio"]:nth-of-type(20):checked ~ .tab-handles .tab-handle:nth-of-type(20) label,
    .tabbed-container [type="radio"]:nth-of-type(21):checked ~ .tab-handles .tab-handle:nth-of-type(21) label,
    .tabbed-container [type="radio"]:nth-of-type(22):checked ~ .tab-handles .tab-handle:nth-of-type(22) label,
    .tabbed-container [type="radio"]:nth-of-type(23):checked ~ .tab-handles .tab-handle:nth-of-type(23) label,
    .tabbed-container [type="radio"]:nth-of-type(24):checked ~ .tab-handles .tab-handle:nth-of-type(24) label {
      border-bottom-color: #fff;
      border-top-color: #B721FF;
      background: #fff;
      color: #222;
    }

    .tabbed-container [type="radio"]:nth-of-type(1):checked ~ .tab-content:nth-of-type(1),
    .tabbed-container [type="radio"]:nth-of-type(2):checked ~ .tab-content:nth-of-type(2),
    .tabbed-container [type="radio"]:nth-of-type(3):checked ~ .tab-content:nth-of-type(3),
    .tabbed-container [type="radio"]:nth-of-type(4):checked ~ .tab-content:nth-of-type(4),
    .tabbed-container [type="radio"]:nth-of-type(5):checked ~ .tab-content:nth-of-type(5),
    .tabbed-container [type="radio"]:nth-of-type(6):checked ~ .tab-content:nth-of-type(6),
    .tabbed-container [type="radio"]:nth-of-type(7):checked ~ .tab-content:nth-of-type(7),
    .tabbed-container [type="radio"]:nth-of-type(8):checked ~ .tab-content:nth-of-type(8),
    .tabbed-container [type="radio"]:nth-of-type(9):checked ~ .tab-content:nth-of-type(9),
    .tabbed-container [type="radio"]:nth-of-type(10):checked ~ .tab-content:nth-of-type(10),
    .tabbed-container [type="radio"]:nth-of-type(11):checked ~ .tab-content:nth-of-type(11),
    .tabbed-container [type="radio"]:nth-of-type(12):checked ~ .tab-content:nth-of-type(12),
    .tabbed-container [type="radio"]:nth-of-type(13):checked ~ .tab-content:nth-of-type(13),
    .tabbed-container [type="radio"]:nth-of-type(14):checked ~ .tab-content:nth-of-type(14),
    .tabbed-container [type="radio"]:nth-of-type(15):checked ~ .tab-content:nth-of-type(15),
    .tabbed-container [type="radio"]:nth-of-type(16):checked ~ .tab-content:nth-of-type(16),
    .tabbed-container [type="radio"]:nth-of-type(17):checked ~ .tab-content:nth-of-type(17),
    .tabbed-container [type="radio"]:nth-of-type(18):checked ~ .tab-content:nth-of-type(18),
    .tabbed-container [type="radio"]:nth-of-type(19):checked ~ .tab-content:nth-of-type(19),
    .tabbed-container [type="radio"]:nth-of-type(20):checked ~ .tab-content:nth-of-type(20),
    .tabbed-container [type="radio"]:nth-of-type(21):checked ~ .tab-content:nth-of-type(21),
    .tabbed-container [type="radio"]:nth-of-type(22):checked ~ .tab-content:nth-of-type(22),
    .tabbed-container [type="radio"]:nth-of-type(23):checked ~ .tab-content:nth-of-type(23),
    .tabbed-container [type="radio"]:nth-of-type(24):checked ~ .tab-content:nth-of-type(24) {
      display: block;
    }
    `);
    return (
      <div class={`tabbed-container ${containerClasses}`}>
        {titles.map((title, i) => {
          const key = getKey(setName, i);
          return (
            <TabInput
              key={key}
              idKey={key}
              setName={setName}
              checked={
                selectedTabTitle === undefined
                  ? i === 0
                  : selectedTabTitle === title
                  ? true
                  : false
              }
            />
          );
        })}

        <ul class={`tab-handles ${handlesContainerClasses}`}>
          {titles.map((title, i) => {
            const key = getKey(setName, i);
            return <TabLi key={key} idKey={key} title={title} />;
          })}
        </ul>

        {titles.map((title, i) => {
          const key = getKey(setName, i);
          return (
            <TabContent key={key} title={title}>
              <Slot name={key} />
            </TabContent>
          );
        })}
      </div>
    );
  }
);

const TabInput = ({
  idKey,
  setName,
  checked = false,
}: {
  idKey: string;
  setName: string;
  checked?: boolean;
}) => <input type="radio" id={idKey} name={setName} checked={checked} />;

const TabLi = ({ title, idKey }: { title: string; idKey: string }) => (
  <li class="tab-handle">
    <label for={idKey}>{title}</label>
  </li>
);

const TabContent = component$(({ title }: { title: string }) => {
  return (
    <div class="tab-content">
      <h4>{title}</h4>
      <Slot />
    </div>
  );
});

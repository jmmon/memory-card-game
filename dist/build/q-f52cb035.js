import{l as i,G as m,P as b,h as p,$ as t,w as a,c as d,_ as c,x as v,p as g}from"./q-b0c5ea11.js";import{c as h,a as y}from"./q-11895ed8.js";import{A as x}from"./q-7be8c47a.js";const C=()=>{const[e,r]=i();return e.board.getXYfromPosition(Number(r.card.position),e.settings.columnCount)},I=()=>{const[e,r]=i();return h(r.card,e.board.pairs)},f=e=>{const r=m(x),o=b(d(()=>c(()=>Promise.resolve().then(()=>n),void 0),"s_02A0Mx0CXyU",[r,e])),l=b(d(()=>c(()=>Promise.resolve().then(()=>n),void 0),"s_0LAOTdIFZ0k",[r,e])),u=b(d(()=>c(()=>Promise.resolve().then(()=>n),void 0),"s_0pF85YMkaoI",[r,e])),_=d(()=>c(()=>Promise.resolve().then(()=>n),void 0),"s_C7FLOyOtCME",[r,e]);return p(v,{children:t("div",{class:`flex flex-col h-full box-border p-2 cursor-pointer border rounded-xl border-gray-900 bg-gray-800 hover:border-gray-700 hover:bg-white hover:bg-opacity-25 transition-all ${u.value?"opacity-0 pointer-events-none":"opacity-100"} `},{onClick$:d(()=>c(()=>Promise.resolve().then(()=>n),void 0),"s_n5j6uAFhLos",[_,u]),style:a(s=>({gridColumn:`${s.value.x+1} / ${s.value.x+2}`,gridRow:`${s.value.y+1} / ${s.value.y+2}`}),[o])},[t("div",null,{class:"mb-2 text-gray-500 text-center"},a(s=>s.card.id,[e]),3,null),t("p",null,{class:"flex-1 text-sm"},a(s=>s.card.text,[e]),3,null),t("div",null,{class:"bg-gray-950 justify-self-end"},t("small",null,{class:"flex justify-between"},[t("b",null,null,["Pair ID: ",a(s=>s.card.pairId,[e])],3,null),t("b",null,{class:a(s=>s.value?"":"line-through text-gray-500",[l])},"SELECTED",3,null)],3,null),3,null)],3,null)},1,"Qe_9")},P=()=>{const[e,r]=i();return r.value?"":e()},E=()=>{const[e,r]=i();if(console.log("clicked"),e.board.selectedIds.includes(r.card.id)||h(r.card,e.board.pairs))return;e.board.selectedIds.push(r.card.id);const o=e.board.selectedIds;if(o.length>=2){const l=[e.board.cards[Number(o[0])],e.board.cards[Number(o[1])]].sort((_,s)=>Number(_.id)-Number(s.id));y(l[0],l[1])?e.board.pairs.push(`${Number(l[0].id)}:${Number(l[1].id)}`):e.board.mismatchCount++,e.board.selectedIds=[]}console.log("clicked card:",{card:r.card})},A=()=>{const[e,r]=i(),o=e.board.selectedIds.includes(r.card.id);return console.log({isSelected:o}),o},n=Object.freeze(Object.defineProperty({__proto__:null,_hW:g,s_02A0Mx0CXyU:C,s_0LAOTdIFZ0k:A,s_0pF85YMkaoI:I,s_1BsdU6z1Uog:f,s_C7FLOyOtCME:E,s_n5j6uAFhLos:P},Symbol.toStringTag,{value:"Module"}));export{g as _hW,C as s_02A0Mx0CXyU,A as s_0LAOTdIFZ0k,I as s_0pF85YMkaoI,f as s_1BsdU6z1Uog,E as s_C7FLOyOtCME,P as s_n5j6uAFhLos};
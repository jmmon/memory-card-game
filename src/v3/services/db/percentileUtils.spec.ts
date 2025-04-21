import { describe, it, expect } from "vitest";
import { Score, ScoreCount } from "~/v3/db/schemas/types";
import { getScoresByKey, scores100 } from "./test_utils";
import { updateWorseThanOurScoreMap_Orig, updateWorseThanOurScoreMap } from "./percentileUtils";
import {scores500} from "./test_scores_500";


// set up tests for existing logic
// I know this works, so I'm just writing tests to practice how the tests might look for v2
// and so hopefully I can compare some performances between the two.
//
// would need to set up like 10_000 scores for that though, instead of just 100
//
//
//
//
// INTERESTING:::
// looks like the NEW method (_r1) is actually SLOWER than the old methond when it comes to higher counts! (10_000)
// I think this is because slice and unshift methods require looping through the entire arrays, and these will
// happen pretty often.

const buildCounts = (scores: Score[], scoreCounts: ScoreCount, key: "mismatches" | "gameTimeDs") => {
  const countsKey = key === "mismatches" ? "worseThanOurMismatchesMap" : "worseThanOurGameTimeMap";
  // const [finalMapOld, finalMapNew] = scores.reduce((accum: [string, string], score, i) => {
  //   const prevTotal = i + 1; // for index 0 we should have 1 score, since we start with 1 in the json
  //   const old = updateWorseThanOurScoreMap_Orig(score, prevTotal, accum[0], key);
  //   const newMap = updateWorseThanOurScoreMap(score, prevTotal, accum[1], key);
  //   console.assert(newMap === old, `error:  on:`, {
  //     prevOld: accum[0],
  //     old,
  //     new: newMap,
  //     index: i,
  //     [key]: score[key],
  //   });
  //
  //   return [old, newMap];
  // }, [scoreCounts[countsKey], scoreCounts[countsKey]]);

  let oldTotalTimes = 0;
  let oldTotalCounts = 0;
  const finalMapOldOnly = scores.reduce((accum , score, i) => {
    const now = performance.now();

    const prevTotal = i + 1; // for index 0 we should have 1 score, since we start with 1 in the json
    const old = updateWorseThanOurScoreMap_Orig(score, prevTotal, accum, key);
    oldTotalTimes += performance.now() - now;
    oldTotalCounts ++;

    return old;
  }, scoreCounts[countsKey]);
  const oldAvgTime = oldTotalTimes / oldTotalCounts;


  let newTotalTimes = 0;
  let newTotalCounts = 0;
  const finalMapNewOnly = scores.reduce((accum , score, i) => {
    const now = performance.now();
    const prevTotal = i + 1; // for index 0 we should have 1 score, since we start with 1 in the json
    const newMap = updateWorseThanOurScoreMap(score, prevTotal, accum, key);
    newTotalTimes += performance.now() - now;
    newTotalCounts ++;

    return newMap;
  }, scoreCounts[countsKey]);
  const newAvgTime = newTotalTimes / newTotalCounts;

  console.log(`Timing for ${key} for length ${scores.length}`, {
    oldAvgTime,
    newAvgTime,
    diff:  oldAvgTime - (newAvgTime),
    percentTimeSaved: 100 - ((newAvgTime) / (oldAvgTime) * 100)
  });

  const totalOfEachScore = Object.fromEntries(Object.entries(scores100.reduce((accum: Record<number, number>, score) => {
    accum[score[key]] = (accum[score[key]] || 0) + 1;
    return accum;
  }, {})).sort(([sA], [sB]) => Number(sA) - Number(sB)));

  return {finalMapOld: finalMapOldOnly, finalMapNew: finalMapNewOnly, totalOfEachScore};
}


const multiplyArray = (scores: Score[], count: number) => {
  let newScores = scores;
  for (let i = 0; i < count - 1; i++) {
    newScores = newScores.concat(scores);
  }
  return newScores;
};
const multiplyJson = (json: string, count: number) => 
  JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(json) as Record<string, number>)
    .map(([k, v]) => [k, v * count])));

describe('percentileUtils', () => {
  describe('scores100 - old and revision 1', () => {
    const totalScores = scores100.length;
    const firstScore = scores100[0];
    const scores = scores100.slice(1);
    const scoreCounts: ScoreCount = {
      id: 0,
      createdAt: 123,
      deckSize: 18,
      worseThanOurMismatchesMap: `{"${firstScore.mismatches}":0}`,
      worseThanOurGameTimeMap: `{"${firstScore.gameTimeDs}":0}`,
      totalScores: 1,
    };


    describe('mismatches', () => {
      const {finalMapOld, finalMapNew, totalOfEachScore} = buildCounts(scores, scoreCounts, "mismatches");

      // console.log({totalOfEachScore});

      const finalMapJson = '{"0":87,"1":78,"2":72,"3":64,"4":57,"5":48,"6":40,"7":31,"8":19,"9":10,"10":0}';

      it('OLD: should match the expected json map', () => {
        expect(finalMapOld).toBe(finalMapJson);
      });
      it('NEW: should match the expected json map', () => {
        expect(finalMapNew).toBe(finalMapJson);
      });

      it('shoould match counts for the best score', () => {
        const allScoresWith0Mismatches = scores100.filter(score => score.mismatches === 0);
        const objOld = JSON.parse(finalMapOld);
        expect(allScoresWith0Mismatches.length).toBe(totalScores - objOld["0"])
        const objNew = JSON.parse(finalMapNew);
        expect(allScoresWith0Mismatches.length).toBe(totalScores - objNew["0"])
      });
    });

    describe('gametime', () => {
      const {finalMapOld, finalMapNew, totalOfEachScore} = buildCounts(scores, scoreCounts, "gameTimeDs");

      // console.log({totalOfEachScore});

      const finalMapJson = '{"0":99,"37":98,"39":97,"43":96,"54":95,"92":93,"107":92,"122":91,"134":90,"136":89,"142":88,"145":87,"149":86,"163":85,"167":84,"172":83,"187":82,"203":81,"211":79,"234":78,"238":77,"242":76,"256":75,"260":74,"270":73,"272":72,"292":71,"302":69,"312":68,"337":67,"349":66,"361":65,"363":64,"375":63,"379":62,"386":61,"394":60,"413":59,"414":58,"422":57,"437":56,"441":55,"450":54,"454":53,"471":52,"474":51,"479":50,"483":49,"493":48,"494":47,"499":46,"509":45,"536":44,"543":43,"544":42,"562":41,"573":40,"613":39,"614":38,"615":37,"616":36,"619":35,"622":34,"623":33,"630":32,"631":31,"633":30,"657":29,"661":28,"672":27,"678":26,"687":25,"692":24,"699":23,"706":22,"708":21,"723":20,"755":19,"759":18,"761":17,"806":16,"818":15,"832":14,"834":13,"860":12,"894":11,"913":10,"919":8,"920":7,"929":6,"955":5,"960":3,"971":2,"973":1,"986":0}';

      it('OLD: should match the expected json map', () => {
        expect(finalMapOld).toBe(finalMapJson);
      });
      it('NEW: should match the expected json map', () => {
        expect(finalMapNew).toBe(finalMapJson);
      });

      it('shoould match counts for the best score', () => {
        const { scoresByKey: scoresByGameTime } = getScoresByKey(scores100, "gameTimeDs");
        const [gameTimeScore, countOfLowestGameTimeScores ] = Object.entries(scoresByGameTime)
          .map(([k, v]) => [Number(k), v])[0]

        const objOld = JSON.parse(finalMapOld);
        expect(countOfLowestGameTimeScores).toBe(totalScores - objOld[gameTimeScore]);
        const objNew = JSON.parse(finalMapNew);
        expect(countOfLowestGameTimeScores).toBe(totalScores - objNew[gameTimeScore]);
      });
    });
  });

  describe('scores500 - old and revision 1', () => {
    const totalScores = scores500.length;
    const firstScore = scores500[0];
    const scores = scores500.slice(1);
    const scoreCounts: ScoreCount = {
      id: 0,
      createdAt: 123,
      deckSize: 18,
      worseThanOurMismatchesMap: `{"${firstScore.mismatches}":0}`,
      worseThanOurGameTimeMap: `{"${firstScore.gameTimeDs}":0}`,
      totalScores: 1,
    };


    describe('mismatches', () => {
      const {finalMapOld, finalMapNew, totalOfEachScore} = buildCounts(scores, scoreCounts, "mismatches");

      // console.log({totalOfEachScore});

      const finalMapJson = '{"0":410,"1":395,"2":387,"3":377,"4":369,"5":359,"6":352,"7":346,"8":338,"9":332,"10":321,"11":311,"12":307,"13":298,"14":291,"15":279,"16":260,"17":252,"18":244,"19":234,"20":223,"21":217,"22":205,"23":192,"24":182,"25":172,"26":163,"27":147,"28":137,"29":128,"30":115,"31":105,"32":95,"33":82,"34":72,"35":69,"36":65,"37":55,"38":48,"39":38,"40":25,"41":19,"42":12,"43":0}';

      it('should match the expected json map', () => {
        expect(finalMapOld).toBe(finalMapJson);
        expect(finalMapNew).toBe(finalMapJson);
      });

      it('should match counts for the best score', () => {
        const allScoresWith0Mismatches = scores500.filter(score => score.mismatches === 0);
        const objOld = JSON.parse(finalMapOld);
        expect(allScoresWith0Mismatches.length).toBe(totalScores - objOld["0"])
        const objNew = JSON.parse(finalMapNew);
        expect(allScoresWith0Mismatches.length).toBe(totalScores - objNew["0"])
      });
    });

    describe('gameTimeDs', () => {
      const {finalMapOld, finalMapNew, totalOfEachScore} = buildCounts(scores, scoreCounts, "gameTimeDs");

      // console.log({totalOfEachScore});

      const finalMapJson = '{"522":498,"524":497,"529":496,"532":495,"535":494,"536":493,"539":492,"541":490,"542":489,"546":487,"550":486,"552":484,"559":483,"560":481,"562":480,"564":478,"566":477,"570":475,"574":474,"575":473,"577":472,"585":471,"589":470,"594":469,"595":468,"596":467,"601":466,"611":464,"613":463,"617":462,"622":461,"623":459,"626":457,"627":456,"630":455,"631":454,"632":453,"634":452,"635":451,"637":450,"640":449,"645":448,"647":446,"651":445,"653":444,"654":443,"656":442,"657":441,"659":440,"661":439,"662":437,"665":436,"667":435,"669":434,"671":433,"675":432,"677":431,"681":430,"690":427,"691":426,"694":425,"696":424,"698":423,"700":422,"701":421,"705":420,"707":419,"708":418,"711":417,"716":416,"721":415,"725":413,"729":412,"731":410,"736":408,"737":407,"738":405,"739":404,"740":403,"742":400,"745":398,"747":397,"748":396,"751":394,"753":393,"755":392,"761":391,"764":388,"766":385,"767":384,"770":382,"777":381,"782":380,"783":379,"784":378,"785":376,"788":375,"790":374,"793":369,"794":368,"796":367,"799":366,"800":365,"801":364,"802":363,"806":362,"808":361,"809":360,"810":358,"816":357,"820":355,"823":354,"824":353,"826":350,"829":349,"831":348,"832":345,"833":344,"834":342,"835":341,"837":339,"844":338,"845":337,"846":336,"847":334,"848":333,"849":332,"856":331,"858":329,"859":328,"861":326,"863":324,"864":323,"865":321,"868":320,"870":319,"871":318,"872":317,"874":316,"876":315,"881":313,"882":312,"883":311,"884":310,"887":309,"889":307,"890":306,"891":305,"894":304,"895":303,"897":302,"898":299,"900":298,"902":297,"905":296,"907":295,"909":294,"916":293,"919":292,"920":291,"922":288,"930":287,"934":286,"936":285,"939":284,"941":283,"942":282,"944":281,"947":280,"949":279,"951":278,"952":277,"957":276,"958":274,"965":272,"966":271,"967":270,"974":269,"976":268,"979":266,"982":265,"984":264,"988":263,"989":262,"998":261,"999":260,"1000":258,"1001":256,"1006":254,"1012":253,"1014":252,"1016":251,"1017":250,"1018":248,"1020":247,"1021":246,"1026":244,"1031":243,"1035":242,"1037":241,"1041":240,"1042":239,"1043":238,"1051":237,"1052":235,"1053":234,"1056":233,"1058":232,"1065":231,"1066":230,"1067":229,"1068":226,"1069":225,"1072":223,"1074":221,"1077":220,"1080":219,"1085":218,"1086":217,"1092":216,"1094":215,"1099":214,"1100":213,"1101":212,"1107":211,"1109":210,"1110":209,"1113":207,"1115":206,"1116":204,"1120":203,"1121":201,"1122":200,"1124":199,"1125":198,"1126":196,"1128":195,"1130":194,"1133":191,"1134":190,"1136":189,"1139":188,"1140":187,"1143":185,"1147":184,"1148":183,"1150":182,"1152":181,"1156":179,"1158":178,"1161":177,"1163":176,"1165":175,"1166":174,"1170":173,"1172":172,"1173":171,"1174":169,"1175":168,"1179":166,"1182":165,"1183":164,"1185":163,"1191":162,"1192":161,"1195":160,"1196":159,"1197":158,"1199":157,"1202":155,"1206":153,"1210":152,"1214":151,"1215":150,"1216":148,"1222":147,"1223":146,"1226":145,"1228":144,"1232":143,"1236":142,"1242":141,"1243":140,"1246":139,"1247":137,"1251":136,"1252":135,"1253":134,"1258":132,"1263":131,"1265":129,"1268":126,"1269":125,"1273":123,"1277":122,"1278":121,"1282":120,"1283":118,"1286":117,"1291":116,"1294":115,"1295":114,"1297":113,"1300":111,"1301":110,"1305":109,"1308":108,"1311":107,"1313":106,"1316":105,"1318":104,"1319":103,"1328":101,"1331":100,"1332":99,"1333":98,"1334":97,"1339":96,"1343":93,"1344":92,"1346":91,"1348":90,"1349":89,"1353":87,"1354":86,"1355":85,"1357":83,"1358":80,"1360":79,"1361":78,"1367":77,"1368":76,"1369":75,"1370":73,"1371":71,"1376":70,"1381":69,"1382":68,"1383":67,"1387":66,"1389":65,"1390":63,"1391":60,"1395":59,"1398":58,"1399":57,"1400":56,"1402":55,"1403":54,"1404":53,"1406":52,"1407":51,"1408":50,"1409":49,"1415":47,"1423":46,"1425":45,"1427":43,"1429":41,"1430":40,"1431":38,"1436":37,"1438":35,"1439":34,"1440":32,"1444":31,"1446":29,"1451":28,"1453":27,"1454":26,"1464":24,"1468":23,"1473":21,"1478":19,"1479":17,"1484":16,"1488":15,"1491":14,"1492":13,"1494":11,"1495":10,"1496":9,"1497":7,"1498":6,"1502":5,"1507":4,"1511":2,"1516":1,"1520":0}';

      it('should match the expected json map', () => {
        expect(finalMapOld).toBe(finalMapJson);
        expect(finalMapNew).toBe(finalMapJson);
      });

      it('shoould match counts for the best score', () => {
        const { scoresByKey: scoresByGameTime } = getScoresByKey(scores500, "gameTimeDs");
        const [gameTimeScore, countOfLowestGameTimeScores ] = Object.entries(scoresByGameTime)
          .map(([k, v]) => [Number(k), v])[0]

        const objOld = JSON.parse(finalMapOld);
        expect(countOfLowestGameTimeScores).toBe(totalScores - objOld[gameTimeScore]);
        const objNew = JSON.parse(finalMapNew);
        expect(countOfLowestGameTimeScores).toBe(totalScores - objNew[gameTimeScore]);
      });
    });
  });


  describe('scores20_000 - old and revision 1', () => {
    const multiplier = 40;
    const scores20_000 = multiplyArray(scores500, multiplier);
    const totalScores = scores20_000.length;
    const firstScore = scores20_000[0];
    console.log({totalScores});
    const scores = scores20_000.slice(1);
    const scoreCounts: ScoreCount = {
      id: 0,
      createdAt: 123,
      deckSize: 18,
      worseThanOurMismatchesMap: `{"${firstScore.mismatches}":0}`,
      worseThanOurGameTimeMap: `{"${firstScore.gameTimeDs}":0}`,
      totalScores: 1,
    };


    describe('mismatches', () => {
      const {finalMapOld, finalMapNew, totalOfEachScore} = buildCounts(scores, scoreCounts, "mismatches");

      // console.log({totalOfEachScore});

      const finalMapJson = multiplyJson('{"0":410,"1":395,"2":387,"3":377,"4":369,"5":359,"6":352,"7":346,"8":338,"9":332,"10":321,"11":311,"12":307,"13":298,"14":291,"15":279,"16":260,"17":252,"18":244,"19":234,"20":223,"21":217,"22":205,"23":192,"24":182,"25":172,"26":163,"27":147,"28":137,"29":128,"30":115,"31":105,"32":95,"33":82,"34":72,"35":69,"36":65,"37":55,"38":48,"39":38,"40":25,"41":19,"42":12,"43":0}', multiplier);

      it('should match the expected json map', () => {
        expect(finalMapOld).toBe(finalMapJson);
        expect(finalMapNew).toBe(finalMapJson);
      });

      it('should match counts for the best score', () => {
        const allScoresWith0Mismatches = scores20_000.filter(score => score.mismatches === 0);
        const objOld = JSON.parse(finalMapOld);
        expect(allScoresWith0Mismatches.length).toBe(totalScores - objOld["0"])
        const objNew = JSON.parse(finalMapNew);
        expect(allScoresWith0Mismatches.length).toBe(totalScores - objNew["0"])
      });
    });

    describe('gameTimeDs', () => {
      const {finalMapOld, finalMapNew, totalOfEachScore} = buildCounts(scores, scoreCounts, "gameTimeDs");

      // console.log({totalOfEachScore});

      const finalMapJson = multiplyJson('{"522":498,"524":497,"529":496,"532":495,"535":494,"536":493,"539":492,"541":490,"542":489,"546":487,"550":486,"552":484,"559":483,"560":481,"562":480,"564":478,"566":477,"570":475,"574":474,"575":473,"577":472,"585":471,"589":470,"594":469,"595":468,"596":467,"601":466,"611":464,"613":463,"617":462,"622":461,"623":459,"626":457,"627":456,"630":455,"631":454,"632":453,"634":452,"635":451,"637":450,"640":449,"645":448,"647":446,"651":445,"653":444,"654":443,"656":442,"657":441,"659":440,"661":439,"662":437,"665":436,"667":435,"669":434,"671":433,"675":432,"677":431,"681":430,"690":427,"691":426,"694":425,"696":424,"698":423,"700":422,"701":421,"705":420,"707":419,"708":418,"711":417,"716":416,"721":415,"725":413,"729":412,"731":410,"736":408,"737":407,"738":405,"739":404,"740":403,"742":400,"745":398,"747":397,"748":396,"751":394,"753":393,"755":392,"761":391,"764":388,"766":385,"767":384,"770":382,"777":381,"782":380,"783":379,"784":378,"785":376,"788":375,"790":374,"793":369,"794":368,"796":367,"799":366,"800":365,"801":364,"802":363,"806":362,"808":361,"809":360,"810":358,"816":357,"820":355,"823":354,"824":353,"826":350,"829":349,"831":348,"832":345,"833":344,"834":342,"835":341,"837":339,"844":338,"845":337,"846":336,"847":334,"848":333,"849":332,"856":331,"858":329,"859":328,"861":326,"863":324,"864":323,"865":321,"868":320,"870":319,"871":318,"872":317,"874":316,"876":315,"881":313,"882":312,"883":311,"884":310,"887":309,"889":307,"890":306,"891":305,"894":304,"895":303,"897":302,"898":299,"900":298,"902":297,"905":296,"907":295,"909":294,"916":293,"919":292,"920":291,"922":288,"930":287,"934":286,"936":285,"939":284,"941":283,"942":282,"944":281,"947":280,"949":279,"951":278,"952":277,"957":276,"958":274,"965":272,"966":271,"967":270,"974":269,"976":268,"979":266,"982":265,"984":264,"988":263,"989":262,"998":261,"999":260,"1000":258,"1001":256,"1006":254,"1012":253,"1014":252,"1016":251,"1017":250,"1018":248,"1020":247,"1021":246,"1026":244,"1031":243,"1035":242,"1037":241,"1041":240,"1042":239,"1043":238,"1051":237,"1052":235,"1053":234,"1056":233,"1058":232,"1065":231,"1066":230,"1067":229,"1068":226,"1069":225,"1072":223,"1074":221,"1077":220,"1080":219,"1085":218,"1086":217,"1092":216,"1094":215,"1099":214,"1100":213,"1101":212,"1107":211,"1109":210,"1110":209,"1113":207,"1115":206,"1116":204,"1120":203,"1121":201,"1122":200,"1124":199,"1125":198,"1126":196,"1128":195,"1130":194,"1133":191,"1134":190,"1136":189,"1139":188,"1140":187,"1143":185,"1147":184,"1148":183,"1150":182,"1152":181,"1156":179,"1158":178,"1161":177,"1163":176,"1165":175,"1166":174,"1170":173,"1172":172,"1173":171,"1174":169,"1175":168,"1179":166,"1182":165,"1183":164,"1185":163,"1191":162,"1192":161,"1195":160,"1196":159,"1197":158,"1199":157,"1202":155,"1206":153,"1210":152,"1214":151,"1215":150,"1216":148,"1222":147,"1223":146,"1226":145,"1228":144,"1232":143,"1236":142,"1242":141,"1243":140,"1246":139,"1247":137,"1251":136,"1252":135,"1253":134,"1258":132,"1263":131,"1265":129,"1268":126,"1269":125,"1273":123,"1277":122,"1278":121,"1282":120,"1283":118,"1286":117,"1291":116,"1294":115,"1295":114,"1297":113,"1300":111,"1301":110,"1305":109,"1308":108,"1311":107,"1313":106,"1316":105,"1318":104,"1319":103,"1328":101,"1331":100,"1332":99,"1333":98,"1334":97,"1339":96,"1343":93,"1344":92,"1346":91,"1348":90,"1349":89,"1353":87,"1354":86,"1355":85,"1357":83,"1358":80,"1360":79,"1361":78,"1367":77,"1368":76,"1369":75,"1370":73,"1371":71,"1376":70,"1381":69,"1382":68,"1383":67,"1387":66,"1389":65,"1390":63,"1391":60,"1395":59,"1398":58,"1399":57,"1400":56,"1402":55,"1403":54,"1404":53,"1406":52,"1407":51,"1408":50,"1409":49,"1415":47,"1423":46,"1425":45,"1427":43,"1429":41,"1430":40,"1431":38,"1436":37,"1438":35,"1439":34,"1440":32,"1444":31,"1446":29,"1451":28,"1453":27,"1454":26,"1464":24,"1468":23,"1473":21,"1478":19,"1479":17,"1484":16,"1488":15,"1491":14,"1492":13,"1494":11,"1495":10,"1496":9,"1497":7,"1498":6,"1502":5,"1507":4,"1511":2,"1516":1,"1520":0}', multiplier);

      it('should match the expected json map', () => {
        expect(finalMapOld).toBe(finalMapJson);
        expect(finalMapNew).toBe(finalMapJson);
      });

      it('shoould match counts for the best score', () => {
        const { scoresByKey: scoresByGameTime } = getScoresByKey(scores20_000, "gameTimeDs");
        const [gameTimeScore, countOfLowestGameTimeScores ] = Object.entries(scoresByGameTime)
          .map(([k, v]) => [Number(k), v])[0]

        const objOld = JSON.parse(finalMapOld);
        expect(countOfLowestGameTimeScores).toBe(totalScores - objOld[gameTimeScore]);
        const objNew = JSON.parse(finalMapNew);
        expect(countOfLowestGameTimeScores).toBe(totalScores - objNew[gameTimeScore]);
      });
    });
  });
});

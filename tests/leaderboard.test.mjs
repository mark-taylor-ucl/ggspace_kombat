import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanName,readEntries,rankEntries,saveWin} from '../game/leaderboard.js';
const storage = () => {let value=null;return {getItem:()=>value,setItem:(_,v)=>{value=v;}};};
test('one match counts once and repeated names accumulate match wins',()=>{
 const s=storage();saveWin(s,'1',' Mark ');saveWin(s,'1','Mark');saveWin(s,'2','mark');saveWin(s,'3','Bolt');
 assert.deepEqual(rankEntries(readEntries(s)),[{name:'Mark',wins:2},{name:'Bolt',wins:1}]);
});
test('names are normalized and empty names rejected',()=>{
 assert.equal(cleanName('  A\n  B  '),'A B');assert.equal(cleanName('x'.repeat(30)).length,20);
 assert.throws(()=>saveWin(storage(),'1','   '));
});
test('corrupt storage recovers and save failures propagate for retry',()=>{
 assert.deepEqual(readEntries({getItem:()=>'{broken'}),[]);
 assert.throws(()=>saveWin({getItem:()=>null,setItem:()=>{throw Error('quota');}},'1','Mark'));
});

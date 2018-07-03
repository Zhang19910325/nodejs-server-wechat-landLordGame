/**
 * Created by zhangmiao on 2018/6/27.
 */

let GameConfig  = window.GameConfig;
let LandLord  = 1; //斗地主
let GoldenFlower  = 2; //炸金花
let TexasHoldem = 3;
let Upgrades = 4;
if (!GameConfig) {
    GameConfig = {
        games : [
            {id:LandLord, name:"斗地主"},
            {id:GoldenFlower, name:"炸金花"},
            {id:TexasHoldem, name:"德州扑克"},
            {id:Upgrades, name:"升级"},
        ]
    }
    GameConfig.LandLord = LandLord;
    GameConfig.GoldenFlower = GoldenFlower;
    GameConfig.TexasHoldem = TexasHoldem;
    GameConfig.Upgrades = Upgrades;
}
window.GameConfig = GameConfig;
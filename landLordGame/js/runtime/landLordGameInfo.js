/**
 * Created by zhangmiao on 2018/6/5.
 */

//注意："一局牌" 是一次输赢结束 ；"一回合" 是出牌到没人跟上为止
export default class LandLordGameInfo{
    robTime = 0;//抢地主的次数
    maxScore = 0;//抢地主的分数
    rate = 1;
    landLordSeatNo = null; //当前地主的座位号
    deskNo = null;//自己的桌号
    seatNo = null;//自己的座位号
    preSeatNo = null;//上一位座位号
    nextSeatNo = null;//下一位座位号
    currentDealSeatNo = null;//当前操作座位号
    lastDealSeatNo = null;//本回合上一位操作者座位号，
    players = null;

    reset(){
        this.maxScore = 0;//抢地主的分数
        this.rate = 1;
        this.landLordSeatNo = null; //当前地主的座位号
        //this.deskNo = null;//自己的桌号
        //this.seatNo = null;//自己的座位号
        //this.preSeatNo = null;//上一位座位号
        //this.nextSeatNo = null;//下一位座位号
        this.currentDealSeatNo = null;//当前操作座位号
        this.lastDealSeatNo = null;//本回合上一位操作者座位号，
        //this.players = null;
    }
}
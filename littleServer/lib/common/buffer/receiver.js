/**
 * Created by zhangmiao on 2018/5/11.
 */



const GET_INFO = 0;
const GET_PAYLOAD_LENGTH_16 = 1;
const GET_PAYLOAD_LENGTH_64 = 2;
const GET_MASK = 3;
const GET_DATA = 4;
const INFLATING = 5;

var Receiver = function(binaryType, extensions, maxPayload){
    "use strict";
    this._binaryType = binaryType || 'nodebuffer';
    this._extensions = extensions || {};
    this._maxPayload = maxPayload | 0;

    this._bufferedBytes = 0;
    this._buffers = [];

    //this._compressed = false;
    //this._payloadLength = 0;
};

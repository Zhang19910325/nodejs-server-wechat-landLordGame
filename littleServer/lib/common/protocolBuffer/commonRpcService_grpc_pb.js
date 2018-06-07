// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var commonRpcService_pb = require('./commonRpcService_pb.js');

function serialize_RouteRequest(arg) {
  if (!(arg instanceof commonRpcService_pb.RouteRequest)) {
    throw new Error('Expected argument of type RouteRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_RouteRequest(buffer_arg) {
  return commonRpcService_pb.RouteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_RouteResponse(arg) {
  if (!(arg instanceof commonRpcService_pb.RouteResponse)) {
    throw new Error('Expected argument of type RouteResponse');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_RouteResponse(buffer_arg) {
  return commonRpcService_pb.RouteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var RouteServiceService = exports.RouteServiceService = {
  route: {
    path: '/RouteService/route',
    requestStream: false,
    responseStream: false,
    requestType: commonRpcService_pb.RouteRequest,
    responseType: commonRpcService_pb.RouteResponse,
    requestSerialize: serialize_RouteRequest,
    requestDeserialize: deserialize_RouteRequest,
    responseSerialize: serialize_RouteResponse,
    responseDeserialize: deserialize_RouteResponse,
  },
};

exports.RouteServiceClient = grpc.makeGenericClientConstructor(RouteServiceService);

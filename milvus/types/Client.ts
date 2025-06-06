import { ChannelOptions } from '@grpc/grpc-js';
import { Options as LoaderOption } from '@grpc/proto-loader';
import { Options } from 'generic-pool';
import { ResStatus } from './';

/**
 * Configuration options for the Milvus client.
 */
export interface ClientConfig {
  id?: string;
  // The address of the Milvus server.
  address: string;
  // token
  // Accepts either `username:password` or `apikey` from Zilliz Cloud if you don't want to use `username` and `password` fields or you are using Zilliz Cloud serverless option
  token?: string;
  // Whether to use SSL encryption.
  ssl?: boolean;
  // The username to use for authentication.
  username?: string;
  // The password to use for authentication.
  password?: string;
  // Additional options to pass to the gRPC channel.
  channelOptions?: ChannelOptions;
  // The timeout for requests, in milliseconds.
  timeout?: number | string;
  // number of retries
  maxRetries?: number;
  // retry delay
  retryDelay?: number;
  // database name
  database?: string;
  // log level
  logLevel?: string;
  // log prefix
  logPrefix?: string;

  tls?: {
    // root certificate file path, it can be a CA PEM (Certificate Authority PEM) or Server PEM (Server Certificate PEM):
    rootCertPath?: string;
    // root certificate buffer
    rootCert?: Buffer;
    // private key path
    privateKeyPath?: string;
    // private key buffer
    privateKey?: Buffer;
    // certificate path
    certChainPath?: string;
    // certificate buffer
    certChain?: Buffer;
    // verify options
    verifyOptions?: Record<string, any>;
    // server name
    serverName?: string;
    // skip certificate check entirely
    skipCertCheck?: boolean;
  };

  // generic-pool options: refer to https://github.com/coopernurse/node-pool
  pool?: Options;

  // internal property for debug & test
  __SKIP_CONNECT__?: boolean;

  // loaderOptions : { longs: Function | Number | String },
  // Function converts int64 to Long.js format
  // Number converts int64 to number, it will lose precision
  // String converts int64 to string, it's the default behavior
  loaderOptions?: LoaderOption;

  // enable trace
  trace?: boolean;
}

export interface ServerInfo {
  build_tags?: string;
  build_time?: string;
  git_commit?: string;
  go_version?: string;
  deploy_mode?: string;
  reserved?: { [key: string]: any };
}

export interface RunAnalyzerRequest {
  analyzer_params: Record<string, any>;
  text: string | string[];
  with_detail: boolean;
  with_hash: boolean;
}

type AnalyzerToken = {
  token: string;
  start_offset: number;
  end_offset: number;
  position: number;
  position_length: number;
  hash: number;
};
export type AnalyzerResult = {
  tokens: AnalyzerToken[];
};

export interface RunAnalyzerResponse {
  status: ResStatus;
  results: AnalyzerResult[];
}

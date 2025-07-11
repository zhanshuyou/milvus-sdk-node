import {
  GrpcTimeOut,
  KeyValuePair,
  NumberArrayId,
  StringArrayId,
  keyValueObj,
  DataType,
  SegmentState,
  SegmentLevel,
  ImportState,
  ConsistencyLevelEnum,
  collectionNameReq,
  resStatusResponse,
  RANKER_TYPE,
  FunctionObject,
} from '../';

// all value types supported by milvus
export type FloatVector = number[];
export type Float16Vector = number[] | Uint8Array;
export type BFloat16Vector = number[] | Uint8Array;
export type BinaryVector = number[];
export type SparseVectorArray = (number | undefined)[];
export type SparseVectorDic = { [key: string]: number };
export type SparseVectorCSR = {
  indices: number[];
  values: number[];
};
export type Int8Vector = number[] | Int8Array;
export type SparseVectorCOO = { index: number; value: number }[];

export type SparseFloatVector =
  | SparseVectorArray
  | SparseVectorDic
  | SparseVectorCSR
  | SparseVectorCOO;

// export type SparseFloatVector = { [key: string]: number };
export type VectorTypes =
  | FloatVector
  | Float16Vector
  | BinaryVector
  | BFloat16Vector
  | SparseFloatVector
  | Int8Vector;
export type Bool = boolean;
export type Int8 = number;
export type Int16 = number;
export type Int32 = number;
export type Int64 = number;
export type Float = number;
export type Double = number;
export type VarChar = string;
export type JSON = {
  [key: string]: any;
};
export type Array =
  | Int8[]
  | Int16[]
  | Int32[]
  | Int64[]
  | Float[]
  | Double[]
  | VarChar[];

// Represents the possible data types for a field(cell)
export type FieldData =
  | Bool
  | Int8
  | Int16
  | Int32
  | Int64
  | Float
  | Double
  | VarChar
  | JSON
  | Array
  | VectorTypes
  | null
  | undefined;

// Represents a row of data in Milvus.
export interface RowData {
  [x: string]: FieldData;
}

export interface _Field {
  name: string;
  type: keyof typeof DataType;
  elementType?: keyof typeof DataType;
  data: FieldData[];
  dim?: number;
  nullable?: boolean;
  default_value?: FieldData;
}

export interface FlushReq extends GrpcTimeOut {
  collection_names: string[]; // collection names
  db_name?: string; // database name
}

export interface CountReq extends collectionNameReq {
  expr?: string; // filter expression
}

// because in javascript, there is no float16 and bfloat16 type
// we need to provide custom data transformer for these types
// milvus only accept bytes(buffer) for these types
export type InsertTransformers = {
  [DataType.BFloat16Vector]?: (bf16: BFloat16Vector) => Buffer;
  [DataType.Float16Vector]?: (f16: Float16Vector) => Buffer;
};

// Base properties shared by both variants
interface BaseInsertReq extends collectionNameReq {
  partition_name?: string; // partition name
  hash_keys?: number[]; // user can generate hash value depend on primarykey value
  transformers?: InsertTransformers; // provide custom data transformer for specific data type like bf16 or f16 vectors
  skip_check_schema?: boolean; // skip schema check
}

// Variant with data property
interface DataInsertReq extends BaseInsertReq {
  data: RowData[]; // data to insert
  fields_data?: never; // Ensure fields_data cannot be used
}

// Variant with fields_data property
interface FieldsDataInsertReq extends BaseInsertReq {
  fields_data: RowData[]; // alias for data
  data?: never; // Ensure data cannot be used
}

// Union type to enforce mutual exclusivity
export type InsertReq = DataInsertReq | FieldsDataInsertReq;

interface BaseDeleteReq extends collectionNameReq {
  partition_name?: string; // partition name
  consistency_level?:
    | 'Strong'
    | 'Session'
    | 'Bounded'
    | 'Eventually'
    | 'Customized'; // consistency level
  exprValues?: keyValueObj; // template values for filter expression, eg: {key: 'value'}
}

export type DeleteEntitiesReq = BaseDeleteReq &
  ({ expr?: string; filter?: never } | { filter?: string; expr?: never });

export interface DeleteByIdsReq extends BaseDeleteReq {
  ids: string[] | number[]; // primary key values
}

export interface DeleteByFilterReq extends BaseDeleteReq {
  filter: string; // filter expression
}

export type DeleteReq = DeleteByIdsReq | DeleteByFilterReq;

export interface CalcDistanceReq extends GrpcTimeOut {
  op_left: any;
  op_right: any;
  params: { key: string; value: string }[];
}

export interface GetFlushStateReq extends GrpcTimeOut {
  segmentIDs: number[]; // segment id array
}

export interface LoadBalanceReq extends GrpcTimeOut {
  src_nodeID: number; // The source query node id to balance.
  dst_nodeIDs?: number[]; // The destination query node ids to balance.
  sealed_segmentIDs?: number[]; // Sealed segment ids to balance.
}

export interface GetQuerySegmentInfoReq extends GrpcTimeOut {
  collectionName: string; // its collectioName, this is not colleciton_name :<
  dbName?: string; // database name
}

export interface GePersistentSegmentInfoReq extends GrpcTimeOut {
  collectionName: string; // its collectioName, this is not colleciton_name:<
  dbName?: string; // database name
}

export interface ImportReq extends collectionNameReq {
  partition_name?: string;
  channel_names?: string[];
  files: string[];
  options?: KeyValuePair[];
}

export interface ListImportTasksReq extends collectionNameReq {
  limit?: number; // maximum number of tasks returned, list all tasks if the value is 0
}

export interface GetImportStateReq extends GrpcTimeOut {
  task: number;
}

export interface GetFlushStateResponse extends resStatusResponse {
  flushed: boolean;
}

export interface GetMetricsResponse extends resStatusResponse {
  response: any;
  component_name: string; // metrics from which component
}

export interface QuerySegmentInfo {
  segmentID: number;
  collectionID: number;
  partitionID: number;
  mem_size: number;
  num_rows: number;
  index_name: string;
  indexID: number;
  nodeID: number; // deployed node id, use nodeIds instead
  state: SegmentState;
  nodeIds: number[];
  level: SegmentLevel;
}

export interface PersistentSegmentInfo {
  segmentID: number;
  collectionID: number;
  partitionID: number;
  num_rows: number;
  state: SegmentState;
}

export interface GetQuerySegmentInfoResponse extends resStatusResponse {
  infos: QuerySegmentInfo[];
}

export interface GePersistentSegmentInfoResponse extends resStatusResponse {
  infos: PersistentSegmentInfo[];
}

export interface MutationResult extends resStatusResponse {
  succ_index: Number[];
  err_index: Number[];
  acknowledged: boolean;
  insert_cnt: string;
  delete_cnt: string;
  upsert_cnt: string;
  timestamp: string; // we can use it do time travel
  IDs: StringArrayId | NumberArrayId;
}

export interface QueryResults extends resStatusResponse {
  data: Record<string, any>[];
}

export interface CountResult extends resStatusResponse {
  data: number;
}

export interface SearchResultData {
  [x: string]: any;
  score: number;
  id: string;
}

export type DetermineResultsType<T extends Record<string, any>> =
  T['vectors'] extends [VectorTypes]
    ? SearchResultData[]
    : T['vectors'] extends VectorTypes[]
    ? SearchResultData[][]
    : T['vector'] extends VectorTypes
    ? SearchResultData[]
    : T['data'] extends [any]
    ? SearchResultData[]
    : T['data'] extends VectorTypes[] | string[]
    ? SearchResultData[][]
    : SearchResultData[];

export interface SearchResults<
  T extends SearchReq | SearchSimpleReq | HybridSearchReq
> extends resStatusResponse {
  results: DetermineResultsType<T>;
  recalls: number[];
  session_ts: number;
  collection_name: string;
  all_search_count?: number;
  search_iterator_v2_results?: Record<string, any>;
  _search_iterator_v2_results?: string;
}

export interface ImportResponse extends resStatusResponse {
  tasks: number[];
}

export interface GetImportStateResponse extends resStatusResponse {
  state: ImportState;
  row_count: number;
  id_list: number[];
  infos: KeyValuePair[];
  id: number;
  collection_id: number;
  segment_ids: number[];
  create_ts: number;
}

export interface ListImportTasksResponse extends resStatusResponse {
  tasks: GetImportStateResponse[];
}

export interface GetMetricsRequest extends GrpcTimeOut {
  request: {
    metric_type: 'system_info' | 'system_statistics' | 'system_log';
  };
}

export interface SearchParam {
  anns_field: string; // your vector field name
  topk: string | number; // how many results you want
  metric_type: string; // distance metric type
  params: string; // extra search parameters
  offset?: number; // skip how many results
  round_decimal?: number; // round decimal
  ignore_growing?: boolean; // ignore growing
  group_by_field?: string; // group by field
  group_size?: number; // group size
  strict_group_size?: boolean; // if strict group size
  hints?: string; // hints to improve milvus search performance
  [key: string]: any; // extra search parameters
}

// old search api parameter type, deprecated
export interface SearchReq extends collectionNameReq {
  anns_field?: string; // your vector field name
  partition_names?: string[]; // partition names
  expr?: string; // filter expression
  exprValues?: keyValueObj; // template values for filter expression, eg: {key: 'value'}
  search_params: SearchParam; // search parameters
  vectors: VectorTypes[] | [VectorTypes]; // vectors to search
  output_fields?: string[]; // fields to return
  travel_timestamp?: string; // time travel
  vector_type: DataType.BinaryVector | DataType.FloatVector; // vector field type
  nq?: number; // number of query vectors
  consistency_level?: ConsistencyLevelEnum; // consistency level
  transformers?: OutputTransformers; // provide custom data transformer for specific data type like bf16 or f16 vectors
}

export type SearchTextType = string | string[] | [string];
export type SearchVectorType = VectorTypes | VectorTypes[] | [VectorTypes];
export type SearchDataType = SearchVectorType | SearchTextType;
export type SearchMultipleDataType = VectorTypes[] | SearchTextType[];

// simplified search api parameter type
export interface SearchSimpleReq extends collectionNameReq {
  partition_names?: string[]; // partition names
  anns_field?: string; // your vector field name，required if you are searching on multiple vector fields collection
  data?: SearchDataType; // vector or text to search
  vector?: VectorTypes; // alias for data, deprecated
  vectors?: VectorTypes[] | [VectorTypes]; // alias for data, deprecated
  output_fields?: string[];
  limit?: number; // how many results you want
  topk?: number; // limit alias
  offset?: number; // skip how many results
  filter?: string; // filter expression
  expr?: string; // alias for filter
  exprValues?: keyValueObj; // template values for filter expression, eg: {key: 'value'}
  params?: keyValueObj; // extra search parameters
  metric_type?: string; // distance metric type
  consistency_level?: ConsistencyLevelEnum; // consistency level
  ignore_growing?: boolean; // ignore growing
  group_by_field?: string; // group by field
  group_size?: number; // group size
  strict_group_size?: boolean; // if strict group size
  hints?: string; // hints to improve milvus search performance
  round_decimal?: number; // round decimal
  transformers?: OutputTransformers; // provide custom data transformer for specific data type like bf16 or f16 vectors
  rerank?: RerankerObj | FunctionObject; // reranker
}

export type HybridSearchSingleReq = Pick<
  SearchParam,
  'anns_field' | 'ignore_growing' | 'group_by_field'
> & {
  data: SearchDataType; // vector to search
  expr?: string; // filter expression
  exprValues?: keyValueObj; // template values for filter expression, eg: {key: 'value'}
  params?: keyValueObj; // extra search parameters
  transformers?: OutputTransformers; // provide custom data transformer for specific data type like bf16 or f16 vectors
};

export interface SearchIteratorReq
  extends Omit<SearchSimpleReq, 'vectors' | 'offset' | 'limit' | 'topk'> {
  limit?: number; // Optional. Specifies the maximum number of items. Default is no limit (-1 or if not set).
  batchSize: number; // Specifies the number of items to return in each batch. if it exceeds 16384, it will be set to 16384
  external_filter_fn?: (row: SearchResultData) => boolean; // Optional. Specifies the external filter function.
}

// rerank strategy and parameters
export type RerankerObj = {
  strategy: RANKER_TYPE | string; // rerank strategy
  params: keyValueObj; // rerank parameters
};

// hybrid search api parameter type
export type HybridSearchReq = Omit<
  SearchSimpleReq,
  | 'data'
  | 'vector'
  | 'vectors'
  | 'params'
  | 'anns_field'
  | 'expr'
  | 'exprValues'
> & {
  // search requests
  data: HybridSearchSingleReq[];

  params?: keyValueObj; //  search parameters

  rerank?: RerankerObj | FunctionObject; // reranker
};

// search api response type
export interface SearchRes extends resStatusResponse {
  results: {
    top_k: number;
    fields_data: {
      type: string;
      field_name: string;
      field_id: number;
      field: 'vectors' | 'scalars';
      vectors?: {
        dim: string;
        data: 'float_vector' | 'binary_vector';
        float_vector?: {
          data: number[];
        };
        binary_vector?: Buffer;
      };
      scalars: {
        [x: string]: any;
        data: string;
      };
    }[];
    scores: number[];
    ids: {
      int_id?: {
        data: number[];
      };
      str_id?: {
        data: string[];
      };
      id_field: 'int_id' | 'str_id';
    };
    num_queries: number;
    topks: number[];
    output_fields: string[];
    group_by_field_value: string;
    recalls: number[];
    search_iterator_v2_results?: Record<string, any>;
    _search_iterator_v2_results?: string;
    all_search_count?: number;
  };
  collection_name: string;
  session_ts: number;
}

// because in javascript, there is no float16 and bfloat16 type
// we need to provide custom data transformer for these types
export type OutputTransformers = {
  [DataType.BFloat16Vector]?: (bf16bytes: Uint8Array) => BFloat16Vector;
  [DataType.Float16Vector]?: (f16: Uint8Array) => Float16Vector;
  [DataType.SparseFloatVector]?: (sparse: SparseVectorDic) => SparseFloatVector;
  [DataType.Int8Vector]?: (int8Vector: Int8Array) => Int8Vector;
};

type BaseQueryReq = collectionNameReq & {
  output_fields?: string[]; // fields to return
  partition_names?: string[]; // partition names
  ids?: string[] | number[]; // primary key values
  expr?: string; // filter expression, or template string, eg: "key = {key}"
  filter?: string; // alias for expr
  offset?: number; // skip how many results
  limit?: number; // how many results you want
  consistency_level?: ConsistencyLevelEnum; // consistency level
  transformers?: OutputTransformers; // provide custom data transformer for specific data type like bf16 or f16 vectors
  exprValues?: keyValueObj; // template values for filter expression, eg: {key: 'value'}
};

export type QueryReq = BaseQueryReq &
  ({ expr?: string; filter?: never } | { filter?: string; expr?: never });

export interface QueryIteratorReq
  extends Omit<QueryReq, 'ids' | 'offset' | 'limit'> {
  limit?: number; // Optional. Specifies the maximum number of items. Default is no limit (-1 or if not set).
  batchSize: number; // Specifies the number of items to return in each batch. if it exceeds 16384, it will be set to 16384
}

export interface GetReq extends collectionNameReq {
  ids: string[] | number[]; // primary key values
  output_fields?: string[]; // fields to return
  partition_names?: string[]; // partition names
  offset?: number; // skip how many results
  limit?: number; // how many results you want
  consistency_level?: ConsistencyLevelEnum; // consistency level
}

export interface QueryRes extends resStatusResponse {
  fields_data: {
    type: DataType;
    field_name: string;
    field: 'vectors' | 'scalars';
    field_id: number;
    vectors?: {
      dim: string;
      data: 'float_vector' | 'binary_vector';
      float_vector?: {
        data: number[];
      };
      binary_vector?: Buffer;
    };
    scalars?: {
      // long_data: {data: [stringID]}
      [x: string]: any;
      data: string;
    };
    is_dynamic: boolean;
    valid_data: boolean[];
  }[];
  output_fields: string[];
  collection_name: string;
}

export interface FlushResult extends resStatusResponse {
  coll_segIDs: any; // collection segment id array
}

export interface ListIndexedSegmentReq extends collectionNameReq {
  index_name: string; // index name
}

export interface ListIndexedSegmentResponse extends resStatusResponse {
  segmentIDs: number[]; // indexed segment id array
}

export interface DescribeSegmentIndexDataReq extends collectionNameReq {
  index_name: string; // index name
  segmentsIDs: number[]; // segment id array
}

export interface DescribeSegmentIndexDataResponse extends resStatusResponse {
  index_params: any; // index parameters
  index_data: any; // index data
}

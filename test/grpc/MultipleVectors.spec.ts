import {
  MilvusClient,
  ErrorCode,
  DataType,
  IndexType,
  MetricType,
  RRFRanker,
  WeightedRanker,
} from '../../milvus';
import {
  IP,
  genCollectionParams,
  GENERATE_NAME,
  generateInsertData,
} from '../tools';

const milvusClient = new MilvusClient({ address: IP });
const COLLECTION_NAME = GENERATE_NAME();

const dbParam = {
  db_name: 'multiple_vectors',
};

const p = {
  collectionName: COLLECTION_NAME,
  vectorType: [DataType.FloatVector, DataType.FloatVector],
  dim: [8, 16],
};
const collectionParams = genCollectionParams(p);

describe(`Multiple vectors API testing`, () => {
  beforeAll(async () => {
    await milvusClient.createDatabase(dbParam);
    await milvusClient.use(dbParam);
  });

  afterAll(async () => {
    await milvusClient.dropCollection({ collection_name: COLLECTION_NAME });
    await milvusClient.dropDatabase(dbParam);
  });

  it(`Create collection with multiple vectors should be successful`, async () => {
    const create = await milvusClient.createCollection(collectionParams);

    expect(create.error_code).toEqual(ErrorCode.SUCCESS);

    const describe = await milvusClient.describeCollection({
      collection_name: COLLECTION_NAME,
    });

    const floatVectorFields = describe.schema.fields.filter(
      (field: any) => field.data_type === 'FloatVector'
    );
    expect(floatVectorFields.length).toBe(2);

    // console.dir(describe.schema, { depth: null });
  });

  it(`insert multiple vector data should be successful`, async () => {
    const data = generateInsertData(collectionParams.fields, 10);
    const insert = await milvusClient.insert({
      collection_name: COLLECTION_NAME,
      data,
    });

    expect(insert.status.error_code).toEqual(ErrorCode.SUCCESS);
    expect(insert.succ_index.length).toEqual(data.length);
  });

  it(`create multiple index should be successful`, async () => {
    const indexes = await milvusClient.createIndex([
      {
        collection_name: COLLECTION_NAME,
        field_name: 'vector',
        metric_type: MetricType.COSINE,
        index_type: IndexType.HNSW,
        params: {
          M: 5,
          efConstruction: 8,
        },
      },
      {
        collection_name: COLLECTION_NAME,
        field_name: 'vector1',
        metric_type: MetricType.COSINE,
        index_type: IndexType.AUTOINDEX,
      },
    ]);

    expect(indexes.error_code).toEqual(ErrorCode.SUCCESS);
  });

  it(`load multiple vector collection should be successful`, async () => {
    const load = await milvusClient.loadCollection({
      collection_name: COLLECTION_NAME,
    });

    expect(load.error_code).toEqual(ErrorCode.SUCCESS);
  });

  it(`query multiple vector collection should be successful`, async () => {
    const query = await milvusClient.query({
      collection_name: COLLECTION_NAME,
      filter: 'id > 0',
      output_fields: ['vector', 'vector1'],
    });

    expect(query.status.error_code).toEqual(ErrorCode.SUCCESS);

    const item = query.data[0];
    expect(item.vector.length).toEqual(p.dim[0]);
    expect(item.vector1.length).toEqual(p.dim[1]);
  });

  it(`search multiple vector collection with old search api should be successful`, async () => {
    // search default first vector field
    const search0 = await milvusClient.search({
      collection_name: COLLECTION_NAME,
      vector: [1, 2, 3, 4, 5, 6, 7, 8],
    });
    expect(search0.status.error_code).toEqual(ErrorCode.SUCCESS);

    // search specific vector field
    const search = await milvusClient.search({
      collection_name: COLLECTION_NAME,
      vector: [1, 2, 3, 4, 5, 6, 7, 8],
      anns_field: 'vector',
    });
    expect(search.status.error_code).toEqual(ErrorCode.SUCCESS);

    // search second vector field
    const search2 = await milvusClient.search({
      collection_name: COLLECTION_NAME,
      vector: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      anns_field: 'vector1',
      limit: 5,
    });

    expect(search2.status.error_code).toEqual(ErrorCode.SUCCESS);
    expect(search2.results.length).toEqual(5);

    // search first vector field
    const search3 = await milvusClient.search({
      collection_name: COLLECTION_NAME,
      vector: [1, 2, 3, 4, 5, 6, 7, 8],
    });

    expect(search3.status.error_code).toEqual(ErrorCode.SUCCESS);
    expect(search3.results.length).toEqual(search.results.length);
    expect(search3.results).toEqual(search.results);
  });

  it(`hybrid search with rrf ranker set should be successful`, async () => {
    const search = await milvusClient.hybridSearch({
      collection_name: COLLECTION_NAME,
      data: [
        {
          data: [1, 2, 3, 4, 5, 6, 7, 8],
          anns_field: 'vector',
          params: { nprobe: 2 },
        },
        {
          data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
          anns_field: 'vector1',
        },
      ],
      rerank: RRFRanker(),
      limit: 5,
      output_fields: ['id'],
    });

    expect(search.status.error_code).toEqual(ErrorCode.SUCCESS);
    expect(search.results.length).toEqual(5);
  });

  it(`hybrid search with weighted ranker set should be successful`, async () => {
    const search = await milvusClient.hybridSearch({
      collection_name: COLLECTION_NAME,
      data: [
        {
          data: [1, 2, 3, 4, 5, 6, 7, 8],
          anns_field: 'vector',
          params: { nprobe: 2 },
        },
        {
          data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
          anns_field: 'vector1',
        },
      ],
      rerank: WeightedRanker([0.9, 0.1]),
      limit: 5,
    });

    expect(search.status.error_code).toEqual(ErrorCode.SUCCESS);
    expect(search.results.length).toEqual(5);
  });

  it(`hybrid search without ranker set should be successful`, async () => {
    const search = await milvusClient.hybridSearch({
      collection_name: COLLECTION_NAME,
      data: [
        {
          data: [1, 2, 3, 4, 5, 6, 7, 8],
          anns_field: 'vector',
          params: { nprobe: 2 },
        },
        {
          data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
          anns_field: 'vector1',
        },
      ],
      limit: 5,
    });

    expect(search.status.error_code).toEqual(ErrorCode.SUCCESS);
    expect(search.results.length).toEqual(5);
  });

  it(`hybrid search with one vector should be successful`, async () => {
    const search = await milvusClient.hybridSearch({
      collection_name: COLLECTION_NAME,
      data: [
        {
          data: [1, 2, 3, 4, 5, 6, 7, 8],
          anns_field: 'vector',
          params: { nprobe: 2 },
        },
      ],
      limit: 5,
    });

    expect(search.status.error_code).toEqual(ErrorCode.SUCCESS);
    expect(search.results.length).toEqual(5);
  });

  it(`user can use search api for hybrid search`, async () => {
    const search = await milvusClient.search({
      collection_name: COLLECTION_NAME,
      data: [
        {
          data: [1, 2, 3, 4, 5, 6, 7, 8],
          anns_field: 'vector',
          params: { nprobe: 2 },
        },
        {
          data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
          anns_field: 'vector1',
        },
      ],
      limit: 5,
    });

    expect(search.status.error_code).toEqual(ErrorCode.SUCCESS);
    expect(search.results.length).toEqual(5);
  });

  it(`hybrid search result should be equal to the original search result`, async () => {
    const search = await milvusClient.search({
      collection_name: COLLECTION_NAME,
      data: [
        {
          data: [1, 2, 3, 4, 5, 6, 7, 8],
          anns_field: 'vector',
          params: { nprobe: 2 },
        },
      ],
      limit: 5,
    });

    const originSearch = await milvusClient.search({
      collection_name: COLLECTION_NAME,
      data: [1, 2, 3, 4, 5, 6, 7, 8],
      limit: 5,
    });

    expect(search.status.error_code).toEqual(ErrorCode.SUCCESS);
    expect(originSearch.status.error_code).toEqual(search.status.error_code);
    expect(originSearch.results.length).toEqual(search.results.length);

    expect(search.results.map(r => r.id)).toEqual(
      originSearch.results.map(r => r.id)
    );
  });
});
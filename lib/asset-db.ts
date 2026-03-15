export type StoredAssetRecord = {
  id: string
  draftKey: string
  name: string
  mimeType: string
  contentBase64: string
  updatedAt: number
}

const DB_NAME = 'pockethugo-assets'
const DB_VERSION = 1
const STORE_NAME = 'draft-assets'
const DRAFT_KEY_INDEX = 'by-draft-key'

function getIndexedDb() {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this environment.')
  }

  return indexedDB
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'))
  })
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'))
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'))
  })
}

async function openAssetDb() {
  const idb = getIndexedDb()
  const request = idb.open(DB_NAME, DB_VERSION)

  request.onupgradeneeded = () => {
    const db = request.result
    const store = db.objectStoreNames.contains(STORE_NAME)
      ? request.transaction?.objectStore(STORE_NAME)
      : db.createObjectStore(STORE_NAME, { keyPath: 'id' })

    if (store && !store.indexNames.contains(DRAFT_KEY_INDEX)) {
      store.createIndex(DRAFT_KEY_INDEX, 'draftKey', { unique: false })
    }
  }

  return requestToPromise(request)
}

function buildRecordId(draftKey: string, assetName: string) {
  return `${draftKey}::${assetName}`
}

export async function loadStoredAssetsForDraftKey(draftKey: string) {
  const db = await openAssetDb()
  const transaction = db.transaction(STORE_NAME, 'readonly')
  const store = transaction.objectStore(STORE_NAME)
  const index = store.index(DRAFT_KEY_INDEX)
  const records = await requestToPromise(index.getAll(draftKey))
  await transactionDone(transaction)

  return new Map(
    records.map((record) => [
      record.name,
      {
        mimeType: record.mimeType,
        contentBase64: record.contentBase64,
      },
    ]),
  )
}

export async function syncStoredAssetsForDraftKey(
  draftKey: string,
  assets: Array<{ name: string; mimeType: string; contentBase64: string }>,
) {
  const db = await openAssetDb()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)
  const index = store.index(DRAFT_KEY_INDEX)
  const existingKeys = (await requestToPromise(index.getAllKeys(draftKey))) as string[]

  const localAssets = assets.filter((asset) => asset.contentBase64.trim())
  const keepKeys = new Set<string>()

  for (const asset of localAssets) {
    const id = buildRecordId(draftKey, asset.name)
    keepKeys.add(id)
    store.put({
      id,
      draftKey,
      name: asset.name,
      mimeType: asset.mimeType,
      contentBase64: asset.contentBase64,
      updatedAt: Date.now(),
    } satisfies StoredAssetRecord)
  }

  for (const key of existingKeys) {
    if (!keepKeys.has(String(key))) {
      store.delete(key)
    }
  }

  await transactionDone(transaction)
}

export async function removeStoredAssetsForDraftKey(draftKey: string) {
  const db = await openAssetDb()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)
  const index = store.index(DRAFT_KEY_INDEX)
  const existingKeys = (await requestToPromise(index.getAllKeys(draftKey))) as string[]

  for (const key of existingKeys) {
    store.delete(key)
  }

  await transactionDone(transaction)
}

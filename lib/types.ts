export type Frontmatter = {
  description: string
  title: string
  slug: string
  date: string
  categories: string[]
  tags: string[]
  image: string
}

export type DraftAsset = {
  name: string
  mimeType: string
  contentBase64: string
  previewUrl: string
}

export type PostDraft = {
  folderName: string
  frontmatter: Frontmatter
  body: string
  assets: DraftAsset[]
}
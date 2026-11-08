import { Money, SelectionAttribute } from './common';

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  altText: string;
  /** Present on videos only. */
  thumbnailUrl?: string;
}

export interface ProductVariant {
  sku: string;
  selectionAttributes: SelectionAttribute[];
}

export interface Product {
  sku: string;
  name: string;
  description: string;
  shortDescription: string;
  price: Money;
  media: MediaItem[];
  attributeGroups: unknown[];
  marketingTags: string[];
  documents: unknown[];
  variants: ProductVariant[];
}

export interface FacetValue {
  type: 'string' | 'number';
  value: string | number;
  count: number;
}

export interface Facet {
  facetIdentifier: string;
  name: string;
  distinctFacetValues: FacetValue[];
}

/** GET /api/Products/search */
export interface ProductSearchResponse {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  items: Product[];
  facets?: Facet[];
}

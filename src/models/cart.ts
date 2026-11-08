import { Money, SelectionAttribute } from './common';

/** Mirrors src/data/api/heimerle_meule/cart_response_schema.json. */
export interface CartItem {
  sku: string;
  quantity: number;
  name: string;
  imageUrl: string | null;
  singleItemPrice: Money;
  itemTotalPrice: Money;
  selectionAttributes: SelectionAttribute[];
}

export interface TaxPortion {
  rate: number;
  name: string | null;
  amount: Money;
}

export interface Address {
  company: string | null;
  firstName: string | null;
  lastName: string | null;
  streetName: string;
  streetNumber: string;
  postCode: string;
  city: string;
  country: string;
}

export interface PaymentMethod {
  key: string;
  name: string;
  description: string;
  isDefault: boolean;
}

export interface Cart {
  items: CartItem[];
  cartTotal: Money;
  totalTax: Money;
  totalGross: Money;
  taxPortions: TaxPortion[];
  appliedVoucherCodes: string[];
  discountBySku: Record<string, Money>;
  discountTotalSku: Money;
  discountTotalShipping: Money;
  discountTotalNetCart: Money;
  discountTotalGrossCart: Money;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethodName: string | null;
  shippingMethodKey: string | null;
  shippingCost: Money;
  paymentMethod: PaymentMethod;
  customerComment: string | null;
  customerOrderReference: string | null;
  /** Seen in the Java discount tests but not (yet) in the schema file. */
  discountCode?: string | null;
}

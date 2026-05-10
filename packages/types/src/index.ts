import type { paths } from "./generated.js";

export type { components, operations, paths } from "./generated.js";

export type JsonApiResource<TType extends string, TAttrs> = {
  type: TType;
  id: string;
  attributes: TAttrs;
};

export type JsonApiSingle<T> = { data: T };

export type JsonApiCollection<T> = {
  data: T[];
  meta: { total: number; page: number; pageSize: number };
  links: { self: string; next: string | null; prev: string | null };
};

export type JsonApiCollectionWithIncluded<T, I> = JsonApiCollection<T> & {
  included: I[];
};

export type JsonApiSingleWithIncluded<T, I> = JsonApiSingle<T> & {
  included: I[];
};

export type JsonApiError = {
  status: string;
  code: string;
  title: string;
  detail?: string;
  source?: { pointer?: string; parameter?: string };
};

export type JsonApiErrors = { errors: JsonApiError[] };

type Json<T> = T extends { content: { "application/json": infer C } } ? C : never;
type AtPath<P> = P extends keyof paths ? paths[P] : never;
type AtOp<P, M extends string> =
  AtPath<P> extends infer T ? (T extends Record<string, unknown> ? (M extends keyof T ? T[M] : never) : never) : never;
type RequestJson<P, M extends string> = AtOp<P, M> extends { requestBody: infer B } ? Json<B> : never;
type ResponseJson<P, M extends string, S extends number> =
  AtOp<P, M> extends {
    responses: infer R;
  }
    ? S extends keyof R
      ? Json<R[S]>
      : never
    : never;

type SingleData<T> = T extends { data: infer D } ? D : never;
type CollectionItem<T> = T extends { data: Array<infer D> } ? D : never;
type QueryOf<P, M extends string> = AtOp<P, M> extends { parameters: { query: infer Q } } ? Q : never;
type Attributes<T> = T extends { attributes: infer A } ? A : never;
type RelationshipsOf<T> = T extends { relationships: infer R } ? R : never;

export type CustomerCollectionResponse = ResponseJson<"/api/customers", "get", 200>;
export type CustomerSingleResponse = ResponseJson<"/api/customers/{id}", "get", 200>;
export type CustomerData =
  CollectionItem<CustomerCollectionResponse> extends never
    ? SingleData<CustomerSingleResponse>
    : CollectionItem<CustomerCollectionResponse>;
export type CustomerAttributesData = Attributes<CustomerData>;
export type CustomerRelationshipsData = RelationshipsOf<CustomerData>;
export type CreateCustomerDTO = RequestJson<"/api/customers", "post">;
export type UpdateCustomerDTO = RequestJson<"/api/customers/{id}", "patch">;
export type ListCustomersFiltersDTO = QueryOf<"/api/customers", "get">;

export type OrderCollectionResponse = ResponseJson<"/api/orders", "get", 200>;
export type OrderSingleResponse = ResponseJson<"/api/orders/{id}", "get", 200>;
export type OrderData =
  CollectionItem<OrderCollectionResponse> extends never
    ? SingleData<OrderSingleResponse>
    : CollectionItem<OrderCollectionResponse>;
export type OrderAttributesData = Attributes<OrderData>;
export type OrderRelationshipsData = RelationshipsOf<OrderData>;
export type CreateOrderDTO = RequestJson<"/api/orders", "post">;
export type UpdateOrderStatusDTO = RequestJson<"/api/orders/{id}/status", "patch">;
export type ListOrdersFiltersDTO = QueryOf<"/api/orders", "get">;
export type OrderStatus = OrderData extends { attributes: { status: infer S } }
  ? S
  : OrderData extends { status: infer S }
    ? S
    : never;

type IncludedOf<T> = T extends { included?: Array<infer I> | null }
  ? I
  : T extends { included: Array<infer I> }
    ? I
    : never;
export type OrderIncludedResource = IncludedOf<OrderCollectionResponse>;
export type OrderListResponse = OrderCollectionResponse;
export type OrderShowResponse = OrderSingleResponse;

export type DishCollectionResponse = ResponseJson<"/api/menu/dishes", "get", 200>;
export type DishSingleResponse = ResponseJson<"/api/menu/dishes/{id}", "get", 200>;
export type DishData =
  CollectionItem<DishCollectionResponse> extends never
    ? SingleData<DishSingleResponse>
    : CollectionItem<DishCollectionResponse>;
export type DishAttributesData = Attributes<DishData>;
export type DishRelationshipsData = RelationshipsOf<DishData>;
export type CreateDishDTO = RequestJson<"/api/menu/dishes", "post">;
export type UpdateDishDTO = RequestJson<"/api/menu/dishes/{id}", "patch">;
export type ListDishesFiltersDTO = QueryOf<"/api/menu/dishes", "get">;

export type CategoryCollectionResponse = ResponseJson<"/api/menu/categories", "get", 200>;
export type CategoryData = CollectionItem<CategoryCollectionResponse>;
export type CategoryAttributesData = Attributes<CategoryData>;
export type CategoryRelationshipsData = RelationshipsOf<CategoryData>;

export type RestaurantSettingsSingleResponse = ResponseJson<"/api/settings", "get", 200>;
export type RestaurantSettingsData = SingleData<RestaurantSettingsSingleResponse>;
export type RestaurantSettingsAttributesData = Attributes<RestaurantSettingsData>;
export type RestaurantSettingsRelationshipsData = RelationshipsOf<RestaurantSettingsData>;
export type UpdateSettingsDTO = RequestJson<"/api/settings", "patch">;

export type UserSingleResponse = ResponseJson<"/api/auth/me", "get", 200>;
export type UserData = SingleData<UserSingleResponse>;
export type UserAttributesData = Attributes<UserData>;
export type UserRelationshipsData = RelationshipsOf<UserData>;

export type DashboardOverviewResponse = ResponseJson<"/api/dashboard/overview", "get", 200>;
export type DashboardOverviewData = SingleData<DashboardOverviewResponse>;

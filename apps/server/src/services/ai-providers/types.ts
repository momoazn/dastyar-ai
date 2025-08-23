import type { ModelProviderEnum } from './constants';

export type MinimalModel = { id: string };

export type ProviderId =
  (typeof ModelProviderEnum)[keyof typeof ModelProviderEnum];

export type ProviderFactory = (name: string) => unknown;

export type ProviderListFn = () => Promise<MinimalModel[]>;

export type ProviderFactoriesRegistry = Partial<
  Record<ProviderId, ProviderFactory>
>;

export type ProviderListRegistry = Partial<Record<ProviderId, ProviderListFn>>;

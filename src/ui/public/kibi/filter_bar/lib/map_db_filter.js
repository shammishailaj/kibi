import _ from 'lodash';

export default function mapTermsProvider(Promise, courier) {
  return function (filter) {
    if (filter.dbfilter) {
      return Promise.resolve({ key: filter.meta.key, value: filter.meta.value });
    }
    return Promise.reject(filter);
  };
};

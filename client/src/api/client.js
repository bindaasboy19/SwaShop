import axiosClient from './axiosClient.js';

export const apiGet = (url, config) => axiosClient.get(url, config);
export const apiPost = (url, data, config) => axiosClient.post(url, data, config);
export const apiPut = (url, data, config) => axiosClient.put(url, data, config);
export const apiPatch = (url, data, config) => axiosClient.patch(url, data, config);
export const apiDelete = (url, config) => axiosClient.delete(url, config);

export default axiosClient;

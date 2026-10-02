import api from './api';

function getAllUsers(filters = {}) {
  return api.get('/users', { params: filters }).then((res) => res.data);
}

export default { getAllUsers };

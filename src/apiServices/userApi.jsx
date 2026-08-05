import ApiHelper from "./config";

const userApiService = {
    getAllUsers: () => ApiHelper.get('/users/getallusers'),
    getAllUsersStoreWise: (payload) => ApiHelper.post('/users/getallusersStoreWise', payload),
    addUser: (payload) => ApiHelper.post('/users/adduser', payload),
    updateUser: (payload) => ApiHelper.post('/users/updateuser', payload),
    deleteUser: (payload) => ApiHelper.delete('/users/deleteuser', {data:payload})
}

export default userApiService;
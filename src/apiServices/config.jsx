import axios from 'axios';

const apiHelper = axios.create({
    baseURL: 'http://localhost:4000/',
    withCredentials:true,
    headers: {
        'Content-Type': 'application/json',
    },
})

export default apiHelper
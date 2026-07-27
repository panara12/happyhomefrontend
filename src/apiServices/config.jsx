import axios from 'axios';

const apiHelper = axios.create({
    baseURL:import.meta.env.VITE_SERVER_API,
    withCredentials:true,
    headers: {
        'Content-Type': 'application/json',
    },
})

export default apiHelper